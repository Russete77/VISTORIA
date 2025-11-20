-- Migration: Team Management System
-- Created: 2025-01-19
-- Description: Add team members, invites, and activity tracking

-- =============================================================================
-- ENUMS
-- =============================================================================

-- Team member roles
CREATE TYPE team_role AS ENUM ('owner', 'admin', 'member', 'viewer');

-- Team member status
CREATE TYPE team_member_status AS ENUM ('active', 'pending', 'inactive');

-- Team invite status
CREATE TYPE team_invite_status AS ENUM ('pending', 'accepted', 'expired', 'cancelled');

-- =============================================================================
-- TEAM MEMBERS TABLE
-- =============================================================================

CREATE TABLE team_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  name TEXT NOT NULL,
  role team_role NOT NULL DEFAULT 'member',
  status team_member_status NOT NULL DEFAULT 'pending',
  invited_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  accepted_at TIMESTAMPTZ,
  last_active_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at TIMESTAMPTZ,

  -- Constraints
  CONSTRAINT team_members_unique_user_email UNIQUE(user_id, email),
  CONSTRAINT team_members_accepted_at_check CHECK (
    (status = 'active' AND accepted_at IS NOT NULL) OR
    (status != 'active')
  )
);

-- Indexes
CREATE INDEX idx_team_members_user_id ON team_members(user_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_team_members_status ON team_members(status) WHERE deleted_at IS NULL;
CREATE INDEX idx_team_members_role ON team_members(role) WHERE deleted_at IS NULL;
CREATE INDEX idx_team_members_email ON team_members(email) WHERE deleted_at IS NULL;

-- Comments
COMMENT ON TABLE team_members IS 'Team members for multi-user collaboration';
COMMENT ON COLUMN team_members.user_id IS 'Owner of the team (who invited this member)';
COMMENT ON COLUMN team_members.email IS 'Email of the team member';
COMMENT ON COLUMN team_members.name IS 'Name of the team member';
COMMENT ON COLUMN team_members.role IS 'Role: owner, admin, member, viewer';
COMMENT ON COLUMN team_members.status IS 'Status: active, pending, inactive';

-- =============================================================================
-- TEAM INVITES TABLE
-- =============================================================================

CREATE TABLE team_invites (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  role team_role NOT NULL DEFAULT 'member',
  token TEXT NOT NULL UNIQUE,
  status team_invite_status NOT NULL DEFAULT 'pending',
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Constraints
  CONSTRAINT team_invites_unique_user_email UNIQUE(user_id, email, status),
  CONSTRAINT team_invites_expires_at_future CHECK (expires_at > created_at)
);

-- Indexes
CREATE INDEX idx_team_invites_user_id ON team_invites(user_id);
CREATE INDEX idx_team_invites_token ON team_invites(token) WHERE status = 'pending';
CREATE INDEX idx_team_invites_status ON team_invites(status);
CREATE INDEX idx_team_invites_email ON team_invites(email);

-- Comments
COMMENT ON TABLE team_invites IS 'Pending invitations to join team';
COMMENT ON COLUMN team_invites.token IS 'Unique token for accepting invite';
COMMENT ON COLUMN team_invites.expires_at IS 'Invite expiration date (7 days from creation)';

-- =============================================================================
-- TEAM ACTIVITY LOG TABLE
-- =============================================================================

CREATE TABLE team_activity_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  team_member_id UUID REFERENCES team_members(id) ON DELETE SET NULL,
  action TEXT NOT NULL,
  entity_type TEXT,
  entity_id UUID,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_team_activity_user_id ON team_activity_log(user_id);
CREATE INDEX idx_team_activity_team_member_id ON team_activity_log(team_member_id);
CREATE INDEX idx_team_activity_entity ON team_activity_log(entity_type, entity_id);
CREATE INDEX idx_team_activity_created_at ON team_activity_log(created_at DESC);

-- Comments
COMMENT ON TABLE team_activity_log IS 'Activity log for team actions';
COMMENT ON COLUMN team_activity_log.action IS 'Action performed (e.g., "completed_inspection", "generated_report")';
COMMENT ON COLUMN team_activity_log.entity_type IS 'Type of entity affected (e.g., "inspection", "property")';
COMMENT ON COLUMN team_activity_log.entity_id IS 'ID of the affected entity';
COMMENT ON COLUMN team_activity_log.metadata IS 'Additional metadata as JSONB';

-- =============================================================================
-- TRIGGERS
-- =============================================================================

-- Auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION update_team_members_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER team_members_updated_at
  BEFORE UPDATE ON team_members
  FOR EACH ROW
  EXECUTE FUNCTION update_team_members_updated_at();

-- Auto-create owner as first team member when user signs up
CREATE OR REPLACE FUNCTION create_owner_team_member()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO team_members (
    user_id,
    email,
    name,
    role,
    status,
    accepted_at,
    last_active_at
  ) VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.full_name, NEW.email),
    'owner',
    'active',
    NOW(),
    NOW()
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER create_owner_team_member_on_user_insert
  AFTER INSERT ON users
  FOR EACH ROW
  EXECUTE FUNCTION create_owner_team_member();

-- Auto-expire old invites
CREATE OR REPLACE FUNCTION expire_old_team_invites()
RETURNS void AS $$
BEGIN
  UPDATE team_invites
  SET status = 'expired'
  WHERE status = 'pending'
    AND expires_at < NOW();
END;
$$ LANGUAGE plpgsql;

-- =============================================================================
-- ROW LEVEL SECURITY
-- =============================================================================

ALTER TABLE team_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE team_invites ENABLE ROW LEVEL SECURITY;
ALTER TABLE team_activity_log ENABLE ROW LEVEL SECURITY;

-- Team Members Policies
-- Note: auth.uid() returns clerk_id (TEXT), so we need to convert it to user.id (UUID)

CREATE POLICY "Users can view their team members"
  ON team_members FOR SELECT
  USING (
    user_id IN (SELECT id FROM users WHERE clerk_id = auth.uid()::text)
  );

CREATE POLICY "Owners and admins can insert team members"
  ON team_members FOR INSERT
  WITH CHECK (
    user_id IN (SELECT id FROM users WHERE clerk_id = auth.uid()::text)
    AND (
      SELECT role FROM team_members
      WHERE user_id IN (SELECT id FROM users WHERE clerk_id = auth.uid()::text)
        AND email IN (SELECT email FROM users WHERE clerk_id = auth.uid()::text)
        AND deleted_at IS NULL
      LIMIT 1
    ) IN ('owner', 'admin')
  );

CREATE POLICY "Owners and admins can update team members"
  ON team_members FOR UPDATE
  USING (
    user_id IN (SELECT id FROM users WHERE clerk_id = auth.uid()::text)
    AND (
      SELECT role FROM team_members
      WHERE user_id IN (SELECT id FROM users WHERE clerk_id = auth.uid()::text)
        AND email IN (SELECT email FROM users WHERE clerk_id = auth.uid()::text)
        AND deleted_at IS NULL
      LIMIT 1
    ) IN ('owner', 'admin')
  );

CREATE POLICY "Owners and admins can delete team members"
  ON team_members FOR DELETE
  USING (
    user_id IN (SELECT id FROM users WHERE clerk_id = auth.uid()::text)
    AND role != 'owner'  -- Cannot delete owner
    AND (
      SELECT role FROM team_members
      WHERE user_id IN (SELECT id FROM users WHERE clerk_id = auth.uid()::text)
        AND email IN (SELECT email FROM users WHERE clerk_id = auth.uid()::text)
        AND deleted_at IS NULL
      LIMIT 1
    ) IN ('owner', 'admin')
  );

-- Team Invites Policies
CREATE POLICY "Users can view their invites"
  ON team_invites FOR SELECT
  USING (
    user_id IN (SELECT id FROM users WHERE clerk_id = auth.uid()::text)
  );

CREATE POLICY "Owners and admins can create invites"
  ON team_invites FOR INSERT
  WITH CHECK (
    user_id IN (SELECT id FROM users WHERE clerk_id = auth.uid()::text)
  );

CREATE POLICY "Users can update their invites"
  ON team_invites FOR UPDATE
  USING (
    user_id IN (SELECT id FROM users WHERE clerk_id = auth.uid()::text)
  );

-- Team Activity Log Policies
CREATE POLICY "Users can view their team activity"
  ON team_activity_log FOR SELECT
  USING (
    user_id IN (SELECT id FROM users WHERE clerk_id = auth.uid()::text)
  );

CREATE POLICY "Users can insert team activity"
  ON team_activity_log FOR INSERT
  WITH CHECK (
    user_id IN (SELECT id FROM users WHERE clerk_id = auth.uid()::text)
  );

-- =============================================================================
-- HELPER FUNCTIONS
-- =============================================================================

-- Function to get team member stats
CREATE OR REPLACE FUNCTION get_team_member_stats(member_id UUID)
RETURNS TABLE (
  inspections_count BIGINT,
  reports_generated BIGINT,
  last_inspection_date TIMESTAMPTZ
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    COUNT(DISTINCT i.id) as inspections_count,
    COUNT(DISTINCT i.id) FILTER (WHERE i.report_url IS NOT NULL) as reports_generated,
    MAX(i.completed_at) as last_inspection_date
  FROM inspections i
  INNER JOIN team_members tm ON tm.user_id = i.user_id AND tm.id = member_id
  WHERE i.deleted_at IS NULL;
END;
$$ LANGUAGE plpgsql;

-- Function to check if user can add more team members
CREATE OR REPLACE FUNCTION can_add_team_member(p_user_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
  v_tier TEXT;
  v_member_count BIGINT;
  v_limit INTEGER;
BEGIN
  -- Get user tier
  SELECT tier INTO v_tier FROM users WHERE id = p_user_id;

  -- Get current member count
  SELECT COUNT(*) INTO v_member_count
  FROM team_members
  WHERE user_id = p_user_id
    AND deleted_at IS NULL;

  -- Determine limit based on tier
  v_limit := CASE v_tier
    WHEN 'professional' THEN 3
    WHEN 'business' THEN 10
    WHEN 'enterprise' THEN 999
    ELSE 1
  END;

  RETURN v_member_count < v_limit;
END;
$$ LANGUAGE plpgsql;

-- Function to log team activity
CREATE OR REPLACE FUNCTION log_team_activity(
  p_user_id UUID,
  p_team_member_id UUID,
  p_action TEXT,
  p_entity_type TEXT DEFAULT NULL,
  p_entity_id UUID DEFAULT NULL,
  p_metadata JSONB DEFAULT '{}'::jsonb
)
RETURNS UUID AS $$
DECLARE
  v_activity_id UUID;
BEGIN
  INSERT INTO team_activity_log (
    user_id,
    team_member_id,
    action,
    entity_type,
    entity_id,
    metadata
  ) VALUES (
    p_user_id,
    p_team_member_id,
    p_action,
    p_entity_type,
    p_entity_id,
    p_metadata
  ) RETURNING id INTO v_activity_id;

  RETURN v_activity_id;
END;
$$ LANGUAGE plpgsql;

-- =============================================================================
-- CREATE OWNER TEAM MEMBERS FOR EXISTING USERS
-- =============================================================================

-- Create owner team member for all existing users that don't have one
INSERT INTO team_members (user_id, email, name, role, status, accepted_at, last_active_at)
SELECT
  id,
  email,
  COALESCE(full_name, email),
  'owner',
  'active',
  NOW(),
  last_login_at
FROM users
WHERE NOT EXISTS (
  SELECT 1 FROM team_members
  WHERE team_members.user_id = users.id
    AND team_members.role = 'owner'
);

-- =============================================================================
-- EXAMPLE QUERIES
-- =============================================================================

-- Get all team members with stats
-- SELECT
--   tm.*,
--   (SELECT inspections_count FROM get_team_member_stats(tm.id)) as inspections_count,
--   (SELECT reports_generated FROM get_team_member_stats(tm.id)) as reports_generated,
--   (SELECT last_inspection_date FROM get_team_member_stats(tm.id)) as last_inspection_date
-- FROM team_members tm
-- WHERE tm.user_id = 'USER_ID' AND tm.deleted_at IS NULL;

-- Check if user can add more members
-- SELECT can_add_team_member('USER_ID');

-- Log team activity
-- SELECT log_team_activity(
--   'USER_ID',
--   'TEAM_MEMBER_ID',
--   'completed_inspection',
--   'inspection',
--   'INSPECTION_ID',
--   '{"property_name": "Casa Exemplo"}'::jsonb
-- );

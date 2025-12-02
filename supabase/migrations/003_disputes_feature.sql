-- Migration: Disputes Feature (Área de Contestação)
-- Created: 2025-11-20
-- Description: Add tables for tenant disputes system with protocol-based access

-- =============================================================================
-- DISPUTES TABLE
-- =============================================================================
-- Main disputes table for tenant contestations
CREATE TABLE IF NOT EXISTS disputes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  inspection_id UUID NOT NULL REFERENCES inspections(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  protocol VARCHAR(20) NOT NULL UNIQUE,

  -- Tenant information
  tenant_name VARCHAR(200) NOT NULL,
  tenant_email VARCHAR(255) NOT NULL,
  tenant_phone VARCHAR(20),

  -- Dispute details
  item_description TEXT NOT NULL,
  item_location TEXT,
  category VARCHAR(50) NOT NULL CHECK (category IN (
    'damage_assessment',
    'missing_item',
    'cleaning_standard',
    'appliance_condition',
    'general_condition',
    'other'
  )),
  severity VARCHAR(20) NOT NULL CHECK (severity IN ('low', 'medium', 'high', 'urgent')),

  -- Dispute content
  description TEXT NOT NULL,
  tenant_notes TEXT,

  -- Status tracking
  status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN (
    'pending',
    'under_review',
    'accepted',
    'rejected',
    'resolved'
  )),

  -- Resolution
  resolution_notes TEXT,
  resolved_by UUID REFERENCES users(id),
  resolved_at TIMESTAMPTZ,

  -- Access control
  access_token TEXT NOT NULL UNIQUE,

  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  deleted_at TIMESTAMPTZ
);

-- Indexes for disputes
CREATE INDEX idx_disputes_inspection_id ON disputes(inspection_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_disputes_user_id ON disputes(user_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_disputes_protocol ON disputes(protocol);
CREATE INDEX idx_disputes_tenant_email ON disputes(tenant_email);
CREATE INDEX idx_disputes_status ON disputes(status) WHERE deleted_at IS NULL;
CREATE INDEX idx_disputes_category ON disputes(category) WHERE deleted_at IS NULL;
CREATE INDEX idx_disputes_created_at ON disputes(created_at DESC);

-- =============================================================================
-- DISPUTE MESSAGES TABLE
-- =============================================================================
-- Timeline of messages between tenant and admin
CREATE TABLE IF NOT EXISTS dispute_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  dispute_id UUID NOT NULL REFERENCES disputes(id) ON DELETE CASCADE,

  -- Message author
  author_type VARCHAR(20) NOT NULL CHECK (author_type IN ('tenant', 'admin', 'system')),
  author_name VARCHAR(200),
  author_user_id UUID REFERENCES users(id),

  -- Message content
  message TEXT NOT NULL,
  is_internal_note BOOLEAN DEFAULT FALSE,

  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for dispute messages
CREATE INDEX idx_dispute_messages_dispute_id ON dispute_messages(dispute_id);
CREATE INDEX idx_dispute_messages_created_at ON dispute_messages(created_at DESC);

-- =============================================================================
-- DISPUTE ATTACHMENTS TABLE
-- =============================================================================
-- Photos and evidence for disputes
CREATE TABLE IF NOT EXISTS dispute_attachments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  dispute_id UUID NOT NULL REFERENCES disputes(id) ON DELETE CASCADE,

  -- File information
  storage_path TEXT NOT NULL,
  file_name VARCHAR(255) NOT NULL,
  file_size INTEGER,
  mime_type VARCHAR(100),

  -- Upload information
  uploaded_by VARCHAR(20) NOT NULL CHECK (uploaded_by IN ('tenant', 'admin')),
  description TEXT,

  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for dispute attachments
CREATE INDEX idx_dispute_attachments_dispute_id ON dispute_attachments(dispute_id);

-- =============================================================================
-- TRIGGER: UPDATE TIMESTAMPS
-- =============================================================================
CREATE OR REPLACE FUNCTION update_disputes_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_disputes_updated_at
  BEFORE UPDATE ON disputes
  FOR EACH ROW
  EXECUTE FUNCTION update_disputes_updated_at();

-- =============================================================================
-- FUNCTION: GENERATE PROTOCOL
-- =============================================================================
-- Generate unique protocol in format: DISP-YYYY-XXXXXX
CREATE OR REPLACE FUNCTION generate_dispute_protocol()
RETURNS TEXT AS $$
DECLARE
  year_part TEXT;
  random_part TEXT;
  new_protocol TEXT;
  counter INTEGER := 0;
BEGIN
  year_part := TO_CHAR(NOW(), 'YYYY');

  LOOP
    -- Generate 6-digit random number
    random_part := LPAD(FLOOR(RANDOM() * 999999)::TEXT, 6, '0');
    new_protocol := 'DISP-' || year_part || '-' || random_part;

    -- Check if protocol already exists
    IF NOT EXISTS (SELECT 1 FROM disputes WHERE protocol = new_protocol) THEN
      RETURN new_protocol;
    END IF;

    -- Safety counter to prevent infinite loop
    counter := counter + 1;
    IF counter > 100 THEN
      RAISE EXCEPTION 'Could not generate unique protocol after 100 attempts';
    END IF;
  END LOOP;
END;
$$ LANGUAGE plpgsql;

-- =============================================================================
-- FUNCTION: AUTO-ADD SYSTEM MESSAGE ON STATUS CHANGE
-- =============================================================================
CREATE OR REPLACE FUNCTION add_dispute_status_change_message()
RETURNS TRIGGER AS $$
BEGIN
  -- Only trigger on status change
  IF NEW.status IS DISTINCT FROM OLD.status THEN
    INSERT INTO dispute_messages (
      dispute_id,
      author_type,
      message,
      is_internal_note
    ) VALUES (
      NEW.id,
      'system',
      'Status alterado de "' || OLD.status || '" para "' || NEW.status || '"',
      FALSE
    );
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_dispute_status_message
  AFTER UPDATE OF status ON disputes
  FOR EACH ROW
  EXECUTE FUNCTION add_dispute_status_change_message();

-- =============================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- =============================================================================
-- Enable RLS on all tables
ALTER TABLE disputes ENABLE ROW LEVEL SECURITY;
ALTER TABLE dispute_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE dispute_attachments ENABLE ROW LEVEL SECURITY;

-- Disputes: Users can see their own disputes
CREATE POLICY disputes_select_own
  ON disputes FOR SELECT
  USING (user_id = auth.uid() AND deleted_at IS NULL);

-- Disputes: Users can insert their own disputes
CREATE POLICY disputes_insert_own
  ON disputes FOR INSERT
  WITH CHECK (user_id = auth.uid());

-- Disputes: Users can update their own disputes (limited fields)
CREATE POLICY disputes_update_own
  ON disputes FOR UPDATE
  USING (user_id = auth.uid() AND deleted_at IS NULL);

-- Messages: Can read messages from own disputes
CREATE POLICY dispute_messages_select
  ON dispute_messages FOR SELECT
  USING (
    dispute_id IN (
      SELECT id FROM disputes WHERE user_id = auth.uid() AND deleted_at IS NULL
    )
  );

-- Messages: Can insert messages to own disputes
CREATE POLICY dispute_messages_insert
  ON dispute_messages FOR INSERT
  WITH CHECK (
    dispute_id IN (
      SELECT id FROM disputes WHERE user_id = auth.uid()
    )
  );

-- Attachments: Can read attachments from own disputes
CREATE POLICY dispute_attachments_select
  ON dispute_attachments FOR SELECT
  USING (
    dispute_id IN (
      SELECT id FROM disputes WHERE user_id = auth.uid() AND deleted_at IS NULL
    )
  );

-- Attachments: Can insert attachments to own disputes
CREATE POLICY dispute_attachments_insert
  ON dispute_attachments FOR INSERT
  WITH CHECK (
    dispute_id IN (
      SELECT id FROM disputes WHERE user_id = auth.uid()
    )
  );

-- =============================================================================
-- COMMENTS FOR DOCUMENTATION
-- =============================================================================
COMMENT ON TABLE disputes IS 'Tenant contestations of inspection items';
COMMENT ON COLUMN disputes.protocol IS 'Unique protocol for tracking (DISP-YYYY-XXXXXX)';
COMMENT ON COLUMN disputes.access_token IS 'JWT token for public access without authentication';
COMMENT ON COLUMN disputes.category IS 'Type of contestation (damage_assessment, missing_item, etc)';
COMMENT ON COLUMN disputes.severity IS 'Severity level matching inspection problems';

COMMENT ON TABLE dispute_messages IS 'Timeline of messages between tenant and admin';
COMMENT ON COLUMN dispute_messages.author_type IS 'Who wrote the message: tenant, admin, or system';
COMMENT ON COLUMN dispute_messages.is_internal_note IS 'If true, only visible to admins';

COMMENT ON TABLE dispute_attachments IS 'Evidence files attached to disputes';
COMMENT ON COLUMN dispute_attachments.uploaded_by IS 'Whether uploaded by tenant or admin';

-- =============================================================================
-- SEED DATA (Optional)
-- =============================================================================
-- Add helpful comments to existing tables
COMMENT ON TABLE inspections IS 'Property inspection records with photos and AI analysis';
COMMENT ON TABLE inspection_photos IS 'Photos captured during inspections';
COMMENT ON TABLE photo_problems IS 'Problems detected in photos (AI or manual)';

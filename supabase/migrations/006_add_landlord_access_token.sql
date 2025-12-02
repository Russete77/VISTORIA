-- Migration: Add Landlord Access Token to Disputes
-- Created: 2025-11-20
-- Description: Add landlord_access_token field for landlord-specific access to disputes

-- =============================================================================
-- ADD LANDLORD ACCESS TOKEN COLUMN
-- =============================================================================
-- This token allows landlords to view ALL disputes related to their properties
-- Unlike tenant tokens (which are per-dispute), landlord tokens are email-based
ALTER TABLE disputes
ADD COLUMN IF NOT EXISTS landlord_access_token TEXT;

-- Create unique index for landlord access tokens
CREATE UNIQUE INDEX IF NOT EXISTS idx_disputes_landlord_access_token
  ON disputes(landlord_access_token)
  WHERE landlord_access_token IS NOT NULL;

-- Add index for landlord email lookups
-- This helps find all disputes where a specific landlord_email is involved
CREATE INDEX IF NOT EXISTS idx_disputes_landlord_email
  ON disputes((
    SELECT landlord_email
    FROM inspections
    WHERE inspections.id = disputes.inspection_id
  ));

-- =============================================================================
-- FUNCTION: GENERATE LANDLORD ACCESS TOKEN MAP
-- =============================================================================
-- This function generates a unique identifier for landlord access
-- It creates a mapping between landlord emails and their disputes
CREATE OR REPLACE FUNCTION get_landlord_disputes(p_landlord_email TEXT)
RETURNS TABLE (
  dispute_id UUID,
  protocol VARCHAR(20),
  property_name TEXT,
  property_address TEXT,
  status VARCHAR(20),
  category VARCHAR(50),
  severity VARCHAR(20),
  item_description TEXT,
  created_at TIMESTAMPTZ
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    d.id AS dispute_id,
    d.protocol,
    p.name AS property_name,
    p.address AS property_address,
    d.status,
    d.category,
    d.severity,
    d.item_description,
    d.created_at
  FROM disputes d
  INNER JOIN inspections i ON d.inspection_id = i.id
  INNER JOIN properties p ON i.property_id = p.id
  WHERE i.landlord_email = p_landlord_email
    AND d.deleted_at IS NULL
    AND i.deleted_at IS NULL
  ORDER BY d.created_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =============================================================================
-- FUNCTION: VERIFY LANDLORD ACCESS
-- =============================================================================
-- Verifies if a landlord has access to a specific dispute
CREATE OR REPLACE FUNCTION verify_landlord_access(
  p_dispute_id UUID,
  p_landlord_email TEXT
)
RETURNS BOOLEAN AS $$
DECLARE
  v_has_access BOOLEAN;
BEGIN
  SELECT EXISTS (
    SELECT 1
    FROM disputes d
    INNER JOIN inspections i ON d.inspection_id = i.id
    WHERE d.id = p_dispute_id
      AND i.landlord_email = p_landlord_email
      AND d.deleted_at IS NULL
  ) INTO v_has_access;

  RETURN v_has_access;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =============================================================================
-- COMMENTS FOR DOCUMENTATION
-- =============================================================================
COMMENT ON COLUMN disputes.landlord_access_token IS 'JWT token for landlord read-only access to all their disputes';
COMMENT ON FUNCTION get_landlord_disputes(TEXT) IS 'Returns all disputes for a given landlord email';
COMMENT ON FUNCTION verify_landlord_access(UUID, TEXT) IS 'Verifies if a landlord email has access to a specific dispute';

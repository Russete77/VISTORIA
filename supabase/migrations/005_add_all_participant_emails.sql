-- Migration: Add all participant emails to inspections table
-- Created: 2025-11-20
-- Description: Add tenant_email, landlord_email, and inspector_email columns
--              to support comprehensive communication and notifications

-- =============================================================================
-- ADD EMAIL COLUMNS TO INSPECTIONS TABLE
-- =============================================================================

-- Add tenant_email column (nullable for backward compatibility)
ALTER TABLE inspections
ADD COLUMN IF NOT EXISTS tenant_email VARCHAR(255) NULL;

-- Add landlord_email column
ALTER TABLE inspections
ADD COLUMN IF NOT EXISTS landlord_email VARCHAR(255) NULL;

-- Add inspector_email column
ALTER TABLE inspections
ADD COLUMN IF NOT EXISTS inspector_email VARCHAR(255) NULL;

-- =============================================================================
-- CREATE INDEXES FOR EMAIL LOOKUPS
-- =============================================================================

-- Index for tenant email lookups
CREATE INDEX IF NOT EXISTS idx_inspections_tenant_email
  ON inspections(tenant_email)
  WHERE tenant_email IS NOT NULL AND deleted_at IS NULL;

-- Index for landlord email lookups
CREATE INDEX IF NOT EXISTS idx_inspections_landlord_email
  ON inspections(landlord_email)
  WHERE landlord_email IS NOT NULL AND deleted_at IS NULL;

-- Index for inspector email lookups
CREATE INDEX IF NOT EXISTS idx_inspections_inspector_email
  ON inspections(inspector_email)
  WHERE inspector_email IS NOT NULL AND deleted_at IS NULL;

-- =============================================================================
-- COMMENTS FOR DOCUMENTATION
-- =============================================================================

COMMENT ON COLUMN inspections.tenant_email IS 'Tenant email address for report delivery and dispute notifications';
COMMENT ON COLUMN inspections.landlord_email IS 'Landlord email address for report delivery and dispute notifications';
COMMENT ON COLUMN inspections.inspector_email IS 'Inspector email address for report delivery and dispute response requests';

-- =============================================================================
-- VALIDATION NOTES
-- =============================================================================
-- All email fields are nullable to maintain compatibility with existing inspections
-- Future inspections should capture all emails whenever possible for better communication
-- Email validation is enforced at application level (Zod schema)
-- These emails enable:
--   - Automated report delivery to all parties
--   - Dispute notifications to landlord and inspector
--   - Professional communication workflow

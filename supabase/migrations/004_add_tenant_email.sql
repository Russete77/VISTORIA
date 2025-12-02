-- Migration: Add tenant_email to inspections table
-- Created: 2025-11-20
-- Description: Add tenant_email column to support disputes feature

-- =============================================================================
-- ADD TENANT_EMAIL COLUMN TO INSPECTIONS TABLE
-- =============================================================================

-- Add tenant_email column (nullable for backward compatibility)
ALTER TABLE inspections
ADD COLUMN IF NOT EXISTS tenant_email VARCHAR(255) NULL;

-- Create index for email lookups
CREATE INDEX IF NOT EXISTS idx_inspections_tenant_email
  ON inspections(tenant_email)
  WHERE tenant_email IS NOT NULL AND deleted_at IS NULL;

-- =============================================================================
-- COMMENTS FOR DOCUMENTATION
-- =============================================================================

COMMENT ON COLUMN inspections.tenant_email IS 'Tenant email address for dispute notifications and access';

-- =============================================================================
-- VALIDATION NOTES
-- =============================================================================
-- Field is nullable to maintain compatibility with existing inspections
-- Future inspections should capture tenant_email whenever possible
-- Email validation should be enforced at application level

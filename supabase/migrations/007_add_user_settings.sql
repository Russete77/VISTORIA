-- Migration 007: User Settings
-- Created: 2025-11-20
-- Description: Adds user_settings table for configurable features and AI strictness levels
-- Also adds ai_strictness_level column to inspections table

-- ================================================
-- CREATE USER_SETTINGS TABLE
-- ================================================

CREATE TABLE IF NOT EXISTS user_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,

  -- Feature toggles
  disputes_enabled BOOLEAN NOT NULL DEFAULT TRUE,

  -- AI Configuration
  ai_inspection_strictness VARCHAR(20) NOT NULL DEFAULT 'standard'
    CHECK (ai_inspection_strictness IN ('standard', 'strict', 'very_strict')),

  -- Metadata
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index for fast user lookups
CREATE INDEX IF NOT EXISTS idx_user_settings_user_id ON user_settings(user_id);

-- ================================================
-- ADD AI STRICTNESS TO INSPECTIONS
-- ================================================

-- Add ai_strictness_level column to inspections table
-- This allows per-inspection override of the global setting
ALTER TABLE inspections
ADD COLUMN IF NOT EXISTS ai_strictness_level VARCHAR(20) DEFAULT NULL
  CHECK (ai_strictness_level IN ('standard', 'strict', 'very_strict'));

-- Add index for filtering by strictness level
CREATE INDEX IF NOT EXISTS idx_inspections_ai_strictness ON inspections(ai_strictness_level)
  WHERE ai_strictness_level IS NOT NULL;

-- ================================================
-- AUTO-UPDATE TIMESTAMP TRIGGER
-- ================================================

CREATE OR REPLACE FUNCTION update_user_settings_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_user_settings_updated_at
  BEFORE UPDATE ON user_settings
  FOR EACH ROW
  EXECUTE FUNCTION update_user_settings_updated_at();

-- ================================================
-- COMMENTS
-- ================================================

COMMENT ON TABLE user_settings IS 'User-specific configuration for features and AI behavior';
COMMENT ON COLUMN user_settings.disputes_enabled IS 'Toggle to enable/disable disputes feature for this user';
COMMENT ON COLUMN user_settings.ai_inspection_strictness IS 'Default AI analysis strictness level: standard (balanced), strict (more critical), very_strict (hyper-critical)';
COMMENT ON COLUMN inspections.ai_strictness_level IS 'Per-inspection AI strictness override. NULL = use user default from user_settings';

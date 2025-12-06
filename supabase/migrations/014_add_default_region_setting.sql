-- Migration 014: Add Default Region Setting
-- Created: 2025-12-02
-- Description: Adds default_region column to user_settings for cost estimation

-- ================================================
-- ADD DEFAULT REGION TO USER_SETTINGS
-- ================================================

ALTER TABLE user_settings
ADD COLUMN IF NOT EXISTS default_region VARCHAR(50) DEFAULT 'sp_capital';

-- ================================================
-- COMMENTS
-- ================================================

COMMENT ON COLUMN user_settings.default_region IS 'Default region code for cost estimation (e.g., sp_capital, rj_capital, mg_capital)';

-- Migration 021: Add CRECI Field
-- Created: 2025-12-10
-- Description: Add optional CRECI (Conselho Regional de Corretores de Imóveis) field to user settings

-- ================================================
-- ADD CRECI TO USER_SETTINGS
-- ================================================

ALTER TABLE user_settings
ADD COLUMN IF NOT EXISTS creci VARCHAR(50);

-- ================================================
-- COMMENTS
-- ================================================

COMMENT ON COLUMN user_settings.creci IS 'CRECI (Conselho Regional de Corretores de Imóveis) - Optional. Format: CRECI-UF XXXXX-F/J/S';

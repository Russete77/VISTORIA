-- Migration 012: White-label Branding
-- Created: 2025-12-02
-- Description: Add branding configuration for white-label PDFs

-- ================================================
-- ADD BRANDING COLUMNS TO USER_SETTINGS
-- ================================================

ALTER TABLE user_settings
ADD COLUMN IF NOT EXISTS company_name TEXT,
ADD COLUMN IF NOT EXISTS logo_url TEXT,
ADD COLUMN IF NOT EXISTS brand_primary_color TEXT DEFAULT '#1a56db',
ADD COLUMN IF NOT EXISTS brand_secondary_color TEXT DEFAULT '#f3f4f6',
ADD COLUMN IF NOT EXISTS pdf_footer_text TEXT,
ADD COLUMN IF NOT EXISTS show_powered_by BOOLEAN DEFAULT TRUE;

-- ================================================
-- COMMENTS
-- ================================================

COMMENT ON COLUMN user_settings.company_name IS 'Company/business name for white-label branding';
COMMENT ON COLUMN user_settings.logo_url IS 'URL to company logo stored in Supabase Storage';
COMMENT ON COLUMN user_settings.brand_primary_color IS 'Primary brand color (hex format, e.g., #1a56db)';
COMMENT ON COLUMN user_settings.brand_secondary_color IS 'Secondary brand color (hex format)';
COMMENT ON COLUMN user_settings.pdf_footer_text IS 'Custom footer text for PDF reports';
COMMENT ON COLUMN user_settings.show_powered_by IS 'Show "Powered by VistorIA Pro" in PDFs';

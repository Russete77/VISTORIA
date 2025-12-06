-- Migration: Add AI analysis edit tracking
-- Created: 2025-12-02
-- Description: Add columns to track when users edit AI-generated analysis

-- Add ai_edited and ai_edited_at columns to inspection_photos
ALTER TABLE inspection_photos
ADD COLUMN IF NOT EXISTS ai_edited BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS ai_edited_at TIMESTAMPTZ;

-- Add index for finding edited photos
CREATE INDEX IF NOT EXISTS idx_inspection_photos_ai_edited
ON inspection_photos(ai_edited)
WHERE ai_edited = TRUE;

-- Add comment for documentation
COMMENT ON COLUMN inspection_photos.ai_edited IS 'Whether the AI analysis was edited by user';
COMMENT ON COLUMN inspection_photos.ai_edited_at IS 'When the AI analysis was last edited';

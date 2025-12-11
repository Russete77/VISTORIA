-- Migration: Add video analysis fields to inspection_photos
-- Date: 2025-12-09
-- Description: Add fields to support video frame extraction and analysis

-- Add columns to inspection_photos table
ALTER TABLE public.inspection_photos
ADD COLUMN IF NOT EXISTS from_video BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS frame_number INTEGER,
ADD COLUMN IF NOT EXISTS video_transcription TEXT;

-- Create indexes for video frames
CREATE INDEX IF NOT EXISTS idx_photos_from_video ON public.inspection_photos(from_video);
CREATE INDEX IF NOT EXISTS idx_photos_frame_number ON public.inspection_photos(frame_number);
CREATE INDEX IF NOT EXISTS idx_photos_from_video_frame ON public.inspection_photos(from_video, frame_number);

-- Verify columns were added
SELECT 
  column_name, 
  data_type, 
  is_nullable
FROM information_schema.columns 
WHERE table_schema = 'public'
  AND table_name = 'inspection_photos' 
  AND column_name IN ('from_video', 'frame_number', 'video_transcription')
ORDER BY ordinal_position;

-- ====================================================
-- Migration: 019_ai_training_infrastructure.sql
-- Description: Creates tables for AI training data collection
--              and model version tracking
-- ====================================================

-- ============================================
-- TABLE 1: ai_training_data
-- Stores analysis data for future model training
-- ============================================

CREATE TABLE IF NOT EXISTS ai_training_data (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Reference to original photo
  photo_id UUID REFERENCES inspection_photos(id) ON DELETE SET NULL,
  photo_url TEXT NOT NULL,
  
  -- YOLO detections (for training custom YOLO)
  yolo_detections JSONB DEFAULT '[]',
  
  -- Claude analysis (for training BERT)
  claude_analysis JSONB NOT NULL,
  claude_model TEXT DEFAULT 'claude-sonnet-4-20250514',
  
  -- User corrections (ground truth for training)
  user_correction JSONB,
  severity_corrected TEXT CHECK (severity_corrected IN ('low', 'medium', 'high', 'urgent')),
  problems_corrected JSONB,
  
  -- Explicit feedback
  feedback_rating INTEGER CHECK (feedback_rating BETWEEN 1 AND 5),
  feedback_comment TEXT,
  is_correct BOOLEAN, -- true = user confirmed analysis is correct
  
  -- Metadata
  room_name TEXT,
  room_category TEXT,
  from_video BOOLEAN DEFAULT FALSE,
  
  -- Tracking
  created_at TIMESTAMPTZ DEFAULT NOW(),
  corrected_at TIMESTAMPTZ,
  used_for_training BOOLEAN DEFAULT FALSE,
  training_batch_id UUID -- which training batch used this data
);

-- Indexes for efficient training data queries
CREATE INDEX IF NOT EXISTS idx_training_not_used 
  ON ai_training_data(used_for_training) 
  WHERE used_for_training = FALSE;

CREATE INDEX IF NOT EXISTS idx_training_has_correction 
  ON ai_training_data(id) 
  WHERE user_correction IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_training_is_correct 
  ON ai_training_data(is_correct) 
  WHERE is_correct = TRUE;

CREATE INDEX IF NOT EXISTS idx_training_created 
  ON ai_training_data(created_at DESC);

-- ============================================
-- TABLE 2: ai_model_versions
-- Tracks trained model versions and metrics
-- ============================================

CREATE TABLE IF NOT EXISTS ai_model_versions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  model_type TEXT NOT NULL CHECK (model_type IN ('yolo', 'bert', 'other')),
  version TEXT NOT NULL,
  description TEXT,
  
  -- Training metrics
  training_samples INTEGER,
  accuracy NUMERIC,
  precision_score NUMERIC,
  recall_score NUMERIC,
  f1_score NUMERIC,
  
  -- Model file info
  model_path TEXT,
  model_size_mb NUMERIC,
  
  -- Status
  is_active BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  trained_at TIMESTAMPTZ,
  
  UNIQUE(model_type, version)
);

-- ============================================
-- RLS Policies
-- ============================================

-- Enable RLS
ALTER TABLE ai_training_data ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_model_versions ENABLE ROW LEVEL SECURITY;

-- Training data: users can read their related data via inspection_photos
CREATE POLICY "Users can read training data for their photos"
  ON ai_training_data FOR SELECT
  USING (
    photo_id IS NULL OR 
    photo_id IN (
      SELECT id FROM inspection_photos 
      WHERE user_id = auth.uid()
    )
  );

-- Training data: service role can do everything (for API routes)
CREATE POLICY "Service role has full access to training data"
  ON ai_training_data FOR ALL
  USING (true)
  WITH CHECK (true);

-- Model versions: anyone can read active models
CREATE POLICY "Anyone can read active model versions"
  ON ai_model_versions FOR SELECT
  USING (is_active = TRUE);

-- Model versions: service role manages all
CREATE POLICY "Service role manages model versions"
  ON ai_model_versions FOR ALL
  USING (true)
  WITH CHECK (true);

-- ============================================
-- Helper function: Get training stats
-- ============================================

CREATE OR REPLACE FUNCTION get_ai_training_stats()
RETURNS TABLE (
  total_samples BIGINT,
  samples_with_corrections BIGINT,
  samples_confirmed_correct BIGINT,
  samples_unused BIGINT,
  avg_feedback_rating NUMERIC
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    COUNT(*) as total_samples,
    COUNT(*) FILTER (WHERE user_correction IS NOT NULL) as samples_with_corrections,
    COUNT(*) FILTER (WHERE is_correct = TRUE) as samples_confirmed_correct,
    COUNT(*) FILTER (WHERE used_for_training = FALSE) as samples_unused,
    ROUND(AVG(feedback_rating), 2) as avg_feedback_rating
  FROM ai_training_data;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

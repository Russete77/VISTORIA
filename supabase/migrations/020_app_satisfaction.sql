-- ====================================================
-- Migration: 020_app_satisfaction.sql
-- Description: Create table for app-wide satisfaction surveys
-- ====================================================

-- ============================================
-- TABLE: app_satisfaction_surveys
-- Stores user satisfaction feedback about the app
-- ============================================

CREATE TABLE IF NOT EXISTS app_satisfaction_surveys (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  
  -- NPS Score (Net Promoter Score)
  nps_score SMALLINT CHECK (nps_score BETWEEN 0 AND 10),
  
  -- Feature-specific ratings (1-5 stars)
  ai_satisfaction SMALLINT CHECK (ai_satisfaction BETWEEN 1 AND 5),
  ux_satisfaction SMALLINT CHECK (ux_satisfaction BETWEEN 1 AND 5),
  
  -- Open feedback
  open_feedback TEXT,
  
  -- Which features user finds most useful
  useful_features TEXT[], -- ['ai_analysis', 'comparisons', 'pdfs', 'disputes', 'team', 'costs']
  
  -- Metadata at time of survey
  completed_inspections INTEGER DEFAULT 0,
  user_tier TEXT,
  days_since_signup INTEGER,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- Indexes for performance
-- ============================================

CREATE INDEX IF NOT EXISTS idx_satisfaction_surveys_user_id 
  ON app_satisfaction_surveys(user_id);

CREATE INDEX IF NOT EXISTS idx_satisfaction_surveys_created_at 
  ON app_satisfaction_surveys(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_satisfaction_surveys_nps_score 
  ON app_satisfaction_surveys(nps_score);

-- ============================================
-- RLS Policies
-- ============================================

ALTER TABLE app_satisfaction_surveys ENABLE ROW LEVEL SECURITY;

-- Service role has full access (API uses createAdminClient)
-- Since we use Clerk auth, not Supabase auth, we can't use auth.uid()
CREATE POLICY "Service role has full access to surveys"
  ON app_satisfaction_surveys FOR ALL
  USING (true)
  WITH CHECK (true);

-- ============================================
-- Helper function: Get satisfaction stats
-- ============================================

CREATE OR REPLACE FUNCTION get_satisfaction_stats(
  period_days INTEGER DEFAULT 30
)
RETURNS TABLE (
  total_responses BIGINT,
  avg_nps NUMERIC,
  avg_ai_satisfaction NUMERIC,
  avg_ux_satisfaction NUMERIC,
  nps_promoters BIGINT,
  nps_passives BIGINT,
  nps_detractors BIGINT,
  nps_score NUMERIC
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    COUNT(*) as total_responses,
    ROUND(AVG(s.nps_score), 2) as avg_nps,
    ROUND(AVG(s.ai_satisfaction), 2) as avg_ai_satisfaction,
    ROUND(AVG(s.ux_satisfaction), 2) as avg_ux_satisfaction,
    COUNT(*) FILTER (WHERE s.nps_score >= 9) as nps_promoters,
    COUNT(*) FILTER (WHERE s.nps_score >= 7 AND s.nps_score <= 8) as nps_passives,
    COUNT(*) FILTER (WHERE s.nps_score <= 6) as nps_detractors,
    -- Calculated NPS = (% promoters - % detractors) * 100
    CASE 
      WHEN COUNT(*) > 0 THEN
        ROUND(
          ((COUNT(*) FILTER (WHERE s.nps_score >= 9)::NUMERIC / COUNT(*)::NUMERIC) - 
           (COUNT(*) FILTER (WHERE s.nps_score <= 6)::NUMERIC / COUNT(*)::NUMERIC)) * 100,
          2
        )
      ELSE 0
    END as nps_score
  FROM app_satisfaction_surveys s
  WHERE s.created_at >= NOW() - INTERVAL '1 day' * period_days;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- Helper function: Check if user can submit survey
-- ============================================

CREATE OR REPLACE FUNCTION can_submit_satisfaction_survey(
  p_user_id UUID
)
RETURNS BOOLEAN AS $$
DECLARE
  last_survey_date TIMESTAMPTZ;
BEGIN
  -- Get last survey date
  SELECT created_at INTO last_survey_date
  FROM app_satisfaction_surveys
  WHERE user_id = p_user_id
  ORDER BY created_at DESC
  LIMIT 1;
  
  -- Allow if no previous survey or last survey was > 30 days ago
  IF last_survey_date IS NULL OR 
     last_survey_date < NOW() - INTERVAL '30 days' 
  THEN
    RETURN TRUE;
  ELSE
    RETURN FALSE;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Migration: AI Feedback System
-- Description: Sistema para coletar feedback sobre análises da IA
-- Objetivo: Treinar e melhorar o modelo com dados reais dos usuários

-- =============================================================================
-- Tabela: ai_feedback
-- Armazena feedback dos usuários sobre análises da IA
-- =============================================================================

CREATE TABLE IF NOT EXISTS ai_feedback (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Relacionamentos
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  inspection_id UUID REFERENCES inspections(id) ON DELETE SET NULL,
  photo_id UUID REFERENCES inspection_photos(id) ON DELETE SET NULL,
  problem_id UUID REFERENCES photo_problems(id) ON DELETE SET NULL,

  -- Tipo de feedback
  feedback_type TEXT NOT NULL CHECK (feedback_type IN (
    'problem_detection',    -- Feedback sobre detecção de problemas
    'problem_description',  -- Feedback sobre descrição do problema
    'severity_rating',      -- Feedback sobre classificação de severidade
    'recommendation',       -- Feedback sobre recomendação de reparo
    'cost_estimate',        -- Feedback sobre estimativa de custo
    'room_detection',       -- Feedback sobre detecção de cômodo
    'general'               -- Feedback geral
  )),

  -- Avaliação do usuário
  rating SMALLINT NOT NULL CHECK (rating >= 1 AND rating <= 5),
  is_accurate BOOLEAN, -- null = não respondeu, true = correto, false = incorreto

  -- Conteúdo original da IA
  ai_original_content JSONB NOT NULL DEFAULT '{}',
  -- Exemplo para problem_detection:
  -- {
  --   "description": "Mancha de umidade no teto",
  --   "severity": "high",
  --   "recommendation": "Verificar infiltração",
  --   "estimated_cost": { "min": 200, "max": 500 }
  -- }

  -- Correção do usuário (se houver)
  user_correction JSONB,
  -- Mesmo formato do ai_original_content, com os valores corrigidos

  -- Comentário livre do usuário
  user_comment TEXT,

  -- Categorias de problema (para análise)
  issue_categories TEXT[] DEFAULT '{}',
  -- Exemplos: ['wrong_severity', 'missed_problem', 'false_positive', 'wrong_description']

  -- Metadados
  model_version TEXT, -- Versão do modelo que gerou a análise
  created_at TIMESTAMPTZ DEFAULT NOW(),

  -- Índices implícitos via REFERENCES
  CONSTRAINT valid_reference CHECK (
    photo_id IS NOT NULL OR problem_id IS NOT NULL OR inspection_id IS NOT NULL
  )
);

-- =============================================================================
-- Índices para consultas frequentes
-- =============================================================================

CREATE INDEX IF NOT EXISTS idx_ai_feedback_user_id ON ai_feedback(user_id);
CREATE INDEX IF NOT EXISTS idx_ai_feedback_inspection_id ON ai_feedback(inspection_id);
CREATE INDEX IF NOT EXISTS idx_ai_feedback_photo_id ON ai_feedback(photo_id);
CREATE INDEX IF NOT EXISTS idx_ai_feedback_problem_id ON ai_feedback(problem_id);
CREATE INDEX IF NOT EXISTS idx_ai_feedback_type ON ai_feedback(feedback_type);
CREATE INDEX IF NOT EXISTS idx_ai_feedback_rating ON ai_feedback(rating);
CREATE INDEX IF NOT EXISTS idx_ai_feedback_is_accurate ON ai_feedback(is_accurate);
CREATE INDEX IF NOT EXISTS idx_ai_feedback_created_at ON ai_feedback(created_at DESC);

-- Índice para busca por categorias de problema
CREATE INDEX IF NOT EXISTS idx_ai_feedback_issue_categories ON ai_feedback USING GIN(issue_categories);

-- =============================================================================
-- Tabela: ai_feedback_stats
-- View materializada para estatísticas agregadas (atualizada periodicamente)
-- =============================================================================

CREATE TABLE IF NOT EXISTS ai_feedback_stats (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Período
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,

  -- Métricas gerais
  total_feedbacks INTEGER DEFAULT 0,
  average_rating DECIMAL(3,2) DEFAULT 0,
  accuracy_rate DECIMAL(5,2) DEFAULT 0, -- Percentual de is_accurate = true

  -- Por tipo de feedback
  stats_by_type JSONB DEFAULT '{}',
  -- {
  --   "problem_detection": { "count": 100, "avg_rating": 4.2, "accuracy": 85.5 },
  --   "severity_rating": { "count": 80, "avg_rating": 3.8, "accuracy": 72.0 }
  -- }

  -- Problemas mais comuns
  top_issues JSONB DEFAULT '[]',
  -- [
  --   { "category": "wrong_severity", "count": 50, "percentage": 25 },
  --   { "category": "missed_problem", "count": 30, "percentage": 15 }
  -- ]

  -- Metadados
  calculated_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(period_start, period_end)
);

-- =============================================================================
-- Função para calcular estatísticas de feedback
-- =============================================================================

CREATE OR REPLACE FUNCTION calculate_ai_feedback_stats(
  p_start_date DATE DEFAULT CURRENT_DATE - INTERVAL '30 days',
  p_end_date DATE DEFAULT CURRENT_DATE
)
RETURNS UUID
LANGUAGE plpgsql
AS $$
DECLARE
  v_stats_id UUID;
  v_total INTEGER;
  v_avg_rating DECIMAL(3,2);
  v_accuracy DECIMAL(5,2);
  v_by_type JSONB;
  v_top_issues JSONB;
BEGIN
  -- Calcular métricas gerais
  SELECT
    COUNT(*),
    COALESCE(AVG(rating), 0),
    COALESCE(
      (COUNT(*) FILTER (WHERE is_accurate = true)::DECIMAL /
       NULLIF(COUNT(*) FILTER (WHERE is_accurate IS NOT NULL), 0) * 100),
      0
    )
  INTO v_total, v_avg_rating, v_accuracy
  FROM ai_feedback
  WHERE created_at >= p_start_date AND created_at < p_end_date + INTERVAL '1 day';

  -- Calcular por tipo
  SELECT jsonb_object_agg(
    feedback_type,
    jsonb_build_object(
      'count', type_count,
      'avg_rating', type_avg,
      'accuracy', type_accuracy
    )
  )
  INTO v_by_type
  FROM (
    SELECT
      feedback_type,
      COUNT(*) as type_count,
      ROUND(AVG(rating), 2) as type_avg,
      ROUND(
        COALESCE(
          (COUNT(*) FILTER (WHERE is_accurate = true)::DECIMAL /
           NULLIF(COUNT(*) FILTER (WHERE is_accurate IS NOT NULL), 0) * 100),
          0
        ), 2
      ) as type_accuracy
    FROM ai_feedback
    WHERE created_at >= p_start_date AND created_at < p_end_date + INTERVAL '1 day'
    GROUP BY feedback_type
  ) type_stats;

  -- Calcular top issues
  SELECT jsonb_agg(
    jsonb_build_object(
      'category', issue_cat,
      'count', issue_count,
      'percentage', ROUND(issue_count::DECIMAL / NULLIF(v_total, 0) * 100, 1)
    )
    ORDER BY issue_count DESC
  )
  INTO v_top_issues
  FROM (
    SELECT
      unnest(issue_categories) as issue_cat,
      COUNT(*) as issue_count
    FROM ai_feedback
    WHERE created_at >= p_start_date AND created_at < p_end_date + INTERVAL '1 day'
      AND array_length(issue_categories, 1) > 0
    GROUP BY unnest(issue_categories)
    LIMIT 10
  ) issue_stats;

  -- Inserir ou atualizar estatísticas
  INSERT INTO ai_feedback_stats (
    period_start,
    period_end,
    total_feedbacks,
    average_rating,
    accuracy_rate,
    stats_by_type,
    top_issues,
    calculated_at
  )
  VALUES (
    p_start_date,
    p_end_date,
    v_total,
    v_avg_rating,
    v_accuracy,
    COALESCE(v_by_type, '{}'),
    COALESCE(v_top_issues, '[]'),
    NOW()
  )
  ON CONFLICT (period_start, period_end)
  DO UPDATE SET
    total_feedbacks = EXCLUDED.total_feedbacks,
    average_rating = EXCLUDED.average_rating,
    accuracy_rate = EXCLUDED.accuracy_rate,
    stats_by_type = EXCLUDED.stats_by_type,
    top_issues = EXCLUDED.top_issues,
    calculated_at = EXCLUDED.calculated_at
  RETURNING id INTO v_stats_id;

  RETURN v_stats_id;
END;
$$;

-- =============================================================================
-- Comentários para documentação
-- =============================================================================

COMMENT ON TABLE ai_feedback IS 'Armazena feedback dos usuários sobre análises da IA para melhorar o modelo';
COMMENT ON COLUMN ai_feedback.feedback_type IS 'Tipo de análise sendo avaliada';
COMMENT ON COLUMN ai_feedback.rating IS 'Nota de 1-5 estrelas';
COMMENT ON COLUMN ai_feedback.is_accurate IS 'Se a análise da IA estava correta';
COMMENT ON COLUMN ai_feedback.ai_original_content IS 'Conteúdo original gerado pela IA';
COMMENT ON COLUMN ai_feedback.user_correction IS 'Correção feita pelo usuário';
COMMENT ON COLUMN ai_feedback.issue_categories IS 'Categorias de problemas identificados';
COMMENT ON COLUMN ai_feedback.model_version IS 'Versão do modelo que gerou a análise';

COMMENT ON TABLE ai_feedback_stats IS 'Estatísticas agregadas de feedback para monitoramento';
COMMENT ON FUNCTION calculate_ai_feedback_stats IS 'Calcula estatísticas de feedback para um período';

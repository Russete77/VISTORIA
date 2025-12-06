-- Migration: PDF Templates
-- Description: Adiciona sistema de templates personalizáveis para laudos PDF
-- Author: VistorIA Pro
-- Date: 2024-12-02

-- =====================================================
-- TABELA: pdf_templates
-- Templates de PDF personalizáveis por usuário
-- =====================================================

CREATE TABLE IF NOT EXISTS pdf_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,

  -- Metadados
  name VARCHAR(100) NOT NULL,
  description TEXT,
  type VARCHAR(20) NOT NULL DEFAULT 'both' CHECK (type IN ('inspection', 'comparison', 'both')),

  -- Configuração (JSON completo do template)
  config JSONB NOT NULL DEFAULT '{}'::jsonb,

  -- Flags
  is_default BOOLEAN DEFAULT FALSE,
  is_system BOOLEAN DEFAULT FALSE,  -- Templates do sistema (não editáveis/deletáveis)

  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices
CREATE INDEX idx_pdf_templates_user_id ON pdf_templates(user_id);
CREATE INDEX idx_pdf_templates_type ON pdf_templates(type);
CREATE INDEX idx_pdf_templates_is_default ON pdf_templates(is_default) WHERE is_default = TRUE;

-- Comentários
COMMENT ON TABLE pdf_templates IS 'Templates personalizáveis para geração de PDFs de laudos';
COMMENT ON COLUMN pdf_templates.config IS 'Configuração completa do template em JSON (cores, fontes, seções, branding)';
COMMENT ON COLUMN pdf_templates.is_system IS 'Templates do sistema não podem ser editados ou deletados pelo usuário';

-- =====================================================
-- TABELA: user_template_preferences
-- Preferências de template padrão por usuário
-- =====================================================

CREATE TABLE IF NOT EXISTS user_template_preferences (
  user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,

  -- Templates padrão
  default_inspection_template_id UUID REFERENCES pdf_templates(id) ON DELETE SET NULL,
  default_comparison_template_id UUID REFERENCES pdf_templates(id) ON DELETE SET NULL,

  -- Timestamps
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

COMMENT ON TABLE user_template_preferences IS 'Preferências de templates padrão do usuário';

-- =====================================================
-- TRIGGER: Atualizar updated_at automaticamente
-- =====================================================

CREATE OR REPLACE FUNCTION update_pdf_templates_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_pdf_templates_updated_at
  BEFORE UPDATE ON pdf_templates
  FOR EACH ROW
  EXECUTE FUNCTION update_pdf_templates_updated_at();

CREATE TRIGGER trigger_user_template_preferences_updated_at
  BEFORE UPDATE ON user_template_preferences
  FOR EACH ROW
  EXECUTE FUNCTION update_pdf_templates_updated_at();

-- =====================================================
-- TRIGGER: Garantir apenas 1 template padrão por tipo/usuário
-- =====================================================

CREATE OR REPLACE FUNCTION ensure_single_default_template()
RETURNS TRIGGER AS $$
BEGIN
  -- Se estamos marcando este template como padrão
  IF NEW.is_default = TRUE AND (OLD IS NULL OR OLD.is_default = FALSE) THEN
    -- Desmarcar outros templates do mesmo usuário e tipo
    UPDATE pdf_templates
    SET is_default = FALSE
    WHERE user_id = NEW.user_id
      AND id != NEW.id
      AND (type = NEW.type OR type = 'both' OR NEW.type = 'both')
      AND is_default = TRUE;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_ensure_single_default_template
  BEFORE INSERT OR UPDATE OF is_default ON pdf_templates
  FOR EACH ROW
  WHEN (NEW.is_default = TRUE)
  EXECUTE FUNCTION ensure_single_default_template();

-- =====================================================
-- RLS: Row Level Security
-- =====================================================

ALTER TABLE pdf_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_template_preferences ENABLE ROW LEVEL SECURITY;

-- Política: Usuários veem seus próprios templates + templates do sistema
CREATE POLICY "Users can view own and system templates"
  ON pdf_templates FOR SELECT
  USING (user_id = auth.uid() OR is_system = TRUE);

-- Política: Usuários podem criar seus próprios templates
CREATE POLICY "Users can create own templates"
  ON pdf_templates FOR INSERT
  WITH CHECK (user_id = auth.uid() AND is_system = FALSE);

-- Política: Usuários podem atualizar seus próprios templates (não os do sistema)
CREATE POLICY "Users can update own non-system templates"
  ON pdf_templates FOR UPDATE
  USING (user_id = auth.uid() AND is_system = FALSE);

-- Política: Usuários podem deletar seus próprios templates (não os do sistema)
CREATE POLICY "Users can delete own non-system templates"
  ON pdf_templates FOR DELETE
  USING (user_id = auth.uid() AND is_system = FALSE);

-- Política: Preferências de template
CREATE POLICY "Users can manage own template preferences"
  ON user_template_preferences FOR ALL
  USING (user_id = auth.uid());

-- =====================================================
-- DADOS INICIAIS: Templates do Sistema
-- =====================================================

-- Template Padrão VistorIA (Satélit)
INSERT INTO pdf_templates (id, user_id, name, description, type, is_system, config)
VALUES (
  '00000000-0000-0000-0000-000000000001',
  NULL,
  'VistorIA Padrão',
  'Template padrão profissional do VistorIA Pro',
  'both',
  TRUE,
  '{
    "colors": {
      "primary": "#1a56db",
      "secondary": "#f3f4f6",
      "accent": "#7c3aed",
      "text": "#111827",
      "textLight": "#6b7280",
      "background": "#ffffff",
      "danger": "#dc2626",
      "warning": "#f59e0b",
      "success": "#10b981"
    },
    "fonts": {
      "title": "Helvetica-Bold",
      "body": "Helvetica",
      "size": {
        "title": 24,
        "subtitle": 14,
        "body": 10,
        "small": 8
      }
    },
    "sections": {
      "showCover": true,
      "showInfo": true,
      "showSummary": true,
      "showProblems": true,
      "showPhotos": true,
      "showSignatures": true,
      "showAIAnalysis": true,
      "showChecklist": true,
      "maxPhotosPerPage": 6,
      "photoLayout": "2x3"
    },
    "branding": {
      "showWatermark": true
    },
    "header": {
      "style": "full",
      "position": "left",
      "showPageNumber": true,
      "showDate": true
    }
  }'::jsonb
);

-- Template Profissional (cores sóbrias)
INSERT INTO pdf_templates (id, user_id, name, description, type, is_system, config)
VALUES (
  '00000000-0000-0000-0000-000000000002',
  NULL,
  'Profissional',
  'Layout formal ideal para imobiliárias tradicionais',
  'both',
  TRUE,
  '{
    "colors": {
      "primary": "#1e3a5f",
      "secondary": "#f8fafc",
      "accent": "#2563eb",
      "text": "#0f172a",
      "textLight": "#64748b",
      "background": "#ffffff",
      "danger": "#b91c1c",
      "warning": "#d97706",
      "success": "#059669"
    },
    "fonts": {
      "title": "Times-Bold",
      "body": "Times-Roman",
      "size": {
        "title": 26,
        "subtitle": 14,
        "body": 11,
        "small": 9
      }
    },
    "sections": {
      "showCover": true,
      "showInfo": true,
      "showSummary": true,
      "showProblems": true,
      "showPhotos": true,
      "showSignatures": true,
      "showAIAnalysis": true,
      "showChecklist": true,
      "maxPhotosPerPage": 6,
      "photoLayout": "2x3"
    },
    "branding": {
      "showWatermark": true
    },
    "header": {
      "style": "full",
      "position": "left",
      "showPageNumber": true,
      "showDate": true
    }
  }'::jsonb
);

-- Template Minimalista
INSERT INTO pdf_templates (id, user_id, name, description, type, is_system, config)
VALUES (
  '00000000-0000-0000-0000-000000000003',
  NULL,
  'Minimalista',
  'Design limpo focado apenas no essencial',
  'both',
  TRUE,
  '{
    "colors": {
      "primary": "#374151",
      "secondary": "#f9fafb",
      "accent": "#6b7280",
      "text": "#1f2937",
      "textLight": "#9ca3af",
      "background": "#ffffff",
      "danger": "#ef4444",
      "warning": "#f59e0b",
      "success": "#22c55e"
    },
    "fonts": {
      "title": "Helvetica-Bold",
      "body": "Helvetica",
      "size": {
        "title": 22,
        "subtitle": 12,
        "body": 10,
        "small": 8
      }
    },
    "sections": {
      "showCover": true,
      "showInfo": false,
      "showSummary": true,
      "showProblems": true,
      "showPhotos": true,
      "showSignatures": true,
      "showAIAnalysis": false,
      "showChecklist": false,
      "maxPhotosPerPage": 4,
      "photoLayout": "2x2"
    },
    "branding": {
      "showWatermark": false
    },
    "header": {
      "style": "minimal",
      "position": "center",
      "showPageNumber": true,
      "showDate": false
    }
  }'::jsonb
);

-- Template Detalhado (máximo de informações)
INSERT INTO pdf_templates (id, user_id, name, description, type, is_system, config)
VALUES (
  '00000000-0000-0000-0000-000000000004',
  NULL,
  'Detalhado',
  'Máximo de informações para vistorias completas',
  'inspection',
  TRUE,
  '{
    "colors": {
      "primary": "#0369a1",
      "secondary": "#f0f9ff",
      "accent": "#0891b2",
      "text": "#0c4a6e",
      "textLight": "#7dd3fc",
      "background": "#ffffff",
      "danger": "#dc2626",
      "warning": "#ea580c",
      "success": "#16a34a"
    },
    "fonts": {
      "title": "Helvetica-Bold",
      "body": "Helvetica",
      "size": {
        "title": 24,
        "subtitle": 14,
        "body": 10,
        "small": 8
      }
    },
    "sections": {
      "showCover": true,
      "showInfo": true,
      "showSummary": true,
      "showProblems": true,
      "showPhotos": true,
      "showSignatures": true,
      "showAIAnalysis": true,
      "showChecklist": true,
      "maxPhotosPerPage": 4,
      "photoLayout": "2x2"
    },
    "branding": {
      "showWatermark": true
    },
    "header": {
      "style": "full",
      "position": "left",
      "showPageNumber": true,
      "showDate": true
    }
  }'::jsonb
);

-- =====================================================
-- GRANT: Permissões para service role
-- =====================================================

GRANT ALL ON pdf_templates TO service_role;
GRANT ALL ON user_template_preferences TO service_role;

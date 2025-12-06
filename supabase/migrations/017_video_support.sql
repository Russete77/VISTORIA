-- Migration: Suporte para Vídeos e Laudos Técnicos Completos

-- Adicionar campos para vídeos na tabela inspection_photos
ALTER TABLE inspection_photos
ADD COLUMN IF NOT EXISTS from_video BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS frame_number INTEGER,
ADD COLUMN IF NOT EXISTS video_transcription TEXT;

-- Criar tabela para laudos técnicos completos
CREATE TABLE IF NOT EXISTS technical_reports (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  inspection_id UUID NOT NULL REFERENCES inspections(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,

  -- Laudo completo em JSONB seguindo as 8 instruções
  report_data JSONB NOT NULL,

  -- Metadados
  generated_at TIMESTAMPTZ DEFAULT NOW(),
  model_version VARCHAR(50) DEFAULT 'claude-sonnet-4-20250514',
  processing_time_seconds DECIMAL(10,2),

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices
CREATE INDEX idx_technical_reports_inspection ON technical_reports(inspection_id);
CREATE INDEX idx_technical_reports_user ON technical_reports(user_id);
CREATE INDEX idx_inspection_photos_from_video ON inspection_photos(from_video) WHERE from_video = TRUE;

-- Comentários
COMMENT ON TABLE technical_reports IS 'Laudos técnicos completos gerados pela IA seguindo prompt profissional';
COMMENT ON COLUMN inspection_photos.from_video IS 'TRUE se a foto foi extraída de um vídeo';
COMMENT ON COLUMN inspection_photos.frame_number IS 'Número do frame no vídeo original';
COMMENT ON COLUMN inspection_photos.video_transcription IS 'Transcrição do áudio do vídeo';

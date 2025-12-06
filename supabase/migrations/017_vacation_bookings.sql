-- Migration 017: Vacation Bookings (Reservas de Temporada)
-- Created: 2025-12-04
-- Description: Sistema de gestão de reservas para imóveis de temporada
--              Suporta cadastro manual e sincronização via iCal (Airbnb, Booking.com, Vrbo)

-- ================================================
-- TABELA: GUESTS (Hóspedes)
-- ================================================

CREATE TABLE IF NOT EXISTS guests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,

  -- Dados pessoais
  full_name VARCHAR(200) NOT NULL,
  email VARCHAR(255),
  phone VARCHAR(20),
  document_type VARCHAR(20), -- 'cpf', 'rg', 'passport'
  document_number VARCHAR(50),

  -- Estatísticas
  total_bookings INTEGER DEFAULT 0,
  total_damages INTEGER DEFAULT 0,

  -- Notas
  notes TEXT,

  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  deleted_at TIMESTAMPTZ,

  -- Constraints
  CONSTRAINT unique_guest_email UNIQUE(user_id, email)
);

-- Índices
CREATE INDEX idx_guests_user_id ON guests(user_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_guests_email ON guests(email) WHERE deleted_at IS NULL;

-- Comentários
COMMENT ON TABLE guests IS 'Hóspedes de imóveis de temporada';
COMMENT ON COLUMN guests.total_bookings IS 'Contador de reservas deste hóspede';
COMMENT ON COLUMN guests.total_damages IS 'Contador de danos causados pelo hóspede';

-- ================================================
-- TABELA: BOOKINGS (Reservas)
-- ================================================

CREATE TABLE IF NOT EXISTS bookings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  property_id UUID NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
  guest_id UUID REFERENCES guests(id) ON DELETE SET NULL,

  -- Origem da reserva
  source VARCHAR(50) NOT NULL DEFAULT 'manual'
    CHECK (source IN ('manual', 'airbnb', 'booking', 'vrbo', 'other')),
  external_uid TEXT, -- UID do iCal (único por source)

  -- Datas
  check_in_date DATE NOT NULL,
  check_out_date DATE NOT NULL,
  nights_count INTEGER GENERATED ALWAYS AS (check_out_date - check_in_date) STORED,

  -- Status
  status VARCHAR(20) NOT NULL DEFAULT 'confirmed'
    CHECK (status IN ('confirmed', 'cancelled', 'blocked', 'completed')),

  -- Valores (opcional)
  total_amount DECIMAL(10,2),
  currency VARCHAR(3) DEFAULT 'BRL',

  -- Vistorias associadas
  checkin_inspection_id UUID REFERENCES inspections(id) ON DELETE SET NULL,
  checkout_inspection_id UUID REFERENCES inspections(id) ON DELETE SET NULL,

  -- Comparação (auto-gerada ao concluir checkout)
  comparison_id UUID REFERENCES comparisons(id) ON DELETE SET NULL,

  -- Notas
  notes TEXT,

  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  deleted_at TIMESTAMPTZ,

  -- Constraints
  CONSTRAINT check_dates CHECK (check_out_date > check_in_date),
  CONSTRAINT unique_external_booking UNIQUE(source, external_uid)
);

-- Índices
CREATE INDEX idx_bookings_user_id ON bookings(user_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_bookings_property_id ON bookings(property_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_bookings_guest_id ON bookings(guest_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_bookings_dates ON bookings(check_in_date, check_out_date) WHERE deleted_at IS NULL;
CREATE INDEX idx_bookings_status ON bookings(status) WHERE deleted_at IS NULL;
CREATE INDEX idx_bookings_source ON bookings(source) WHERE deleted_at IS NULL;

-- Comentários
COMMENT ON TABLE bookings IS 'Reservas de imóveis de temporada (manual ou sincronizadas)';
COMMENT ON COLUMN bookings.source IS 'Origem da reserva: manual, airbnb, booking, vrbo, other';
COMMENT ON COLUMN bookings.external_uid IS 'UID do evento iCal (para sincronização)';
COMMENT ON COLUMN bookings.nights_count IS 'Número de noites (calculado automaticamente)';
COMMENT ON COLUMN bookings.comparison_id IS 'Comparação gerada automaticamente ao concluir checkout';

-- ================================================
-- TABELA: ICAL_SOURCES (Links de Sincronização)
-- ================================================

CREATE TABLE IF NOT EXISTS ical_sources (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  property_id UUID NOT NULL REFERENCES properties(id) ON DELETE CASCADE,

  -- Dados do link
  source_name VARCHAR(50) NOT NULL
    CHECK (source_name IN ('airbnb', 'booking', 'vrbo', 'other')),
  ical_url TEXT NOT NULL,

  -- Status de sincronização
  is_active BOOLEAN DEFAULT TRUE,
  last_sync_at TIMESTAMPTZ,
  last_sync_status VARCHAR(20), -- 'success', 'error', 'pending'
  last_sync_error TEXT,
  sync_frequency_hours INTEGER DEFAULT 3,

  -- Estatísticas
  total_syncs INTEGER DEFAULT 0,
  total_bookings_imported INTEGER DEFAULT 0,

  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  -- Constraints
  CONSTRAINT unique_ical_property UNIQUE(property_id, source_name)
);

-- Índices
CREATE INDEX idx_ical_sources_user_id ON ical_sources(user_id);
CREATE INDEX idx_ical_sources_property_id ON ical_sources(property_id);
CREATE INDEX idx_ical_sources_active ON ical_sources(is_active) WHERE is_active = TRUE;

-- Comentários
COMMENT ON TABLE ical_sources IS 'Links iCal configurados para sincronização automática';
COMMENT ON COLUMN ical_sources.ical_url IS 'URL do calendário iCal (.ics)';
COMMENT ON COLUMN ical_sources.sync_frequency_hours IS 'Frequência de sincronização em horas (padrão: 3h)';

-- ================================================
-- ALTERAÇÕES NA TABELA INSPECTIONS
-- ================================================

-- Adicionar campo booking_id para vincular vistoria a reserva
ALTER TABLE inspections
ADD COLUMN IF NOT EXISTS booking_id UUID REFERENCES bookings(id) ON DELETE SET NULL;

-- Adicionar índice
CREATE INDEX IF NOT EXISTS idx_inspections_booking_id ON inspections(booking_id);

-- Comentário
COMMENT ON COLUMN inspections.booking_id IS 'Reserva associada (para vistorias de temporada)';

-- ================================================
-- TRIGGERS
-- ================================================

-- Trigger: Auto-update de updated_at (bookings)
CREATE TRIGGER update_bookings_updated_at
  BEFORE UPDATE ON bookings
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Trigger: Auto-update de updated_at (guests)
CREATE TRIGGER update_guests_updated_at
  BEFORE UPDATE ON guests
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Trigger: Auto-update de updated_at (ical_sources)
CREATE TRIGGER update_ical_sources_updated_at
  BEFORE UPDATE ON ical_sources
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ================================================
-- FUNÇÕES AUXILIARES
-- ================================================

-- Função: Detectar conflitos de reservas (double booking)
CREATE OR REPLACE FUNCTION detect_booking_conflicts(
  p_property_id UUID,
  p_check_in DATE,
  p_check_out DATE,
  p_exclude_booking_id UUID DEFAULT NULL
)
RETURNS TABLE (
  booking_id UUID,
  check_in_date DATE,
  check_out_date DATE,
  guest_name TEXT,
  source VARCHAR(50)
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    b.id,
    b.check_in_date,
    b.check_out_date,
    g.full_name,
    b.source
  FROM bookings b
  LEFT JOIN guests g ON g.id = b.guest_id
  WHERE b.property_id = p_property_id
    AND b.deleted_at IS NULL
    AND b.status NOT IN ('cancelled')
    AND (b.id != p_exclude_booking_id OR p_exclude_booking_id IS NULL)
    AND (
      -- Overlap de datas
      (b.check_in_date < p_check_out AND b.check_out_date > p_check_in)
    );
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION detect_booking_conflicts IS 'Detecta reservas conflitantes (double booking) para um imóvel e período';

-- Função: Atualizar contador de reservas do hóspede
CREATE OR REPLACE FUNCTION update_guest_bookings_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE guests
    SET total_bookings = total_bookings + 1
    WHERE id = NEW.guest_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE guests
    SET total_bookings = total_bookings - 1
    WHERE id = OLD.guest_id AND total_bookings > 0;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger: Atualizar contador ao criar/deletar reserva
CREATE TRIGGER trigger_update_guest_bookings_count
  AFTER INSERT OR DELETE ON bookings
  FOR EACH ROW
  EXECUTE FUNCTION update_guest_bookings_count();

-- ================================================
-- ROW LEVEL SECURITY (RLS)
-- ================================================

-- Habilitar RLS nas novas tabelas
ALTER TABLE guests ENABLE ROW LEVEL SECURITY;
ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE ical_sources ENABLE ROW LEVEL SECURITY;

-- Policies: GUESTS
CREATE POLICY "Users can view own guests"
  ON guests FOR SELECT
  USING (user_id IN (SELECT id FROM users WHERE clerk_id = auth.jwt() ->> 'sub'));

CREATE POLICY "Users can create own guests"
  ON guests FOR INSERT
  WITH CHECK (user_id IN (SELECT id FROM users WHERE clerk_id = auth.jwt() ->> 'sub'));

CREATE POLICY "Users can update own guests"
  ON guests FOR UPDATE
  USING (user_id IN (SELECT id FROM users WHERE clerk_id = auth.jwt() ->> 'sub'));

CREATE POLICY "Users can delete own guests"
  ON guests FOR DELETE
  USING (user_id IN (SELECT id FROM users WHERE clerk_id = auth.jwt() ->> 'sub'));

-- Policies: BOOKINGS
CREATE POLICY "Users can view own bookings"
  ON bookings FOR SELECT
  USING (user_id IN (SELECT id FROM users WHERE clerk_id = auth.jwt() ->> 'sub'));

CREATE POLICY "Users can create own bookings"
  ON bookings FOR INSERT
  WITH CHECK (user_id IN (SELECT id FROM users WHERE clerk_id = auth.jwt() ->> 'sub'));

CREATE POLICY "Users can update own bookings"
  ON bookings FOR UPDATE
  USING (user_id IN (SELECT id FROM users WHERE clerk_id = auth.jwt() ->> 'sub'));

CREATE POLICY "Users can delete own bookings"
  ON bookings FOR DELETE
  USING (user_id IN (SELECT id FROM users WHERE clerk_id = auth.jwt() ->> 'sub'));

-- Policies: ICAL_SOURCES
CREATE POLICY "Users can view own ical sources"
  ON ical_sources FOR SELECT
  USING (user_id IN (SELECT id FROM users WHERE clerk_id = auth.jwt() ->> 'sub'));

CREATE POLICY "Users can create own ical sources"
  ON ical_sources FOR INSERT
  WITH CHECK (user_id IN (SELECT id FROM users WHERE clerk_id = auth.jwt() ->> 'sub'));

CREATE POLICY "Users can update own ical sources"
  ON ical_sources FOR UPDATE
  USING (user_id IN (SELECT id FROM users WHERE clerk_id = auth.jwt() ->> 'sub'));

CREATE POLICY "Users can delete own ical sources"
  ON ical_sources FOR DELETE
  USING (user_id IN (SELECT id FROM users WHERE clerk_id = auth.jwt() ->> 'sub'));

-- ================================================
-- DADOS DE EXEMPLO (OPCIONAL - COMENTADO)
-- ================================================

-- Descomentar para adicionar dados de teste
-- INSERT INTO guests (user_id, full_name, email, phone) VALUES
-- ((SELECT id FROM users LIMIT 1), 'João Silva', 'joao@email.com', '(11) 99999-9999');

-- INSERT INTO bookings (user_id, property_id, guest_id, check_in_date, check_out_date, notes) VALUES
-- ((SELECT id FROM users LIMIT 1),
--  (SELECT id FROM properties LIMIT 1),
--  (SELECT id FROM guests LIMIT 1),
--  CURRENT_DATE + INTERVAL '7 days',
--  CURRENT_DATE + INTERVAL '14 days',
--  'Reserva de teste');

-- ================================================
-- FIM DA MIGRATION
-- ================================================

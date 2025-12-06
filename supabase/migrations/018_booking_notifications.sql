-- Migration 018: Booking Notifications System
-- Created: 2025-12-04
-- Description: Sistema de notificações para lembretes de check-in/check-out

-- ================================================
-- TABELA: NOTIFICATIONS (Notificações)
-- ================================================

CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,

  -- Tipo de notificação
  type VARCHAR(50) NOT NULL
    CHECK (type IN (
      'booking_checkin_reminder',
      'booking_checkout_reminder',
      'booking_checkin_today',
      'booking_checkout_today',
      'inspection_reminder',
      'system'
    )),

  -- Conteúdo
  title VARCHAR(200) NOT NULL,
  message TEXT NOT NULL,

  -- Relacionamento opcional
  booking_id UUID REFERENCES bookings(id) ON DELETE CASCADE,
  inspection_id UUID REFERENCES inspections(id) ON DELETE CASCADE,
  property_id UUID REFERENCES properties(id) ON DELETE CASCADE,

  -- Status
  status VARCHAR(20) NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'sent', 'failed', 'cancelled')),

  -- Controle de envio
  scheduled_for TIMESTAMPTZ NOT NULL, -- Quando deve ser enviada
  sent_at TIMESTAMPTZ, -- Quando foi efetivamente enviada
  read_at TIMESTAMPTZ, -- Quando o usuário leu (na interface)

  -- Link de ação
  action_url TEXT,

  -- Erro (se falhou)
  error_message TEXT,

  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  -- Índices na criação
  CONSTRAINT valid_scheduled_date CHECK (scheduled_for >= created_at)
);

-- Índices
CREATE INDEX idx_notifications_user_id ON notifications(user_id) WHERE status != 'cancelled';
CREATE INDEX idx_notifications_booking_id ON notifications(booking_id) WHERE booking_id IS NOT NULL;
CREATE INDEX idx_notifications_status ON notifications(status) WHERE status = 'pending';
CREATE INDEX idx_notifications_scheduled ON notifications(scheduled_for) WHERE status = 'pending';
CREATE INDEX idx_notifications_read ON notifications(user_id, read_at) WHERE read_at IS NULL;

-- Comentários
COMMENT ON TABLE notifications IS 'Sistema de notificações e lembretes para usuários';
COMMENT ON COLUMN notifications.type IS 'Tipo da notificação (check-in reminder, check-out reminder, etc)';
COMMENT ON COLUMN notifications.scheduled_for IS 'Data e hora agendada para envio';
COMMENT ON COLUMN notifications.sent_at IS 'Data e hora do envio efetivo';
COMMENT ON COLUMN notifications.read_at IS 'Data e hora que o usuário leu na interface';

-- ================================================
-- TABELA: NOTIFICATION_PREFERENCES (Preferências de Notificação)
-- ================================================

CREATE TABLE IF NOT EXISTS notification_preferences (
  user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,

  -- Check-in reminders
  checkin_reminder_enabled BOOLEAN DEFAULT TRUE,
  checkin_reminder_days_before INTEGER DEFAULT 1, -- Dias antes do check-in
  checkin_same_day_enabled BOOLEAN DEFAULT TRUE, -- Notificar no dia

  -- Check-out reminders
  checkout_reminder_enabled BOOLEAN DEFAULT TRUE,
  checkout_reminder_days_before INTEGER DEFAULT 1, -- Dias antes do check-out
  checkout_same_day_enabled BOOLEAN DEFAULT TRUE, -- Notificar no dia

  -- Inspection reminders
  inspection_reminder_enabled BOOLEAN DEFAULT TRUE,

  -- Canais de notificação
  email_enabled BOOLEAN DEFAULT TRUE,
  push_enabled BOOLEAN DEFAULT FALSE,

  -- Horário preferencial para envio
  preferred_send_time TIME DEFAULT '09:00:00', -- 9h da manhã por padrão

  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Comentários
COMMENT ON TABLE notification_preferences IS 'Preferências de notificação dos usuários';
COMMENT ON COLUMN notification_preferences.checkin_reminder_days_before IS 'Quantos dias antes do check-in enviar lembrete';
COMMENT ON COLUMN notification_preferences.preferred_send_time IS 'Horário preferencial para envio (ex: 09:00)';

-- ================================================
-- TRIGGERS
-- ================================================

-- Trigger: Auto-update de updated_at (notifications)
CREATE TRIGGER update_notifications_updated_at
  BEFORE UPDATE ON notifications
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Trigger: Auto-update de updated_at (notification_preferences)
CREATE TRIGGER update_notification_preferences_updated_at
  BEFORE UPDATE ON notification_preferences
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ================================================
-- FUNÇÕES AUXILIARES
-- ================================================

-- Função: Criar notificações automáticas para uma reserva
CREATE OR REPLACE FUNCTION create_booking_notifications(
  p_booking_id UUID,
  p_user_id UUID,
  p_property_id UUID,
  p_check_in_date DATE,
  p_check_out_date DATE
)
RETURNS void AS $$
DECLARE
  v_prefs notification_preferences;
  v_property_name TEXT;
  v_check_in_time TIMESTAMPTZ;
  v_check_out_time TIMESTAMPTZ;
BEGIN
  -- Buscar preferências do usuário (ou usar padrões)
  SELECT * INTO v_prefs
  FROM notification_preferences
  WHERE user_id = p_user_id;

  -- Se não existir, usar valores padrão
  IF v_prefs IS NULL THEN
    v_prefs.checkin_reminder_enabled := TRUE;
    v_prefs.checkin_reminder_days_before := 1;
    v_prefs.checkin_same_day_enabled := TRUE;
    v_prefs.checkout_reminder_enabled := TRUE;
    v_prefs.checkout_reminder_days_before := 1;
    v_prefs.checkout_same_day_enabled := TRUE;
    v_prefs.preferred_send_time := '09:00:00'::TIME;
  END IF;

  -- Buscar nome do imóvel
  SELECT name INTO v_property_name
  FROM properties
  WHERE id = p_property_id;

  -- Calcular timestamps considerando horário preferencial
  v_check_in_time := p_check_in_date::TIMESTAMP + v_prefs.preferred_send_time;
  v_check_out_time := p_check_out_date::TIMESTAMP + v_prefs.preferred_send_time;

  -- 1. Lembrete de check-in (X dias antes)
  IF v_prefs.checkin_reminder_enabled AND p_check_in_date > CURRENT_DATE THEN
    INSERT INTO notifications (
      user_id, type, title, message, booking_id, property_id,
      scheduled_for, action_url
    ) VALUES (
      p_user_id,
      'booking_checkin_reminder',
      'Lembrete: Check-in se aproximando',
      format('O check-in no imóvel "%s" está agendado para %s dias. Não se esqueça de realizar a vistoria de entrada!',
        v_property_name,
        CASE
          WHEN v_prefs.checkin_reminder_days_before = 1 THEN 'amanhã'
          ELSE v_prefs.checkin_reminder_days_before || ' dias'
        END
      ),
      p_booking_id,
      p_property_id,
      v_check_in_time - (v_prefs.checkin_reminder_days_before || ' days')::INTERVAL,
      '/dashboard/bookings/' || p_booking_id
    );
  END IF;

  -- 2. Lembrete de check-in (mesmo dia)
  IF v_prefs.checkin_same_day_enabled AND p_check_in_date >= CURRENT_DATE THEN
    INSERT INTO notifications (
      user_id, type, title, message, booking_id, property_id,
      scheduled_for, action_url
    ) VALUES (
      p_user_id,
      'booking_checkin_today',
      '🏠 Check-in HOJE!',
      format('Hoje é o dia do check-in no imóvel "%s". Lembre-se de fazer a vistoria de entrada o quanto antes!',
        v_property_name
      ),
      p_booking_id,
      p_property_id,
      v_check_in_time,
      '/dashboard/bookings/' || p_booking_id
    );
  END IF;

  -- 3. Lembrete de check-out (X dias antes)
  IF v_prefs.checkout_reminder_enabled AND p_check_out_date > CURRENT_DATE THEN
    INSERT INTO notifications (
      user_id, type, title, message, booking_id, property_id,
      scheduled_for, action_url
    ) VALUES (
      p_user_id,
      'booking_checkout_reminder',
      'Lembrete: Check-out se aproximando',
      format('O check-out no imóvel "%s" está agendado para %s. Prepare-se para realizar a vistoria de saída!',
        v_property_name,
        CASE
          WHEN v_prefs.checkout_reminder_days_before = 1 THEN 'amanhã'
          ELSE v_prefs.checkout_reminder_days_before || ' dias'
        END
      ),
      p_booking_id,
      p_property_id,
      v_check_out_time - (v_prefs.checkout_reminder_days_before || ' days')::INTERVAL,
      '/dashboard/bookings/' || p_booking_id
    );
  END IF;

  -- 4. Lembrete de check-out (mesmo dia)
  IF v_prefs.checkout_same_day_enabled AND p_check_out_date >= CURRENT_DATE THEN
    INSERT INTO notifications (
      user_id, type, title, message, booking_id, property_id,
      scheduled_for, action_url
    ) VALUES (
      p_user_id,
      'booking_checkout_today',
      '🚪 Check-out HOJE!',
      format('Hoje é o dia do check-out no imóvel "%s". Não se esqueça de fazer a vistoria de saída!',
        v_property_name
      ),
      p_booking_id,
      p_property_id,
      v_check_out_time,
      '/dashboard/bookings/' || p_booking_id
    );
  END IF;

END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION create_booking_notifications IS 'Cria notificações automáticas para uma reserva (check-in/check-out)';

-- Função: Cancelar notificações de uma reserva
CREATE OR REPLACE FUNCTION cancel_booking_notifications(p_booking_id UUID)
RETURNS void AS $$
BEGIN
  UPDATE notifications
  SET status = 'cancelled',
      updated_at = NOW()
  WHERE booking_id = p_booking_id
    AND status = 'pending';
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION cancel_booking_notifications IS 'Cancela todas as notificações pendentes de uma reserva';

-- ================================================
-- TRIGGER: Auto-criar notificações ao criar reserva
-- ================================================

CREATE OR REPLACE FUNCTION trigger_create_booking_notifications()
RETURNS TRIGGER AS $$
BEGIN
  -- Criar notificações apenas se a reserva não estiver cancelada
  IF NEW.status != 'cancelled' THEN
    PERFORM create_booking_notifications(
      NEW.id,
      NEW.user_id,
      NEW.property_id,
      NEW.check_in_date,
      NEW.check_out_date
    );
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_booking_notifications_on_insert
  AFTER INSERT ON bookings
  FOR EACH ROW
  EXECUTE FUNCTION trigger_create_booking_notifications();

-- ================================================
-- TRIGGER: Atualizar/cancelar notificações ao atualizar reserva
-- ================================================

CREATE OR REPLACE FUNCTION trigger_update_booking_notifications()
RETURNS TRIGGER AS $$
BEGIN
  -- Se a reserva foi cancelada, cancelar todas as notificações
  IF NEW.status = 'cancelled' AND OLD.status != 'cancelled' THEN
    PERFORM cancel_booking_notifications(NEW.id);
  END IF;

  -- Se as datas mudaram, recriar notificações
  IF (NEW.check_in_date != OLD.check_in_date OR NEW.check_out_date != OLD.check_out_date)
     AND NEW.status != 'cancelled' THEN
    -- Cancelar notificações antigas
    PERFORM cancel_booking_notifications(NEW.id);

    -- Criar novas notificações
    PERFORM create_booking_notifications(
      NEW.id,
      NEW.user_id,
      NEW.property_id,
      NEW.check_in_date,
      NEW.check_out_date
    );
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_booking_notifications_on_update
  AFTER UPDATE ON bookings
  FOR EACH ROW
  EXECUTE FUNCTION trigger_update_booking_notifications();

-- ================================================
-- ROW LEVEL SECURITY (RLS)
-- ================================================

ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE notification_preferences ENABLE ROW LEVEL SECURITY;

-- Policies: NOTIFICATIONS
CREATE POLICY "Users can view own notifications"
  ON notifications FOR SELECT
  USING (user_id IN (SELECT id FROM users WHERE clerk_id = auth.jwt() ->> 'sub'));

CREATE POLICY "Users can update own notifications"
  ON notifications FOR UPDATE
  USING (user_id IN (SELECT id FROM users WHERE clerk_id = auth.jwt() ->> 'sub'));

-- Policies: NOTIFICATION_PREFERENCES
CREATE POLICY "Users can view own preferences"
  ON notification_preferences FOR SELECT
  USING (user_id IN (SELECT id FROM users WHERE clerk_id = auth.jwt() ->> 'sub'));

CREATE POLICY "Users can insert own preferences"
  ON notification_preferences FOR INSERT
  WITH CHECK (user_id IN (SELECT id FROM users WHERE clerk_id = auth.jwt() ->> 'sub'));

CREATE POLICY "Users can update own preferences"
  ON notification_preferences FOR UPDATE
  USING (user_id IN (SELECT id FROM users WHERE clerk_id = auth.jwt() ->> 'sub'));

-- ================================================
-- ÍNDICE ADICIONAL PARA PERFORMANCE
-- ================================================

-- Índice composto para buscar notificações pendentes a enviar
CREATE INDEX idx_notifications_send_queue
  ON notifications(status, scheduled_for)
  WHERE status = 'pending' AND scheduled_for <= NOW() + INTERVAL '1 hour';

-- ================================================
-- FIM DA MIGRATION
-- ================================================

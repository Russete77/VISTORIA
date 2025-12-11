-- =============================================================================
-- VistorIA Pro - Calendar Events (Agenda)
-- Tabela para armazenar compromissos genéricos do calendário
-- Vistorias e reservas já existem em suas tabelas, esta é para eventos extras
-- =============================================================================

-- Criar tabela de eventos do calendário (compromissos)
CREATE TABLE IF NOT EXISTS public.calendar_events (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  
  -- Informações do evento
  title character varying(200) NOT NULL,
  description text,
  
  -- Tipo e categoria
  event_type character varying(50) NOT NULL DEFAULT 'appointment' 
    CHECK (event_type IN ('appointment', 'reminder', 'maintenance', 'meeting', 'other')),
  
  -- Datas e horários
  start_date date NOT NULL,
  start_time time,
  end_date date NOT NULL,
  end_time time,
  all_day boolean NOT NULL DEFAULT true,
  
  -- Relacionamentos opcionais
  property_id uuid,
  inspection_id uuid,
  booking_id uuid,
  
  -- Cor do evento (para visualização)
  color character varying(20) DEFAULT 'blue',
  
  -- Recorrência (futuro)
  is_recurring boolean DEFAULT false,
  recurrence_rule text,
  
  -- Status
  status character varying(20) NOT NULL DEFAULT 'active'
    CHECK (status IN ('active', 'completed', 'cancelled')),
  
  -- Metadados
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  deleted_at timestamp with time zone,
  
  CONSTRAINT calendar_events_pkey PRIMARY KEY (id),
  CONSTRAINT calendar_events_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id),
  CONSTRAINT calendar_events_property_id_fkey FOREIGN KEY (property_id) REFERENCES public.properties(id),
  CONSTRAINT calendar_events_inspection_id_fkey FOREIGN KEY (inspection_id) REFERENCES public.inspections(id),
  CONSTRAINT calendar_events_booking_id_fkey FOREIGN KEY (booking_id) REFERENCES public.bookings(id)
);

-- Enable RLS
ALTER TABLE public.calendar_events ENABLE ROW LEVEL SECURITY;

-- Policy para Service Role
CREATE POLICY "service_role_calendar_events" ON public.calendar_events
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_calendar_events_user_id ON public.calendar_events(user_id);
CREATE INDEX IF NOT EXISTS idx_calendar_events_start_date ON public.calendar_events(start_date);
CREATE INDEX IF NOT EXISTS idx_calendar_events_property_id ON public.calendar_events(property_id) WHERE property_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_calendar_events_dates ON public.calendar_events(start_date, end_date);

-- Update trigger
CREATE OR REPLACE FUNCTION update_calendar_events_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_calendar_events_updated_at
  BEFORE UPDATE ON public.calendar_events
  FOR EACH ROW
  EXECUTE FUNCTION update_calendar_events_updated_at();

-- =============================================================================
-- NOTAS:
-- 1. Vistorias com scheduled_date já são mostradas na agenda (via JOIN)
-- 2. Reservas com check_in_date/check_out_date já são mostradas (via JOIN)
-- 3. Esta tabela é para compromissos EXTRAS (manutenção, reuniões, lembretes)
-- =============================================================================

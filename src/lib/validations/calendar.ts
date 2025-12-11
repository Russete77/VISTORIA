import { z } from 'zod'

// ================================================
// CALENDAR EVENT TYPES
// ================================================

export type CalendarEventType = 'appointment' | 'reminder' | 'maintenance' | 'meeting' | 'other'
export type CalendarEventStatus = 'active' | 'completed' | 'cancelled'

// Cores disponíveis para eventos
export const eventColors = {
  blue: { bg: 'bg-blue-100', text: 'text-blue-800', border: 'border-blue-300' },
  green: { bg: 'bg-green-100', text: 'text-green-800', border: 'border-green-300' },
  purple: { bg: 'bg-purple-100', text: 'text-purple-800', border: 'border-purple-300' },
  orange: { bg: 'bg-orange-100', text: 'text-orange-800', border: 'border-orange-300' },
  red: { bg: 'bg-red-100', text: 'text-red-800', border: 'border-red-300' },
  yellow: { bg: 'bg-yellow-100', text: 'text-yellow-800', border: 'border-yellow-300' },
  pink: { bg: 'bg-pink-100', text: 'text-pink-800', border: 'border-pink-300' },
  teal: { bg: 'bg-teal-100', text: 'text-teal-800', border: 'border-teal-300' },
} as const

export type EventColor = keyof typeof eventColors

// ================================================
// UNIFIED CALENDAR EVENT (for display)
// ================================================

export type CalendarItemType = 'booking' | 'inspection' | 'event'

export interface CalendarItem {
  id: string
  type: CalendarItemType
  title: string
  description?: string | null
  startDate: string // YYYY-MM-DD
  endDate: string // YYYY-MM-DD
  startTime?: string | null // HH:MM
  endTime?: string | null // HH:MM
  allDay: boolean
  color: EventColor
  status: string
  // Dados extras dependendo do tipo
  propertyId?: string | null
  propertyName?: string | null
  inspectionId?: string | null
  bookingId?: string | null
  guestName?: string | null
  // Metadados
  createdAt?: string
}

// ================================================
// ZOD SCHEMAS
// ================================================

export const calendarEventTypeSchema = z.enum(['appointment', 'reminder', 'maintenance', 'meeting', 'other'])
export const calendarEventStatusSchema = z.enum(['active', 'completed', 'cancelled'])
export const eventColorSchema = z.enum(['blue', 'green', 'purple', 'orange', 'red', 'yellow', 'pink', 'teal'])

export const createCalendarEventSchema = z.object({
  title: z.string().min(1, 'Título é obrigatório').max(200, 'Título muito longo'),
  description: z.string().max(2000).optional().nullable(),
  event_type: calendarEventTypeSchema.default('appointment'),
  start_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Data inválida'),
  start_time: z.string().regex(/^\d{2}:\d{2}$/).optional().nullable(),
  end_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Data inválida'),
  end_time: z.string().regex(/^\d{2}:\d{2}$/).optional().nullable(),
  all_day: z.boolean().default(true),
  property_id: z.string().uuid().optional().nullable(),
  color: eventColorSchema.default('blue'),
}).refine(
  (data) => new Date(data.end_date) >= new Date(data.start_date),
  { message: 'Data de término deve ser igual ou posterior à data de início', path: ['end_date'] }
)

export const updateCalendarEventSchema = createCalendarEventSchema.partial().extend({
  status: calendarEventStatusSchema.optional(),
})

export type CreateCalendarEventInput = z.infer<typeof createCalendarEventSchema>
export type UpdateCalendarEventInput = z.infer<typeof updateCalendarEventSchema>

// ================================================
// DATABASE TYPE
// ================================================

export interface CalendarEvent {
  id: string
  user_id: string
  title: string
  description: string | null
  event_type: CalendarEventType
  start_date: string
  start_time: string | null
  end_date: string
  end_time: string | null
  all_day: boolean
  property_id: string | null
  inspection_id: string | null
  booking_id: string | null
  color: EventColor
  is_recurring: boolean
  recurrence_rule: string | null
  status: CalendarEventStatus
  created_at: string
  updated_at: string
  deleted_at: string | null
  // Relações
  property?: {
    id: string
    name: string
  }
}

// ================================================
// HELPER FUNCTIONS
// ================================================

/**
 * Converte booking para CalendarItem
 */
export function bookingToCalendarItem(booking: {
  id: string
  check_in_date: string
  check_out_date: string
  status: string
  property?: { id: string; name: string } | null
  guest?: { full_name: string } | null
}): CalendarItem {
  return {
    id: booking.id,
    type: 'booking',
    title: booking.guest?.full_name || 'Reserva',
    description: booking.property?.name,
    startDate: booking.check_in_date,
    endDate: booking.check_out_date,
    allDay: true,
    color: booking.status === 'confirmed' ? 'green' : booking.status === 'cancelled' ? 'red' : 'orange',
    status: booking.status,
    propertyId: booking.property?.id,
    propertyName: booking.property?.name,
    bookingId: booking.id,
    guestName: booking.guest?.full_name,
  }
}

/**
 * Converte inspection para CalendarItem
 */
export function inspectionToCalendarItem(inspection: {
  id: string
  scheduled_date: string | null
  type: string
  status: string
  property?: { id: string; name: string } | null
  tenant_name?: string | null
}): CalendarItem | null {
  if (!inspection.scheduled_date) return null
  
  // Parse date and time from scheduled_date (ISO format)
  const scheduledDate = new Date(inspection.scheduled_date)
  const date = inspection.scheduled_date.split('T')[0]
  
  // Extract time if present (not midnight or if explicitly set)
  const hours = scheduledDate.getUTCHours()
  const minutes = scheduledDate.getUTCMinutes()
  const hasTime = hours !== 0 || minutes !== 0
  const time = hasTime ? `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}` : null
  
  const typeLabel = inspection.type === 'move_in' ? 'Entrada' : inspection.type === 'move_out' ? 'Saída' : 'Periódica'
  
  return {
    id: inspection.id,
    type: 'inspection',
    title: `Vistoria ${typeLabel}`,
    description: inspection.property?.name,
    startDate: date,
    endDate: date,
    startTime: time,
    endTime: null,
    allDay: !hasTime,
    color: inspection.status === 'completed' ? 'teal' : 'purple',
    status: inspection.status,
    propertyId: inspection.property?.id,
    propertyName: inspection.property?.name,
    inspectionId: inspection.id,
    guestName: inspection.tenant_name,
  }
}

/**
 * Converte calendar_event para CalendarItem
 */
export function eventToCalendarItem(event: CalendarEvent): CalendarItem {
  return {
    id: event.id,
    type: 'event',
    title: event.title,
    description: event.description,
    startDate: event.start_date,
    endDate: event.end_date,
    startTime: event.start_time,
    endTime: event.end_time,
    allDay: event.all_day,
    color: event.color,
    status: event.status,
    propertyId: event.property_id,
    propertyName: event.property?.name,
    createdAt: event.created_at,
  }
}

/**
 * Retorna os dias de um mês para o calendário
 */
export function getCalendarDays(year: number, month: number): Date[] {
  const firstDay = new Date(year, month, 1)
  const lastDay = new Date(year, month + 1, 0)
  
  // Preencher dias do mês anterior para completar a primeira semana
  const startDayOfWeek = firstDay.getDay() // 0 = domingo
  const days: Date[] = []
  
  // Adicionar dias do mês anterior
  for (let i = startDayOfWeek - 1; i >= 0; i--) {
    const date = new Date(year, month, -i)
    days.push(date)
  }
  
  // Adicionar dias do mês atual
  for (let day = 1; day <= lastDay.getDate(); day++) {
    days.push(new Date(year, month, day))
  }
  
  // Preencher dias do próximo mês para completar a última semana
  const endDayOfWeek = lastDay.getDay()
  for (let i = 1; i <= 6 - endDayOfWeek; i++) {
    days.push(new Date(year, month + 1, i))
  }
  
  return days
}

/**
 * Formata data para display
 */
export function formatCalendarDate(date: Date): string {
  return date.toLocaleDateString('pt-BR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })
}

/**
 * Verifica se duas datas são o mesmo dia
 */
export function isSameDay(date1: Date, date2: Date): boolean {
  return (
    date1.getFullYear() === date2.getFullYear() &&
    date1.getMonth() === date2.getMonth() &&
    date1.getDate() === date2.getDate()
  )
}

/**
 * Verifica se um evento está em um determinado dia
 */
export function isEventOnDay(item: CalendarItem, day: Date): boolean {
  const startDate = new Date(item.startDate + 'T00:00:00')
  const endDate = new Date(item.endDate + 'T00:00:00')
  const checkDay = new Date(day.getFullYear(), day.getMonth(), day.getDate())
  
  return checkDay >= startDate && checkDay <= endDate
}

import { z } from 'zod'

// ================================================
// ENUMS
// ================================================

export const bookingSourceSchema = z.enum(['manual', 'airbnb', 'booking', 'vrbo', 'other'])
export type BookingSource = z.infer<typeof bookingSourceSchema>

export const bookingStatusSchema = z.enum(['confirmed', 'cancelled', 'blocked', 'completed'])
export type BookingStatus = z.infer<typeof bookingStatusSchema>

// ================================================
// GUEST SCHEMAS
// ================================================

export const createGuestSchema = z.object({
  full_name: z.string().min(2, 'Nome deve ter no mínimo 2 caracteres').max(200, 'Nome muito longo'),
  email: z.string().email('Email inválido').optional().nullable(),
  phone: z.string().max(20, 'Telefone muito longo').optional().nullable(),
  document_type: z.enum(['cpf', 'rg', 'passport']).optional().nullable(),
  document_number: z.string().max(50).optional().nullable(),
  notes: z.string().max(2000).optional().nullable(),
})

export const updateGuestSchema = createGuestSchema.partial()

export type CreateGuestInput = z.infer<typeof createGuestSchema>
export type UpdateGuestInput = z.infer<typeof updateGuestSchema>

// ================================================
// BOOKING SCHEMAS
// ================================================

export const createBookingSchema = z.object({
  property_id: z.string().uuid('ID de imóvel inválido'),

  // Guest info (pode ser nome direto ou guest_id)
  guest_id: z.string().uuid().optional().nullable(),
  guest_name: z.string().min(2).max(200).optional(),
  guest_email: z.string().email('Email inválido').optional().nullable(),
  guest_phone: z.string().max(20).optional().nullable(),

  // Datas (formato YYYY-MM-DD)
  check_in_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Data inválida (use YYYY-MM-DD)'),
  check_out_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Data inválida (use YYYY-MM-DD)'),

  // Valores opcionais
  total_amount: z.number().min(0).optional().nullable(),
  currency: z.string().length(3).optional().nullable(),

  // Notas
  notes: z.string().max(2000).optional().nullable(),
}).refine(
  (data) => {
    // Deve ter guest_id OU guest_name
    return data.guest_id || data.guest_name
  },
  {
    message: 'Informe o ID do hóspede ou o nome',
    path: ['guest_name'],
  }
).refine(
  (data) => {
    // Check-out deve ser após check-in
    return new Date(data.check_out_date) > new Date(data.check_in_date)
  },
  {
    message: 'Data de saída deve ser após a data de entrada',
    path: ['check_out_date'],
  }
)

export const updateBookingSchema = z.object({
  guest_id: z.string().uuid().optional().nullable(),
  guest_name: z.string().min(2).max(200).optional(),
  guest_email: z.string().email().optional().nullable(),
  guest_phone: z.string().max(20).optional().nullable(),

  check_in_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  check_out_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),

  status: bookingStatusSchema.optional(),

  total_amount: z.number().min(0).optional().nullable(),
  currency: z.string().length(3).optional().nullable(),

  notes: z.string().max(2000).optional().nullable(),

  // Vincular vistorias
  checkin_inspection_id: z.string().uuid().optional().nullable(),
  checkout_inspection_id: z.string().uuid().optional().nullable(),
}).refine(
  (data) => {
    // Se ambas as datas forem fornecidas, check-out deve ser após check-in
    if (data.check_in_date && data.check_out_date) {
      return new Date(data.check_out_date) > new Date(data.check_in_date)
    }
    return true
  },
  {
    message: 'Data de saída deve ser após a data de entrada',
    path: ['check_out_date'],
  }
)

export type CreateBookingInput = z.infer<typeof createBookingSchema>
export type UpdateBookingInput = z.infer<typeof updateBookingSchema>

// ================================================
// ICAL SOURCE SCHEMAS
// ================================================

export const icalSourceNameSchema = z.enum(['airbnb', 'booking', 'vrbo', 'other'])
export type ICalSourceName = z.infer<typeof icalSourceNameSchema>

export const createICalSourceSchema = z.object({
  property_id: z.string().uuid('ID de imóvel inválido'),
  source_name: icalSourceNameSchema,
  ical_url: z.string().url('URL inválida').startsWith('http', 'URL deve começar com http:// ou https://'),
  sync_frequency_hours: z.number().int().min(1).max(24).optional(),
})

export const updateICalSourceSchema = z.object({
  ical_url: z.string().url().startsWith('http').optional(),
  is_active: z.boolean().optional(),
  sync_frequency_hours: z.number().int().min(1).max(24).optional(),
})

export type CreateICalSourceInput = z.infer<typeof createICalSourceSchema>
export type UpdateICalSourceInput = z.infer<typeof updateICalSourceSchema>

// ================================================
// QUERY PARAMS SCHEMAS
// ================================================

export const listBookingsQuerySchema = z.object({
  property_id: z.string().uuid().optional(),
  guest_id: z.string().uuid().optional(),
  status: bookingStatusSchema.optional(),
  source: bookingSourceSchema.optional(),
  from_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(), // YYYY-MM-DD
  to_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  limit: z.string().regex(/^\d+$/).transform(Number).optional(),
  offset: z.string().regex(/^\d+$/).transform(Number).optional(),
})

export type ListBookingsQuery = z.infer<typeof listBookingsQuerySchema>

// ================================================
// RESPONSE TYPES
// ================================================

export interface Booking {
  id: string
  user_id: string
  property_id: string
  guest_id: string | null
  source: BookingSource
  external_uid: string | null
  check_in_date: string // YYYY-MM-DD
  check_out_date: string // YYYY-MM-DD
  nights_count: number
  status: BookingStatus
  total_amount: number | null
  currency: string | null
  checkin_inspection_id: string | null
  checkout_inspection_id: string | null
  comparison_id: string | null
  notes: string | null
  created_at: string
  updated_at: string
  deleted_at: string | null
  // Relações
  property?: {
    id: string
    name: string
    address: string
    city: string
    state: string
  }
  guest?: {
    id: string
    full_name: string
    email: string | null
    phone: string | null
  }
  checkin_inspection?: {
    id: string
    status: string
    completed_at: string | null
  }
  checkout_inspection?: {
    id: string
    status: string
    completed_at: string | null
  }
  comparison?: {
    id: string
    status: string
    differences_detected: number
  }
}

export interface Guest {
  id: string
  user_id: string
  full_name: string
  email: string | null
  phone: string | null
  document_type: string | null
  document_number: string | null
  total_bookings: number
  total_damages: number
  notes: string | null
  created_at: string
  updated_at: string
  deleted_at: string | null
}

export interface ICalSource {
  id: string
  user_id: string
  property_id: string
  source_name: ICalSourceName
  ical_url: string
  is_active: boolean
  last_sync_at: string | null
  last_sync_status: string | null
  last_sync_error: string | null
  sync_frequency_hours: number
  total_syncs: number
  total_bookings_imported: number
  created_at: string
  updated_at: string
}

// ================================================
// HELPER FUNCTIONS
// ================================================

/**
 * Valida se há conflito de datas entre reservas
 */
export function hasDateOverlap(
  checkIn1: Date,
  checkOut1: Date,
  checkIn2: Date,
  checkOut2: Date
): boolean {
  return checkIn1 < checkOut2 && checkOut1 > checkIn2
}

/**
 * Formata datas para display
 */
export function formatBookingDates(checkIn: string, checkOut: string): string {
  const checkInDate = new Date(checkIn + 'T00:00:00')
  const checkOutDate = new Date(checkOut + 'T00:00:00')
  const nights = Math.ceil((checkOutDate.getTime() - checkInDate.getTime()) / (1000 * 60 * 60 * 24))

  return `${checkInDate.toLocaleDateString('pt-BR')} - ${checkOutDate.toLocaleDateString('pt-BR')} (${nights} ${nights === 1 ? 'noite' : 'noites'})`
}

/**
 * Calcula número de noites
 */
export function calculateNights(checkIn: string, checkOut: string): number {
  const checkInDate = new Date(checkIn + 'T00:00:00')
  const checkOutDate = new Date(checkOut + 'T00:00:00')
  return Math.ceil((checkOutDate.getTime() - checkInDate.getTime()) / (1000 * 60 * 60 * 24))
}

import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { createClient, createAdminClient, getOrCreateUser } from '@/lib/supabase/server'
import {
  createBookingSchema,
  listBookingsQuerySchema,
  type Booking,
} from '@/lib/validations/bookings'

/**
 * GET /api/bookings
 * Lista todas as reservas do usuário
 * Query params: property_id, status, source, from_date, to_date, limit, offset
 */
export async function GET(request: NextRequest) {
  try {
    // 1. Autenticação
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // 2. Supabase client (admin para bypass RLS)
    const supabase = createAdminClient()

    // 3. Buscar ou criar user no Supabase
    let userData
    try {
      const result = await getOrCreateUser(userId, supabase)
      userData = result.data
    } catch (err: any) {
      console.error('[Bookings GET] Failed to get or create user:', err?.message)
      return NextResponse.json({ error: 'Failed to get user', details: err?.message }, { status: 500 })
    }

    // 4. Parse query params
    const { searchParams } = new URL(request.url)
    const queryParams = Object.fromEntries(searchParams.entries())

    const validatedQuery = listBookingsQuerySchema.parse(queryParams)

    // 5. Build query
    let query = supabase
      .from('bookings')
      .select(`
        *,
        property:properties(id, name, address, city, state),
        guest:guests(id, full_name, email, phone),
        checkin_inspection:inspections!bookings_checkin_inspection_id_fkey(id, status, completed_at),
        checkout_inspection:inspections!bookings_checkout_inspection_id_fkey(id, status, completed_at),
        comparison:comparisons(id, status, differences_detected)
      `)
      .eq('user_id', userData.id)
      .is('deleted_at', null)
      .order('check_in_date', { ascending: false })

    // Filtros opcionais
    if (validatedQuery.property_id) {
      query = query.eq('property_id', validatedQuery.property_id)
    }

    if (validatedQuery.status) {
      query = query.eq('status', validatedQuery.status)
    }

    if (validatedQuery.source) {
      query = query.eq('source', validatedQuery.source)
    }

    if (validatedQuery.from_date) {
      query = query.gte('check_in_date', validatedQuery.from_date)
    }

    if (validatedQuery.to_date) {
      query = query.lte('check_out_date', validatedQuery.to_date)
    }

    // Paginação
    const limit = validatedQuery.limit || 50
    const offset = validatedQuery.offset || 0
    query = query.range(offset, offset + limit - 1)

    // 6. Execute query
    const { data, error, count } = await query

    if (error) {
      console.error('[Bookings GET] Error:', error)
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      )
    }

    // 7. Response
    return NextResponse.json({
      data: data as Booking[],
      count,
      limit,
      offset,
    })
  } catch (error) {
    console.error('[Bookings GET] Unexpected error:', error)

    if (error instanceof Error) {
      return NextResponse.json(
        { error: error.message },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

/**
 * POST /api/bookings
 * Cria uma nova reserva (manual)
 */
export async function POST(request: NextRequest) {
  try {
    // 1. Autenticação
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // 2. Supabase client (admin para bypass RLS)
    const supabase = createAdminClient()

    // 3. Buscar ou criar user no Supabase
    let user = await supabase
      .from('users')
      .select('id')
      .eq('clerk_id', userId)
      .single()

    if (!user.data) {
      // Usuário não existe, criar automaticamente usando admin client (bypass RLS)
      const supabaseAdmin = createAdminClient()
      const newUserResult = await supabaseAdmin
        .from('users')
        .upsert({
          clerk_id: userId,
          email: `${userId}@no-email.vistoria.internal`,
        }, { onConflict: 'clerk_id' })
        .select('id')
        .single()

      user = newUserResult
    }

    if (!user.data) {
      console.error('[Bookings POST] Failed to get/create user')
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // 4. Parse e validar body
    const body = await request.json()
    const validatedData = createBookingSchema.parse(body)

    // 5. Verificar se property pertence ao user
    const { data: property, error: propertyError } = await supabase
      .from('properties')
      .select('id')
      .eq('id', validatedData.property_id)
      .eq('user_id', user.data.id)
      .is('deleted_at', null)
      .single()

    if (propertyError || !property) {
      return NextResponse.json(
        { error: 'Property not found or access denied' },
        { status: 404 }
      )
    }

    // 6. Detectar conflitos de reservas (double booking)
    const { data: conflicts } = await supabase.rpc('detect_booking_conflicts', {
      p_property_id: validatedData.property_id,
      p_check_in: validatedData.check_in_date,
      p_check_out: validatedData.check_out_date,
    })

    if (conflicts && conflicts.length > 0) {
      return NextResponse.json(
        {
          error: 'Conflito de datas: já existe uma reserva neste período',
          conflicts,
        },
        { status: 409 } // 409 Conflict
      )
    }

    // 7. Criar ou buscar guest
    let guestId = validatedData.guest_id

    if (!guestId && validatedData.guest_name) {
      // Verificar se guest com esse email já existe
      if (validatedData.guest_email) {
        const { data: existingGuest } = await supabase
          .from('guests')
          .select('id')
          .eq('user_id', user.data.id)
          .eq('email', validatedData.guest_email)
          .is('deleted_at', null)
          .single()

        if (existingGuest) {
          guestId = existingGuest.id
        }
      }

      // Se não existe, criar novo guest
      if (!guestId) {
        const { data: newGuest, error: guestError } = await supabase
          .from('guests')
          .insert({
            user_id: user.data.id,
            full_name: validatedData.guest_name,
            email: validatedData.guest_email,
            phone: validatedData.guest_phone,
          })
          .select('id')
          .single()

        if (guestError) {
          console.error('[Bookings POST] Error creating guest:', guestError)
          // Continuar mesmo sem guest (guest_id será null)
        } else {
          guestId = newGuest.id
        }
      }
    }

    // 8. Criar booking
    const { data: booking, error: bookingError } = await supabase
      .from('bookings')
      .insert({
        user_id: user.data.id,
        property_id: validatedData.property_id,
        guest_id: guestId || null,
        source: 'manual',
        check_in_date: validatedData.check_in_date,
        check_out_date: validatedData.check_out_date,
        total_amount: validatedData.total_amount,
        currency: validatedData.currency || 'BRL',
        notes: validatedData.notes,
        status: 'confirmed',
      })
      .select(`
        *,
        property:properties(id, name, address, city, state),
        guest:guests(id, full_name, email, phone)
      `)
      .single()

    if (bookingError) {
      console.error('[Bookings POST] Error creating booking:', bookingError)
      return NextResponse.json(
        { error: bookingError.message },
        { status: 500 }
      )
    }

    // 9. Success response
    return NextResponse.json(
      {
        data: booking as Booking,
        message: 'Reserva criada com sucesso',
      },
      { status: 201 }
    )
  } catch (error) {
    console.error('[Bookings POST] Unexpected error:', error)

    if (error instanceof Error) {
      return NextResponse.json(
        { error: error.message },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

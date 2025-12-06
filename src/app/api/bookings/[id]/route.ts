import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { createClient, createAdminClient } from '@/lib/supabase/server'
import { updateBookingSchema, type Booking } from '@/lib/validations/bookings'

type RouteContext = {
  params: Promise<{ id: string }>
}

/**
 * GET /api/bookings/[id]
 * Busca detalhes de uma reserva específica
 */
export async function GET(
  request: NextRequest,
  context: RouteContext
) {
  try {
    // 1. Autenticação
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // 2. Get booking ID
    const { id: bookingId } = await context.params

    // 3. Supabase client (admin para bypass RLS)
    const supabase = createAdminClient()

    // 4. Buscar ou criar user no Supabase
    let user = await supabase
      .from('users')
      .select('id')
      .eq('clerk_id', userId)
      .single()

    if (!user.data) {
      const supabaseAdmin = createAdminClient()
      const newUserResult = await supabaseAdmin
        .from('users')
        .upsert({ clerk_id: userId, email: `${userId}@no-email.vistoria.internal` }, { onConflict: 'clerk_id' })
        .select('id')
        .single()
      user = newUserResult
    }

    if (!user.data) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // 5. Buscar booking
    const { data: booking, error: bookingError } = await supabase
      .from('bookings')
      .select(`
        *,
        property:properties(id, name, address, city, state, property_type, bedrooms, bathrooms),
        guest:guests(id, full_name, email, phone, document_type, document_number, total_bookings, total_damages),
        checkin_inspection:inspections!bookings_checkin_inspection_id_fkey(
          id, type, status, completed_at, total_problems, urgent_problems, report_url
        ),
        checkout_inspection:inspections!bookings_checkout_inspection_id_fkey(
          id, type, status, completed_at, total_problems, urgent_problems, report_url
        ),
        comparison:comparisons(
          id, status, differences_detected, new_damages, estimated_repair_cost, report_url
        )
      `)
      .eq('id', bookingId)
      .eq('user_id', user.data.id)
      .is('deleted_at', null)
      .single()

    if (bookingError || !booking) {
      return NextResponse.json(
        { error: 'Booking not found or access denied' },
        { status: 404 }
      )
    }

    // 6. Response
    return NextResponse.json({ data: booking as Booking })
  } catch (error) {
    console.error('[Bookings GET [id]] Unexpected error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

/**
 * PATCH /api/bookings/[id]
 * Atualiza uma reserva
 */
export async function PATCH(
  request: NextRequest,
  context: RouteContext
) {
  try {
    // 1. Autenticação
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // 2. Get booking ID
    const { id: bookingId } = await context.params

    // 3. Supabase client (admin para bypass RLS)
    const supabase = createAdminClient()

    // 4. Buscar ou criar user no Supabase
    let user = await supabase
      .from('users')
      .select('id')
      .eq('clerk_id', userId)
      .single()

    if (!user.data) {
      const supabaseAdmin = createAdminClient()
      const newUserResult = await supabaseAdmin
        .from('users')
        .upsert({ clerk_id: userId, email: `${userId}@no-email.vistoria.internal` }, { onConflict: 'clerk_id' })
        .select('id')
        .single()
      user = newUserResult
    }

    if (!user.data) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // 5. Verificar se booking pertence ao user
    const { data: existingBooking, error: existingError } = await supabase
      .from('bookings')
      .select('id, property_id, check_in_date, check_out_date')
      .eq('id', bookingId)
      .eq('user_id', user.data.id)
      .is('deleted_at', null)
      .single()

    if (existingError || !existingBooking) {
      return NextResponse.json(
        { error: 'Booking not found or access denied' },
        { status: 404 }
      )
    }

    // 6. Parse e validar body
    const body = await request.json()
    const validatedData = updateBookingSchema.parse(body)

    // 7. Se datas mudaram, detectar conflitos
    if (validatedData.check_in_date || validatedData.check_out_date) {
      const newCheckIn = validatedData.check_in_date || existingBooking.check_in_date
      const newCheckOut = validatedData.check_out_date || existingBooking.check_out_date

      const { data: conflicts } = await supabase.rpc('detect_booking_conflicts', {
        p_property_id: existingBooking.property_id,
        p_check_in: newCheckIn,
        p_check_out: newCheckOut,
        p_exclude_booking_id: bookingId,
      })

      if (conflicts && conflicts.length > 0) {
        return NextResponse.json(
          {
            error: 'Conflito de datas: já existe uma reserva neste período',
            conflicts,
          },
          { status: 409 }
        )
      }
    }

    // 8. Atualizar guest se necessário
    if (validatedData.guest_id === null && validatedData.guest_name) {
      // Criar novo guest
      const { data: newGuest } = await supabase
        .from('guests')
        .insert({
          user_id: user.data.id,
          full_name: validatedData.guest_name,
          email: validatedData.guest_email,
          phone: validatedData.guest_phone,
        })
        .select('id')
        .single()

      if (newGuest) {
        validatedData.guest_id = newGuest.id
      }
    }

    // 9. Atualizar booking
    const { data: updatedBooking, error: updateError } = await supabase
      .from('bookings')
      .update({
        ...validatedData,
        // Remove campos que não devem ser atualizados diretamente
        guest_name: undefined,
        guest_email: undefined,
        guest_phone: undefined,
      })
      .eq('id', bookingId)
      .select(`
        *,
        property:properties(id, name, address, city, state),
        guest:guests(id, full_name, email, phone)
      `)
      .single()

    if (updateError) {
      console.error('[Bookings PATCH] Error updating booking:', updateError)
      return NextResponse.json(
        { error: updateError.message },
        { status: 500 }
      )
    }

    // 10. Success response
    return NextResponse.json({
      data: updatedBooking as Booking,
      message: 'Reserva atualizada com sucesso',
    })
  } catch (error) {
    console.error('[Bookings PATCH] Unexpected error:', error)

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
 * DELETE /api/bookings/[id]
 * Remove uma reserva (soft delete)
 */
export async function DELETE(
  request: NextRequest,
  context: RouteContext
) {
  try {
    // 1. Autenticação
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // 2. Get booking ID
    const { id: bookingId } = await context.params

    // 3. Supabase client (admin para bypass RLS)
    const supabase = createAdminClient()

    // 4. Buscar ou criar user no Supabase
    let user = await supabase
      .from('users')
      .select('id')
      .eq('clerk_id', userId)
      .single()

    if (!user.data) {
      const supabaseAdmin = createAdminClient()
      const newUserResult = await supabaseAdmin
        .from('users')
        .upsert({ clerk_id: userId, email: `${userId}@no-email.vistoria.internal` }, { onConflict: 'clerk_id' })
        .select('id')
        .single()
      user = newUserResult
    }

    if (!user.data) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // 5. Verificar se booking pertence ao user
    const { data: existingBooking, error: existingError } = await supabase
      .from('bookings')
      .select('id')
      .eq('id', bookingId)
      .eq('user_id', user.data.id)
      .is('deleted_at', null)
      .single()

    if (existingError || !existingBooking) {
      return NextResponse.json(
        { error: 'Booking not found or access denied' },
        { status: 404 }
      )
    }

    // 6. Soft delete
    const { error: deleteError } = await supabase
      .from('bookings')
      .update({ deleted_at: new Date().toISOString() })
      .eq('id', bookingId)

    if (deleteError) {
      console.error('[Bookings DELETE] Error deleting booking:', deleteError)
      return NextResponse.json(
        { error: deleteError.message },
        { status: 500 }
      )
    }

    // 7. Success response
    return NextResponse.json({
      message: 'Reserva removida com sucesso',
    })
  } catch (error) {
    console.error('[Bookings DELETE] Unexpected error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

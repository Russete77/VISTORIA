import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { createAdminClient, getOrCreateUser } from '@/lib/supabase/server'
import {
  updateCalendarEventSchema,
  eventToCalendarItem,
} from '@/lib/validations/calendar'

interface RouteParams {
  params: Promise<{ id: string }>
}

/**
 * GET /api/calendar/[id]
 * Retorna um evento específico
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params
    const supabase = createAdminClient()
    const { data: user } = await getOrCreateUser(userId, supabase)

    const { data: event, error } = await supabase
      .from('calendar_events')
      .select(`
        *,
        property:properties(id, name)
      `)
      .eq('id', id)
      .eq('user_id', user.id)
      .is('deleted_at', null)
      .single()

    if (error || !event) {
      return NextResponse.json(
        { error: 'Evento não encontrado' },
        { status: 404 }
      )
    }

    return NextResponse.json({ data: eventToCalendarItem(event) })
  } catch (error) {
    console.error('Calendar GET [id] error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

/**
 * PATCH /api/calendar/[id]
 * Atualiza um evento
 */
export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params
    const supabase = createAdminClient()
    const { data: user } = await getOrCreateUser(userId, supabase)

    // Verificar se evento existe e pertence ao usuário
    const { data: existingEvent } = await supabase
      .from('calendar_events')
      .select('id')
      .eq('id', id)
      .eq('user_id', user.id)
      .is('deleted_at', null)
      .single()

    if (!existingEvent) {
      return NextResponse.json(
        { error: 'Evento não encontrado' },
        { status: 404 }
      )
    }

    const body = await request.json()
    const validationResult = updateCalendarEventSchema.safeParse(body)

    if (!validationResult.success) {
      return NextResponse.json(
        { error: 'Validation error', details: validationResult.error.format() },
        { status: 400 }
      )
    }

    const updateData = validationResult.data

    // Verificar property_id se fornecido
    if (updateData.property_id) {
      const { data: property } = await supabase
        .from('properties')
        .select('id')
        .eq('id', updateData.property_id)
        .eq('user_id', user.id)
        .single()

      if (!property) {
        return NextResponse.json(
          { error: 'Imóvel não encontrado' },
          { status: 404 }
        )
      }
    }

    const { data: event, error } = await supabase
      .from('calendar_events')
      .update(updateData)
      .eq('id', id)
      .select(`
        *,
        property:properties(id, name)
      `)
      .single()

    if (error) {
      console.error('Error updating calendar event:', error)
      return NextResponse.json(
        { error: 'Erro ao atualizar evento' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      data: eventToCalendarItem(event),
      message: 'Evento atualizado com sucesso',
    })
  } catch (error) {
    console.error('Calendar PATCH error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

/**
 * DELETE /api/calendar/[id]
 * Remove um evento (soft delete)
 */
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params
    const supabase = createAdminClient()
    const { data: user } = await getOrCreateUser(userId, supabase)

    // Verificar se evento existe e pertence ao usuário
    const { data: existingEvent } = await supabase
      .from('calendar_events')
      .select('id')
      .eq('id', id)
      .eq('user_id', user.id)
      .is('deleted_at', null)
      .single()

    if (!existingEvent) {
      return NextResponse.json(
        { error: 'Evento não encontrado' },
        { status: 404 }
      )
    }

    // Soft delete
    const { error } = await supabase
      .from('calendar_events')
      .update({ deleted_at: new Date().toISOString() })
      .eq('id', id)

    if (error) {
      console.error('Error deleting calendar event:', error)
      return NextResponse.json(
        { error: 'Erro ao remover evento' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      message: 'Evento removido com sucesso',
    })
  } catch (error) {
    console.error('Calendar DELETE error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

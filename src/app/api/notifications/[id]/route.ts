import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { createAdminClient } from '@/lib/supabase/server'

type RouteContext = {
  params: Promise<{ id: string }>
}

/**
 * GET /api/notifications/[id]
 * Busca uma notificação específica
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

    // 2. Get notification ID
    const { id: notificationId } = await context.params

    // 3. Supabase client (admin para bypass RLS)
    const supabase = createAdminClient()

    // 4. Buscar user no Supabase
    const { data: user } = await supabase
      .from('users')
      .select('id')
      .eq('clerk_id', userId)
      .single()

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // 5. Buscar notification
    const { data: notification, error } = await supabase
      .from('notifications')
      .select('*')
      .eq('id', notificationId)
      .eq('user_id', user.id)
      .single()

    if (error || !notification) {
      return NextResponse.json(
        { error: 'Notification not found' },
        { status: 404 }
      )
    }

    // 6. Response
    return NextResponse.json({ data: notification })
  } catch (error) {
    console.error('[Notifications GET [id]] Unexpected error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

/**
 * PATCH /api/notifications/[id]
 * Marca uma notificação como lida ou atualiza status
 * Body: { read_at?: string, status?: string }
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

    // 2. Get notification ID
    const { id: notificationId } = await context.params

    // 3. Supabase client (admin para bypass RLS)
    const supabase = createAdminClient()

    // 4. Buscar user no Supabase
    const { data: user } = await supabase
      .from('users')
      .select('id')
      .eq('clerk_id', userId)
      .single()

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // 5. Verificar se notification pertence ao user
    const { data: existingNotification, error: existingError } = await supabase
      .from('notifications')
      .select('id')
      .eq('id', notificationId)
      .eq('user_id', user.id)
      .single()

    if (existingError || !existingNotification) {
      return NextResponse.json(
        { error: 'Notification not found' },
        { status: 404 }
      )
    }

    // 6. Parse body
    const body = await request.json()

    // Permitir marcar como lida
    const updateData: Record<string, any> = {}

    if ('mark_read' in body && body.mark_read === true) {
      updateData.read_at = new Date().toISOString()
    }

    if ('status' in body) {
      const validStatuses = ['pending', 'sent', 'failed', 'cancelled']
      if (!validStatuses.includes(body.status)) {
        return NextResponse.json(
          { error: 'Invalid status' },
          { status: 400 }
        )
      }
      updateData.status = body.status
    }

    // 7. Update notification
    const { data: updatedNotification, error: updateError } = await supabase
      .from('notifications')
      .update(updateData)
      .eq('id', notificationId)
      .select()
      .single()

    if (updateError) {
      console.error('[Notifications PATCH] Error:', updateError)
      return NextResponse.json(
        { error: updateError.message },
        { status: 500 }
      )
    }

    // 8. Response
    return NextResponse.json({
      data: updatedNotification,
      message: 'Notificação atualizada com sucesso',
    })
  } catch (error) {
    console.error('[Notifications PATCH] Unexpected error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

/**
 * DELETE /api/notifications/[id]
 * Cancela uma notificação pendente
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

    // 2. Get notification ID
    const { id: notificationId } = await context.params

    // 3. Supabase client (admin para bypass RLS)
    const supabase = createAdminClient()

    // 4. Buscar user no Supabase
    const { data: user } = await supabase
      .from('users')
      .select('id')
      .eq('clerk_id', userId)
      .single()

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // 5. Cancelar notification (soft delete)
    const { error } = await supabase
      .from('notifications')
      .update({ status: 'cancelled' })
      .eq('id', notificationId)
      .eq('user_id', user.id)

    if (error) {
      console.error('[Notifications DELETE] Error:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // 6. Response
    return NextResponse.json({
      message: 'Notificação cancelada com sucesso',
    })
  } catch (error) {
    console.error('[Notifications DELETE] Unexpected error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

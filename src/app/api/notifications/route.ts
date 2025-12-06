import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { createAdminClient } from '@/lib/supabase/server'

/**
 * GET /api/notifications
 * Lista notificações do usuário
 * Query params: unread_only (boolean), limit, offset
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

    // 3. Buscar user no Supabase
    const { data: user } = await supabase
      .from('users')
      .select('id')
      .eq('clerk_id', userId)
      .single()

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // 4. Parse query params
    const { searchParams } = new URL(request.url)
    const unreadOnly = searchParams.get('unread_only') === 'true'
    const limit = parseInt(searchParams.get('limit') || '50')
    const offset = parseInt(searchParams.get('offset') || '0')

    // 5. Build query
    let query = supabase
      .from('notifications')
      .select('*', { count: 'exact' })
      .eq('user_id', user.id)
      .neq('status', 'cancelled')
      .order('scheduled_for', { ascending: false })

    // Filtrar apenas não lidas
    if (unreadOnly) {
      query = query.is('read_at', null)
    }

    // Paginação
    query = query.range(offset, offset + limit - 1)

    // 6. Execute query
    const { data: notifications, error, count } = await query

    if (error) {
      console.error('[Notifications GET] Error:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // 7. Count unread notifications
    const { count: unreadCount } = await supabase
      .from('notifications')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .neq('status', 'cancelled')
      .is('read_at', null)

    // 8. Response
    return NextResponse.json({
      data: notifications,
      count,
      unread_count: unreadCount || 0,
      limit,
      offset,
    })
  } catch (error) {
    console.error('[Notifications GET] Unexpected error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

/**
 * PATCH /api/notifications
 * Marca múltiplas notificações como lidas
 * Body: { notification_ids: string[] }
 */
export async function PATCH(request: NextRequest) {
  try {
    // 1. Autenticação
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // 2. Supabase client (admin para bypass RLS)
    const supabase = createAdminClient()

    // 3. Buscar user no Supabase
    const { data: user } = await supabase
      .from('users')
      .select('id')
      .eq('clerk_id', userId)
      .single()

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // 4. Parse body
    const body = await request.json()
    const { notification_ids } = body

    if (!Array.isArray(notification_ids) || notification_ids.length === 0) {
      return NextResponse.json(
        { error: 'notification_ids must be a non-empty array' },
        { status: 400 }
      )
    }

    // 5. Update notifications
    const { error } = await supabase
      .from('notifications')
      .update({ read_at: new Date().toISOString() })
      .eq('user_id', user.id)
      .in('id', notification_ids)
      .is('read_at', null)

    if (error) {
      console.error('[Notifications PATCH] Error:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // 6. Response
    return NextResponse.json({
      message: 'Notificações marcadas como lidas',
      count: notification_ids.length,
    })
  } catch (error) {
    console.error('[Notifications PATCH] Unexpected error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

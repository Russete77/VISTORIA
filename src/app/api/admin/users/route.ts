import { NextRequest, NextResponse } from 'next/server'
import { checkAdminAccess, adminForbiddenResponse } from '@/lib/admin-guard'
import { createAdminClient } from '@/lib/supabase/server'

/**
 * Admin Users API - VistorIA Pro
 * GET: List all users with filters
 * PATCH: Update user (credits, tier, role)
 */

export async function GET(request: NextRequest) {
  const adminCheck = await checkAdminAccess()

  if (!adminCheck.isAdmin) {
    return adminForbiddenResponse()
  }

  try {
    const { searchParams } = new URL(request.url)
    const search = searchParams.get('search') || ''
    const tier = searchParams.get('tier') || ''
    const role = searchParams.get('role') || ''
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')
    const offset = (page - 1) * limit

    const supabase = createAdminClient()

    let query = supabase
      .from('users')
      .select('*', { count: 'exact' })
      .is('deleted_at', null)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)

    // Apply filters
    if (search) {
      query = query.or(`email.ilike.%${search}%,full_name.ilike.%${search}%`)
    }
    if (tier) {
      query = query.eq('tier', tier)
    }
    if (role) {
      query = query.eq('role', role)
    }

    const { data: users, count, error } = await query

    if (error) {
      console.error('Error fetching users:', error)
      return NextResponse.json({ error: 'Failed to fetch users' }, { status: 500 })
    }

    // Get inspection counts for each user
    const userIds = users?.map(u => u.id) || []
    const { data: inspectionCounts } = await supabase
      .from('inspections')
      .select('user_id')
      .in('user_id', userIds)

    const countsByUser: Record<string, number> = {}
    inspectionCounts?.forEach((i: any) => {
      countsByUser[i.user_id] = (countsByUser[i.user_id] || 0) + 1
    })

    const usersWithCounts = users?.map(user => ({
      ...user,
      inspection_count: countsByUser[user.id] || 0,
    }))

    return NextResponse.json({
      users: usersWithCounts,
      total: count || 0,
      page,
      limit,
      totalPages: Math.ceil((count || 0) / limit),
    })
  } catch (error) {
    console.error('Error in GET /api/admin/users:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest) {
  const adminCheck = await checkAdminAccess()

  if (!adminCheck.isAdmin) {
    return adminForbiddenResponse()
  }

  try {
    const body = await request.json()
    const { userId, credits, tier, role, blocked } = body

    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 })
    }

    // Only super_admin can change roles
    if (role !== undefined && !adminCheck.isSuperAdmin) {
      return NextResponse.json(
        { error: 'Only super admins can change user roles' },
        { status: 403 }
      )
    }

    const supabase = createAdminClient()

    const updateData: Record<string, any> = {}
    if (credits !== undefined) updateData.credits = credits
    if (tier !== undefined) updateData.tier = tier
    if (role !== undefined) updateData.role = role
    if (blocked !== undefined) updateData.deleted_at = blocked ? new Date().toISOString() : null

    const { data: user, error } = await supabase
      .from('users')
      .update(updateData)
      .eq('id', userId)
      .select()
      .single()

    if (error) {
      console.error('Error updating user:', error)
      return NextResponse.json({ error: 'Failed to update user' }, { status: 500 })
    }

    return NextResponse.json({ user, message: 'User updated successfully' })
  } catch (error) {
    console.error('Error in PATCH /api/admin/users:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

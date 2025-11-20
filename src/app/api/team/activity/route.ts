import { NextRequest, NextResponse } from 'next/server'
import { currentUser } from '@clerk/nextjs/server'
import { createAdminClient } from '@/lib/supabase/server'
import type { TeamActivityWithMember } from '@/types/database'

/**
 * GET /api/team/activity
 * Returns team activity log with pagination
 *
 * Query params:
 * - page: Page number (default: 1)
 * - limit: Items per page (default: 20, max: 100)
 * - member_id: Filter by team member ID
 * - action: Filter by action type
 * - entity_type: Filter by entity type (inspection, property, report, etc)
 */
export async function GET(request: NextRequest) {
  try {
    const clerkUser = await currentUser()
    if (!clerkUser) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const supabase = createAdminClient()

    // Get current user from database
    console.log('[Team Activity API] Fetching user with clerk_id:', clerkUser.id)
    const { data: dbUser, error: userError } = await supabase
      .from('users')
      .select('id, email')
      .eq('clerk_id', clerkUser.id)
      .single()

    if (userError || !dbUser) {
      console.error('[Team Activity API] User not found:', { clerk_id: clerkUser.id, error: userError })
      return NextResponse.json(
        { error: 'User not found', clerk_id: clerkUser.id },
        { status: 404 }
      )
    }

    console.log('[Team Activity API] User found:', { id: dbUser.id, email: dbUser.email })

    // Parse query parameters
    const { searchParams } = new URL(request.url)
    const page = Math.max(1, parseInt(searchParams.get('page') || '1'))
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') || '20')))
    const memberId = searchParams.get('member_id')
    const actionFilter = searchParams.get('action')
    const entityTypeFilter = searchParams.get('entity_type')

    // Calculate offset
    const offset = (page - 1) * limit

    // Build query for count
    let countQuery = supabase
      .from('team_activity_log')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', dbUser.id)

    if (memberId) {
      countQuery = countQuery.eq('team_member_id', memberId)
    }

    if (actionFilter) {
      countQuery = countQuery.eq('action', actionFilter)
    }

    if (entityTypeFilter) {
      countQuery = countQuery.eq('entity_type', entityTypeFilter)
    }

    const { count, error: countError } = await countQuery

    // If table doesn't exist yet, return empty activities
    if (countError && countError.message?.includes('table')) {
      console.warn('team_activity_log table not found, returning empty activities')
      return NextResponse.json({
        activities: [],
        pagination: {
          page: 1,
          limit,
          total: 0,
          totalPages: 0,
          hasNextPage: false,
          hasPrevPage: false,
        },
      })
    }

    if (countError) {
      console.error('Error counting activity log:', countError)
      return NextResponse.json(
        { error: 'Failed to count activity log' },
        { status: 500 }
      )
    }

    // Build query for data
    let query = supabase
      .from('team_activity_log')
      .select('*')
      .eq('user_id', dbUser.id)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)

    if (memberId) {
      query = query.eq('team_member_id', memberId)
    }

    if (actionFilter) {
      query = query.eq('action', actionFilter)
    }

    if (entityTypeFilter) {
      query = query.eq('entity_type', entityTypeFilter)
    }

    const { data: activities, error: activitiesError } = await query

    if (activitiesError) {
      console.error('Error fetching activity log:', activitiesError)
      return NextResponse.json(
        { error: 'Failed to fetch activity log' },
        { status: 500 }
      )
    }

    // Fetch team members for activities
    const memberIds = [...new Set(activities.map(a => a.team_member_id).filter(Boolean))]

    const { data: members } = await supabase
      .from('team_members')
      .select('id, email, name, role')
      .in('id', memberIds)

    // Map members to activities
    const membersMap = new Map(members?.map(m => [m.id, m]) || [])

    const activitiesWithMembers: TeamActivityWithMember[] = activities.map(activity => ({
      ...activity,
      team_member: activity.team_member_id ? membersMap.get(activity.team_member_id) || null : null,
    }))

    // Calculate pagination
    const totalPages = Math.ceil((count || 0) / limit)
    const hasNextPage = page < totalPages
    const hasPrevPage = page > 1

    return NextResponse.json({
      activities: activitiesWithMembers,
      pagination: {
        page,
        limit,
        total: count || 0,
        totalPages,
        hasNextPage,
        hasPrevPage,
      },
    })
  } catch (error) {
    console.error('Error in GET /api/team/activity:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

/**
 * POST /api/team/activity
 * Log a team activity (for internal use)
 *
 * Body:
 * - action: Action performed
 * - entity_type: Type of entity (optional)
 * - entity_id: ID of entity (optional)
 * - metadata: Additional data (optional)
 */
export async function POST(request: NextRequest) {
  try {
    const clerkUser = await currentUser()
    if (!clerkUser) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const supabase = createAdminClient()

    // Get current user from database
    const { data: dbUser, error: userError } = await supabase
      .from('users')
      .select('id, email')
      .eq('clerk_id', clerkUser.id)
      .single()

    if (userError || !dbUser) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    // Get user's team member record
    const { data: teamMember } = await supabase
      .from('team_members')
      .select('id')
      .eq('user_id', dbUser.id)
      .eq('email', dbUser.email)
      .is('deleted_at', null)
      .single()

    const body = await request.json()
    const { action, entity_type, entity_id, metadata } = body

    if (!action) {
      return NextResponse.json(
        { error: 'Action is required' },
        { status: 400 }
      )
    }

    const { data: activity, error: activityError } = await supabase
      .from('team_activity_log')
      .insert({
        user_id: dbUser.id,
        team_member_id: teamMember?.id || null,
        action,
        entity_type: entity_type || null,
        entity_id: entity_id || null,
        metadata: metadata || {},
      })
      .select()
      .single()

    if (activityError) {
      console.error('Error logging activity:', activityError)
      return NextResponse.json(
        { error: 'Failed to log activity' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      activity,
    })
  } catch (error) {
    console.error('Error in POST /api/team/activity:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

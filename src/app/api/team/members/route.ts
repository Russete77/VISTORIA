import { NextRequest, NextResponse } from 'next/server'
import { currentUser } from '@clerk/nextjs/server'
import { createAdminClient } from '@/lib/supabase/server'
import type { TeamMemberWithStats } from '@/types/database'

/**
 * Helper function to create mock team response when table doesn't exist
 */
async function mockTeamResponse(supabase: any, dbUser: any, mockMembers: any[]) {
  // Get inspection stats
  const { data: inspections } = await supabase
    .from('inspections')
    .select('id, completed_at, report_url')
    .eq('user_id', dbUser.id)
    .is('deleted_at', null)

  const inspectionsCount = inspections?.length || 0
  const reportsGenerated = inspections?.filter((i: any) => i.report_url).length || 0
  const lastInspectionDate = inspections?.length
    ? inspections
        .filter((i: any) => i.completed_at)
        .sort((a: any, b: any) => new Date(b.completed_at!).getTime() - new Date(a.completed_at!).getTime())[0]?.completed_at || null
    : null

  const membersWithStats = mockMembers.map(member => ({
    ...member,
    inspections_count: inspectionsCount,
    reports_generated: reportsGenerated,
    last_inspection_date: lastInspectionDate,
  }))

  const stats = {
    total: membersWithStats.length,
    active: membersWithStats.filter(m => m.status === 'active').length,
    pending: 0,
    totalInspections: inspectionsCount,
    totalReports: reportsGenerated,
  }

  const limits = {
    professional: 3,
    business: 10,
    enterprise: 999,
  }

  const userLimit = limits[dbUser.tier as keyof typeof limits] || 1

  return NextResponse.json({
    members: membersWithStats,
    stats,
    limits: {
      current: membersWithStats.length,
      max: userLimit,
      canAddMore: membersWithStats.length < userLimit,
    },
  })
}

/**
 * GET /api/team/members
 * Returns all team members for the current user with their stats
 *
 * Query params:
 * - role: Filter by role (owner, admin, member, viewer)
 * - status: Filter by status (active, pending, inactive)
 * - search: Search by name or email
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
    console.log('[Team API] Fetching user with clerk_id:', clerkUser.id)
    const { data: dbUser, error: userError } = await supabase
      .from('users')
      .select('id, tier, email')
      .eq('clerk_id', clerkUser.id)
      .single()

    if (userError || !dbUser) {
      console.error('[Team API] User not found:', { clerk_id: clerkUser.id, error: userError })
      return NextResponse.json(
        { error: 'User not found', clerk_id: clerkUser.id },
        { status: 404 }
      )
    }

    console.log('[Team API] User found:', { id: dbUser.id, tier: dbUser.tier, email: dbUser.email })

    // Parse query parameters
    const { searchParams } = new URL(request.url)
    const roleFilter = searchParams.get('role')
    const statusFilter = searchParams.get('status')
    const searchQuery = searchParams.get('search')

    // Build query - try to fetch from team_members table
    let query = supabase
      .from('team_members')
      .select('*')
      .eq('user_id', dbUser.id)
      .is('deleted_at', null)
      .order('created_at', { ascending: true })

    // Apply filters
    if (roleFilter) {
      query = query.eq('role', roleFilter)
    }

    if (statusFilter) {
      query = query.eq('status', statusFilter)
    }

    if (searchQuery) {
      query = query.or(`name.ilike.%${searchQuery}%,email.ilike.%${searchQuery}%`)
    }

    const { data: members, error: membersError } = await query

    // If table doesn't exist yet, return mock data for owner
    if (membersError && membersError.message?.includes('table')) {
      console.warn('team_members table not found, using mock data')

      // Get user details
      const { data: userData } = await supabase
        .from('users')
        .select('email, full_name')
        .eq('id', dbUser.id)
        .single()

      const mockMembers = [
        {
          id: dbUser.id,
          user_id: dbUser.id,
          email: userData?.email || clerkUser.emailAddresses[0]?.emailAddress || '',
          name: userData?.full_name || clerkUser.fullName || clerkUser.firstName || 'Owner',
          role: 'owner',
          status: 'active',
          invited_at: new Date().toISOString(),
          accepted_at: new Date().toISOString(),
          last_active_at: new Date().toISOString(),
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          deleted_at: null,
        },
      ]

      return await mockTeamResponse(supabase, dbUser, mockMembers)
    }

    // If no members exist, auto-create the owner record
    if (!membersError && (!members || members.length === 0)) {
      console.log('[Team API] No team members found, auto-creating owner record')

      // Get user details
      const { data: userData } = await supabase
        .from('users')
        .select('email, full_name')
        .eq('id', dbUser.id)
        .single()

      const ownerData = {
        user_id: dbUser.id,
        email: userData?.email || clerkUser.emailAddresses[0]?.emailAddress || '',
        name: userData?.full_name || clerkUser.fullName || clerkUser.firstName || 'Owner',
        role: 'owner' as const,
        status: 'active' as const,
        invited_at: new Date().toISOString(),
        accepted_at: new Date().toISOString(),
        last_active_at: new Date().toISOString(),
      }

      const { data: newOwner, error: createError } = await supabase
        .from('team_members')
        .insert(ownerData)
        .select()
        .single()

      if (createError) {
        console.error('[Team API] Failed to create owner record:', createError)
        // Return mock data as fallback
        return await mockTeamResponse(supabase, dbUser, [{
          ...ownerData,
          id: dbUser.id,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          deleted_at: null,
        }])
      }

      console.log('[Team API] Owner record created successfully:', newOwner.id)

      // Return with the newly created owner
      return await mockTeamResponse(supabase, dbUser, [newOwner])
    }

    if (membersError) {
      console.error('Error fetching team members:', membersError)
      return NextResponse.json(
        { error: 'Failed to fetch team members' },
        { status: 500 }
      )
    }

    // Get stats for each member
    const membersWithStats: TeamMemberWithStats[] = await Promise.all(
      members.map(async (member) => {
        // Get inspection stats
        const { data: inspections } = await supabase
          .from('inspections')
          .select('id, completed_at, report_url')
          .eq('user_id', dbUser.id)
          .is('deleted_at', null)

        const inspectionsCount = inspections?.length || 0
        const reportsGenerated = inspections?.filter(i => i.report_url).length || 0
        const lastInspectionDate = inspections?.length
          ? inspections
              .filter(i => i.completed_at)
              .sort((a, b) => new Date(b.completed_at!).getTime() - new Date(a.completed_at!).getTime())[0]?.completed_at || null
          : null

        return {
          ...member,
          inspections_count: inspectionsCount,
          reports_generated: reportsGenerated,
          last_inspection_date: lastInspectionDate,
        }
      })
    )

    // Calculate summary stats
    const stats = {
      total: membersWithStats.length,
      active: membersWithStats.filter(m => m.status === 'active').length,
      pending: membersWithStats.filter(m => m.status === 'pending').length,
      totalInspections: membersWithStats.reduce((sum, m) => sum + m.inspections_count, 0),
      totalReports: membersWithStats.reduce((sum, m) => sum + m.reports_generated, 0),
    }

    // Check user limits based on tier
    const limits = {
      professional: 3,
      business: 10,
      enterprise: 999,
    }

    const userLimit = limits[dbUser.tier as keyof typeof limits] || 1
    const canAddMore = membersWithStats.length < userLimit

    return NextResponse.json({
      members: membersWithStats,
      stats,
      limits: {
        current: membersWithStats.length,
        max: userLimit,
        canAddMore,
      },
    })
  } catch (error) {
    console.error('Error in GET /api/team/members:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

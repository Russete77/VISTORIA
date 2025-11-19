import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { createAdminClient } from '@/lib/supabase/server'

/**
 * Credit Usage API - VistorIA Pro
 * GET: List credit usage history for authenticated user
 */

export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const supabase = createAdminClient()

    // Get user from database
    const { data: user } = await supabase
      .from('users')
      .select('id')
      .eq('clerk_id', userId)
      .single()

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Get search params
    const searchParams = request.nextUrl.searchParams
    const limit = searchParams.get('limit')

    // Build query
    let query = supabase
      .from('credit_usage')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })

    if (limit) {
      query = query.limit(parseInt(limit))
    }

    const { data: creditUsage, error } = await query

    if (error) {
      console.error('Error fetching credit usage:', error)
      return NextResponse.json(
        { error: 'Failed to fetch credit usage' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      creditUsage: creditUsage || [],
      count: creditUsage?.length || 0,
    })
  } catch (error) {
    console.error('Error in GET /api/credit-usage:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

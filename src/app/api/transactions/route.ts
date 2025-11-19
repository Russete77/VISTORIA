import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { createAdminClient } from '@/lib/supabase/server'

/**
 * Transactions API - VistorIA Pro
 * GET: List all transactions for authenticated user
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
    const type = searchParams.get('type')
    const status = searchParams.get('status')
    const limit = searchParams.get('limit')

    // Build query
    let query = supabase
      .from('transactions')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })

    // Apply filters
    if (type && type !== 'all') {
      query = query.eq('type', type)
    }

    if (status && status !== 'all') {
      query = query.eq('status', status)
    }

    if (limit) {
      query = query.limit(parseInt(limit))
    }

    const { data: transactions, error } = await query

    if (error) {
      console.error('Error fetching transactions:', error)
      return NextResponse.json(
        { error: 'Failed to fetch transactions' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      transactions: transactions || [],
      count: transactions?.length || 0,
    })
  } catch (error) {
    console.error('Error in GET /api/transactions:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

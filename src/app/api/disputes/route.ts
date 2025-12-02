import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { createAdminClient } from '@/lib/supabase/server'
import { listDisputesQuerySchema } from '@/lib/validations/disputes'
import { z } from 'zod'

/**
 * Disputes List API - VistorIA Pro
 * GET: List all disputes for authenticated user (admin)
 */

// GET: List all disputes
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

    // Parse and validate query params
    const searchParams = request.nextUrl.searchParams
    const queryParams = {
      status: searchParams.get('status') || undefined,
      category: searchParams.get('category') || undefined,
      search: searchParams.get('search') || undefined,
      page: searchParams.get('page') || '1',
      limit: searchParams.get('limit') || '20',
    }

    const validatedParams = listDisputesQuerySchema.parse(queryParams)

    // Build query
    let query = supabase
      .from('disputes')
      .select(`
        *,
        inspection:inspections(
          id,
          type,
          status,
          property:properties(
            id,
            name,
            address,
            city,
            state
          )
        )
      `, { count: 'exact' })
      .eq('user_id', user.id)
      .is('deleted_at', null)

    // Apply filters
    if (validatedParams.status) {
      query = query.eq('status', validatedParams.status)
    }

    if (validatedParams.category) {
      query = query.eq('category', validatedParams.category)
    }

    if (validatedParams.search) {
      query = query.or(
        `protocol.ilike.%${validatedParams.search}%,` +
        `tenant_name.ilike.%${validatedParams.search}%,` +
        `tenant_email.ilike.%${validatedParams.search}%,` +
        `item_description.ilike.%${validatedParams.search}%`
      )
    }

    // Apply pagination
    const from = (validatedParams.page - 1) * validatedParams.limit
    const to = from + validatedParams.limit - 1

    query = query
      .order('created_at', { ascending: false })
      .range(from, to)

    const { data: disputes, error, count } = await query

    if (error) {
      console.error('Error fetching disputes:', error)
      return NextResponse.json(
        { error: 'Failed to fetch disputes' },
        { status: 500 }
      )
    }

    // Calculate pagination metadata
    const totalPages = count ? Math.ceil(count / validatedParams.limit) : 0

    return NextResponse.json({
      disputes,
      pagination: {
        page: validatedParams.page,
        limit: validatedParams.limit,
        total: count || 0,
        totalPages,
        hasMore: validatedParams.page < totalPages,
      },
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid query parameters', details: error.issues },
        { status: 400 }
      )
    }

    console.error('Error in GET /api/disputes:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

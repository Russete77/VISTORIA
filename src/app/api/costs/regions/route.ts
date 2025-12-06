/**
 * Regions API - VistorIA Pro
 * GET: List all available regions with cost multipliers
 */

import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { createAdminClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const state = searchParams.get('state')

    const supabase = createAdminClient()

    let query = supabase
      .from('regions')
      .select('*')
      .order('state')
      .order('name')

    if (state) {
      query = query.eq('state', state.toUpperCase())
    }

    const { data: regions, error } = await query

    if (error) {
      console.error('Error fetching regions:', error)
      return NextResponse.json({ error: 'Failed to fetch regions' }, { status: 500 })
    }

    // Group by state
    const byState = regions?.reduce((acc, region) => {
      const stateKey = region.state || 'Outros'
      if (!acc[stateKey]) {
        acc[stateKey] = []
      }
      acc[stateKey].push(region)
      return acc
    }, {} as Record<string, typeof regions>)

    return NextResponse.json({
      regions,
      byState,
      total: regions?.length || 0,
    })
  } catch (error) {
    console.error('Error in GET /api/costs/regions:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

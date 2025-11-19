import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { createAdminClient } from '@/lib/supabase/server'

/**
 * GET /api/user/credits
 * Get current user's credit balance
 */
export async function GET(request: NextRequest) {
  try {
    const authResult = await auth()
    if (!authResult.userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const supabase = createAdminClient()

    const { data: user, error } = await supabase
      .from('users')
      .select('credits')
      .eq('clerk_id', authResult.userId)
      .single()

    if (error || !user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    return NextResponse.json({
      credits: user.credits || 0,
    })
  } catch (error) {
    console.error('Get credits error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

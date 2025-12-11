import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { createAdminClient } from '@/lib/supabase/server'

/**
 * GET /api/user/credits
 * Get current user's credit balance and beta mode status
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

    // Check if we're in beta mode (< 3,000 total inspections across all users)
    const { count: totalInspections } = await supabase
      .from('inspections')
      .select('*', { count: 'exact', head: true })

    const isBetaPhase = (totalInspections || 0) < 3000

    return NextResponse.json({
      credits: user.credits || 0,
      isBetaPhase,
      displayCredits: isBetaPhase ? '∞ Ilimitado' : String(user.credits || 0),
    })
  } catch (error) {
    console.error('Get credits error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

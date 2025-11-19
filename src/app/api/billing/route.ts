import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { createAdminClient } from '@/lib/supabase/server'

/**
 * Billing API - VistorIA Pro
 * GET: Get user billing data (credits, tier, transactions, usage)
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
      .select('id, credits, tier, created_at')
      .eq('clerk_id', userId)
      .single()

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Get total inspections count
    const { data: inspections } = await supabase
      .from('inspections')
      .select('id, created_at')
      .eq('user_id', user.id)
      .is('deleted_at', null)

    const totalInspections = inspections?.length || 0

    // Calculate this month's inspections
    const now = new Date()
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
    const thisMonthInspections = inspections?.filter(i =>
      new Date(i.created_at) >= startOfMonth
    ).length || 0

    // Calculate average inspections per month
    const monthsSinceJoin = Math.max(1, Math.ceil(
      (now.getTime() - new Date(user.created_at).getTime()) / (1000 * 60 * 60 * 24 * 30)
    ))
    const avgPerMonth = totalInspections / monthsSinceJoin

    // Get transactions (credit purchases, subscriptions)
    const { data: transactions } = await supabase
      .from('credit_transactions')
      .select('*')
      .eq('user_id', user.id)
      .in('type', ['credit', 'subscription', 'purchase'])
      .order('created_at', { ascending: false })
      .limit(20)

    // Get credit usage history
    const { data: creditUsage } = await supabase
      .from('credit_transactions')
      .select(`
        *,
        inspection:inspections(id, property:properties(name))
      `)
      .eq('user_id', user.id)
      .eq('type', 'debit')
      .order('created_at', { ascending: false })
      .limit(20)

    return NextResponse.json({
      user: {
        tier: user.tier,
        credits: user.credits,
        total_inspections: totalInspections,
        this_month_inspections: thisMonthInspections,
        avg_per_month: parseFloat(avgPerMonth.toFixed(1)),
      },
      transactions: transactions || [],
      creditUsage: creditUsage || [],
    })
  } catch (error) {
    console.error('Error in GET /api/billing:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

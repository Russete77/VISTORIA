import { NextResponse } from 'next/server'
import { checkAdminAccess, adminForbiddenResponse } from '@/lib/admin-guard'
import { createAdminClient } from '@/lib/supabase/server'

/**
 * Admin Stats API - VistorIA Pro
 * GET: Fetch admin dashboard statistics
 */

export async function GET() {
  const adminCheck = await checkAdminAccess()

  if (!adminCheck.isAdmin) {
    return adminForbiddenResponse()
  }

  try {
    const supabase = createAdminClient()

    // Fetch all stats in parallel
    const [
      usersResult,
      inspectionsResult,
      todayInspectionsResult,
      trainingDataResult,
      recentUsersResult,
    ] = await Promise.all([
      // Total users
      supabase.from('users').select('id', { count: 'exact', head: true }),
      
      // Total inspections
      supabase.from('inspections').select('id', { count: 'exact', head: true }),
      
      // Today's inspections
      supabase
        .from('inspections')
        .select('id', { count: 'exact', head: true })
        .gte('created_at', new Date().toISOString().split('T')[0]),
      
      // AI Training data stats
      supabase.rpc('get_ai_training_stats'),
      
      // Recent users (last 7 days)
      supabase
        .from('users')
        .select('id', { count: 'exact', head: true })
        .gte('created_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()),
    ])

    // Get hourly usage for heatmap (last 7 days)
    const { data: hourlyData } = await supabase
      .from('inspections')
      .select('created_at')
      .gte('created_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString())
      .order('created_at', { ascending: true })

    // Process hourly data into heatmap format
    const heatmap: Record<string, Record<number, number>> = {}
    const days = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb']
    
    days.forEach(day => {
      heatmap[day] = {}
      for (let h = 0; h < 24; h++) {
        heatmap[day][h] = 0
      }
    })

    hourlyData?.forEach((inspection: any) => {
      const date = new Date(inspection.created_at)
      const day = days[date.getDay()]
      const hour = date.getHours()
      heatmap[day][hour] = (heatmap[day][hour] || 0) + 1
    })

    // Get user stats by tier
    const { data: tierStats } = await supabase
      .from('users')
      .select('tier')

    const tierCounts: Record<string, number> = {}
    tierStats?.forEach((user: any) => {
      const tier = user.tier || 'free'
      tierCounts[tier] = (tierCounts[tier] || 0) + 1
    })

    // Training stats
    const trainingStats = trainingDataResult.data?.[0] || {
      total_samples: 0,
      samples_with_corrections: 0,
      samples_confirmed_correct: 0,
      avg_feedback_rating: null,
    }

    return NextResponse.json({
      users: {
        total: usersResult.count || 0,
        newThisWeek: recentUsersResult.count || 0,
        byTier: tierCounts,
      },
      inspections: {
        total: inspectionsResult.count || 0,
        today: todayInspectionsResult.count || 0,
      },
      aiTraining: {
        totalSamples: trainingStats.total_samples || 0,
        withCorrections: trainingStats.samples_with_corrections || 0,
        confirmedCorrect: trainingStats.samples_confirmed_correct || 0,
        avgRating: trainingStats.avg_feedback_rating,
      },
      heatmap,
      generatedAt: new Date().toISOString(),
    })
  } catch (error) {
    console.error('Error fetching admin stats:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

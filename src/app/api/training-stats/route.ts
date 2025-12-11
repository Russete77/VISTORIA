import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'
import { quickRateLimit } from '@/lib/api-utils'

/**
 * Training Stats API - Public endpoint
 * GET: Returns global statistics for AI training data collection
 * 
 * This endpoint is PUBLIC (no auth required) to display progress on landing page
 */

export async function GET(request: NextRequest) {
  try {
    // Rate limiting (more permissive for public endpoint)
    const rateLimited = await quickRateLimit(request, 'standard')
    if (rateLimited) return rateLimited

    const supabase = createAdminClient()

    // Get total completed inspections (across all users)
    const { count: totalInspections, error: inspectionsError } = await supabase
      .from('inspections')
      .select('*', { count: 'exact', head: true })
      .in('status', ['completed', 'signed'])

    if (inspectionsError) {
      console.error('Error getting inspections count:', inspectionsError)
    }

    // Get total training photos collected
    const { count: totalTrainingPhotos, error: photosError } = await supabase
      .from('ai_training_data')
      .select('*', { count: 'exact', head: true })

    if (photosError) {
      console.error('Error getting training photos count:', photosError)
    }

    // Get inspections this week
    const weekAgo = new Date()
    weekAgo.setDate(weekAgo.getDate() - 7)
    
    const { count: inspectionsThisWeek, error: weekError } = await supabase
      .from('inspections')
      .select('*', { count: 'exact', head: true })
      .in('status', ['completed', 'signed'])
      .gte('completed_at', weekAgo.toISOString())

    if (weekError) {
      console.error('Error getting weekly inspections:', weekError)
    }

    // Calculate average inspections per day
    const avgInspectionsPerDay = inspectionsThisWeek 
      ? Math.round((inspectionsThisWeek / 7) * 10) / 10
      : 0

    // Calculate progress
    const target = 3000
    const current = totalInspections || 0
    const progressPercentage = Math.min(Math.round((current / target) * 100), 100)
    
    // Estimate days to milestone
    let daysToMilestone: number | null = null
    if (avgInspectionsPerDay > 0 && current < target) {
      const remaining = target - current
      daysToMilestone = Math.ceil(remaining / avgInspectionsPerDay)
    }

    return NextResponse.json({
      totalInspections: current,
      totalTrainingPhotos: totalTrainingPhotos || 0,
      inspectionsThisWeek: inspectionsThisWeek || 0,
      avgInspectionsPerDay,
      milestone: {
        target,
        current,
        remaining: Math.max(0, target - current),
        progressPercentage,
        daysToMilestone,
        isBetaPhase: current < target,
      },
    })
  } catch (error) {
    console.error('Error in GET /api/training-stats:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

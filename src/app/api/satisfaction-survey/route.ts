import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { createAdminClient } from '@/lib/supabase/server'
import { z } from 'zod'
import { quickRateLimit } from '@/lib/api-utils'

/**
 * App Satisfaction Survey API
 * POST: Submit satisfaction survey
 * GET: Get aggregated statistics (admin only)
 */

const satisfactionSurveySchema = z.object({
  npsScore: z.number().int().min(0).max(10),
  aiSatisfaction: z.number().int().min(1).max(5).optional(),
  uxSatisfaction: z.number().int().min(1).max(5).optional(),
  openFeedback: z.string().max(2000).optional(),
  usefulFeatures: z.array(z.enum([
    'ai_analysis',
    'comparisons',
    'pdfs',
    'disputes',
    'team',
    'costs',
    'mobile',
    'other'
  ])).optional(),
})

export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Rate limiting
    const rateLimited = await quickRateLimit(request, 'standard')
    if (rateLimited) return rateLimited

    // Parse and validate request body
    const rawBody = await request.json()
    const parseResult = satisfactionSurveySchema.safeParse(rawBody)

    if (!parseResult.success) {
      const errors = parseResult.error.issues.map((issue) => ({
        field: issue.path.join('.'),
        message: issue.message,
      }))
      return NextResponse.json(
        { error: 'Validation failed', details: errors },
        { status: 400 }
      )
    }

    const body = parseResult.data
    const supabase = createAdminClient()

    // Get user from database
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('id, total_vistorias, tier, created_at')
      .eq('clerk_id', userId)
      .single()

    if (userError || !user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Check if user can submit survey (not submitted in last 30 days)
    const { data: canSubmitData } = await supabase
      .rpc('can_submit_satisfaction_survey', { p_user_id: user.id })

    if (!canSubmitData) {
      return NextResponse.json(
        { error: 'You can only submit one survey per month' },
        { status: 429 }
      )
    }

    // Calculate days since signup
    const daysSinceSignup = Math.floor(
      (Date.now() - new Date(user.created_at).getTime()) / (1000 * 60 * 60 * 24)
    )

    // Insert survey
    const { data: survey, error: insertError } = await supabase
      .from('app_satisfaction_surveys')
      .insert({
        user_id: user.id,
        nps_score: body.npsScore,
        ai_satisfaction: body.aiSatisfaction || null,
        ux_satisfaction: body.uxSatisfaction || null,
        open_feedback: body.openFeedback || null,
        useful_features: body.usefulFeatures || [],
        completed_inspections: user.total_vistorias,
        user_tier: user.tier,
        days_since_signup: daysSinceSignup,
      })
      .select('id, created_at')
      .single()

    if (insertError) {
      console.error('Error inserting satisfaction survey:', insertError)
      return NextResponse.json(
        { error: 'Failed to save survey', details: insertError.message },
        { status: 500 }
      )
    }

    console.log('[Satisfaction Survey] New survey submitted:', {
      surveyId: survey.id,
      npsScore: body.npsScore,
      userId: user.id,
    })

    return NextResponse.json({
      success: true,
      surveyId: survey.id,
      message: 'Thank you for your feedback!',
    })
  } catch (error) {
    console.error('Error in POST /api/satisfaction-survey:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Rate limiting
    const rateLimited = await quickRateLimit(request, 'standard')
    if (rateLimited) return rateLimited

    const supabase = createAdminClient()

    // Check if user is admin (optional - can be removed for public stats)
    const { data: user } = await supabase
      .from('users')
      .select('id')
      .eq('clerk_id', userId)
      .single()

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Get period from query params (default 30 days)
    const searchParams = request.nextUrl.searchParams
    const periodRaw = searchParams.get('period') || '30'
    const period = Math.min(Math.max(parseInt(periodRaw) || 30, 1), 365)

    // Get satisfaction stats using helper function
    const { data: stats, error: statsError } = await supabase
      .rpc('get_satisfaction_stats', { period_days: period })

    if (statsError) {
      console.error('Error getting satisfaction stats:', statsError)
      return NextResponse.json(
        { error: 'Failed to get statistics' },
        { status: 500 }
      )
    }

    const statsData = stats?.[0] || {
      total_responses: 0,
      avg_nps: null,
      avg_ai_satisfaction: null,
      avg_ux_satisfaction: null,
      nps_promoters: 0,
      nps_passives: 0,
      nps_detractors: 0,
      nps_score: 0,
    }

    // Get feature frequency
    const { data: surveys, error: surveysError } = await supabase
      .from('app_satisfaction_surveys')
      .select('useful_features')
      .gte('created_at', new Date(Date.now() - period * 24 * 60 * 60 * 1000).toISOString())

    let featureFrequency: Record<string, number> = {}
    if (!surveysError && surveys) {
      surveys.forEach((s) => {
        (s.useful_features || []).forEach((feature: string) => {
          featureFrequency[feature] = (featureFrequency[feature] || 0) + 1
        })
      })
    }

    return NextResponse.json({
      period: {
        days: period,
        start: new Date(Date.now() - period * 24 * 60 * 60 * 1000).toISOString(),
        end: new Date().toISOString(),
      },
      summary: {
        totalResponses: Number(statsData.total_responses),
        avgNpsScore: statsData.avg_nps ? Number(statsData.avg_nps) : null,
        avgAiSatisfaction: statsData.avg_ai_satisfaction ? Number(statsData.avg_ai_satisfaction) : null,
        avgUxSatisfaction: statsData.avg_ux_satisfaction ? Number(statsData.avg_ux_satisfaction) : null,
      },
      nps: {
        score: statsData.nps_score ? Number(statsData.nps_score) : 0,
        promoters: Number(statsData.nps_promoters),
        passives: Number(statsData.nps_passives),
        detractors: Number(statsData.nps_detractors),
      },
      features: featureFrequency,
    })
  } catch (error) {
    console.error('Error in GET /api/satisfaction-survey:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

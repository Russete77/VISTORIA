import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { createAdminClient } from '@/lib/supabase/server'
import { z } from 'zod'
import { quickRateLimit } from '@/lib/api-utils'

/**
 * AI Feedback API - VistorIA Pro
 * POST: Submit feedback on AI analysis
 * GET: Get feedback statistics
 */

// Zod schemas for validation
const feedbackTypeSchema = z.enum([
  'problem_detection',
  'problem_description',
  'severity_rating',
  'recommendation',
  'cost_estimate',
  'room_detection',
  'general',
])

const issueCategorySchema = z.enum([
  'wrong_severity',
  'missed_problem',
  'false_positive',
  'wrong_description',
  'wrong_recommendation',
  'wrong_cost',
  'wrong_room',
  'other',
])

const feedbackRequestSchema = z.object({
  feedbackType: feedbackTypeSchema,
  rating: z.number().int().min(1).max(5),
  isAccurate: z.boolean().optional(),
  inspectionId: z.string().uuid().optional(),
  photoId: z.string().uuid().optional(),
  problemId: z.string().uuid().optional(),
  aiOriginalContent: z.record(z.string(), z.unknown()),
  userCorrection: z.record(z.string(), z.unknown()).optional(),
  userComment: z.string().max(1000).optional(),
  issueCategories: z.array(issueCategorySchema).optional(),
  modelVersion: z.string().optional(),
}).refine(
  (data) => data.inspectionId || data.photoId || data.problemId,
  { message: 'At least one of inspectionId, photoId, or problemId is required' }
)

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
    const parseResult = feedbackRequestSchema.safeParse(rawBody)

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
      .select('id')
      .eq('clerk_id', userId)
      .single()

    if (userError || !user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Insert feedback
    const { data: feedback, error: insertError } = await supabase
      .from('ai_feedback')
      .insert({
        user_id: user.id,
        feedback_type: body.feedbackType,
        rating: body.rating,
        is_accurate: body.isAccurate ?? null,
        inspection_id: body.inspectionId || null,
        photo_id: body.photoId || null,
        problem_id: body.problemId || null,
        ai_original_content: body.aiOriginalContent,
        user_correction: body.userCorrection || null,
        user_comment: body.userComment || null,
        issue_categories: body.issueCategories || [],
        model_version: body.modelVersion || 'claude-3-haiku',
      })
      .select('id, created_at')
      .single()

    if (insertError) {
      console.error('Error inserting feedback:', insertError)
      return NextResponse.json(
        { error: 'Failed to save feedback', details: insertError.message },
        { status: 500 }
      )
    }

    console.log('[AI Feedback] New feedback submitted:', {
      feedbackId: feedback.id,
      type: body.feedbackType,
      rating: body.rating,
      isAccurate: body.isAccurate,
    })

    // Update corresponding training data with user correction
    if (body.photoId) {
      try {
        const { error: trainingUpdateError } = await supabase
          .from('ai_training_data')
          .update({
            user_correction: body.userCorrection || null,
            feedback_rating: body.rating,
            feedback_comment: body.userComment || null,
            is_correct: body.isAccurate ?? null,
            corrected_at: new Date().toISOString(),
          })
          .eq('photo_id', body.photoId)
          .order('created_at', { ascending: false })
          .limit(1)

        if (trainingUpdateError) {
          console.warn('[AI Training] Failed to update training data:', trainingUpdateError)
          // Don't fail the request - feedback was saved successfully
        } else {
          console.log('[AI Training] Training data updated with user feedback')
        }
      } catch (trainingError) {
        console.warn('[AI Training] Error updating training data:', trainingError)
        // Continue - feedback submission was successful
      }
    }

    return NextResponse.json({
      success: true,
      feedbackId: feedback.id,
      message: 'Feedback submitted successfully. Thank you!',
    })
  } catch (error) {
    console.error('Error in POST /api/feedback:', error)
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

    // Get user from database
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('id, role')
      .eq('clerk_id', userId)
      .single()

    if (userError || !user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    const searchParams = request.nextUrl.searchParams
    const periodRaw = searchParams.get('period') || '30'
    const period = Math.min(Math.max(parseInt(periodRaw) || 30, 1), 365) // 1-365 days

    // Calculate date range
    const endDate = new Date()
    const startDate = new Date()
    startDate.setDate(startDate.getDate() - period)

    // Get user's own feedback stats (or all if admin)
    const isAdmin = user.role === 'admin'

    let query = supabase
      .from('ai_feedback')
      .select('*')
      .gte('created_at', startDate.toISOString())
      .lte('created_at', endDate.toISOString())

    if (!isAdmin) {
      query = query.eq('user_id', user.id)
    }

    const { data: feedbacks, error: feedbackError } = await query

    if (feedbackError) {
      console.error('Error fetching feedbacks:', feedbackError)
      return NextResponse.json(
        { error: 'Failed to fetch feedback stats' },
        { status: 500 }
      )
    }

    // Calculate stats
    const totalFeedbacks = feedbacks?.length || 0
    const avgRating = totalFeedbacks > 0
      ? feedbacks.reduce((sum, f) => sum + f.rating, 0) / totalFeedbacks
      : 0

    const accurateFeedbacks = feedbacks?.filter(f => f.is_accurate === true).length || 0
    const inaccurateFeedbacks = feedbacks?.filter(f => f.is_accurate === false).length || 0
    const totalAccuracyResponses = accurateFeedbacks + inaccurateFeedbacks
    const accuracyRate = totalAccuracyResponses > 0
      ? (accurateFeedbacks / totalAccuracyResponses) * 100
      : 0

    // Group by type
    const byType: Record<string, { count: number; avgRating: number; accuracy: number }> = {}
    feedbacks?.forEach(f => {
      if (!byType[f.feedback_type]) {
        byType[f.feedback_type] = { count: 0, avgRating: 0, accuracy: 0 }
      }
      byType[f.feedback_type].count++
    })

    // Calculate avg rating per type
    Object.keys(byType).forEach(type => {
      const typeFeedbacks = feedbacks?.filter(f => f.feedback_type === type) || []
      byType[type].avgRating = typeFeedbacks.reduce((sum, f) => sum + f.rating, 0) / typeFeedbacks.length

      const typeAccurate = typeFeedbacks.filter(f => f.is_accurate === true).length
      const typeTotal = typeFeedbacks.filter(f => f.is_accurate !== null).length
      byType[type].accuracy = typeTotal > 0 ? (typeAccurate / typeTotal) * 100 : 0
    })

    // Count issue categories
    const issueCounts: Record<string, number> = {}
    feedbacks?.forEach(f => {
      (f.issue_categories || []).forEach((cat: string) => {
        issueCounts[cat] = (issueCounts[cat] || 0) + 1
      })
    })

    const topIssues = Object.entries(issueCounts)
      .map(([category, count]) => ({
        category,
        count,
        percentage: totalFeedbacks > 0 ? (count / totalFeedbacks) * 100 : 0,
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10)

    return NextResponse.json({
      period: {
        start: startDate.toISOString(),
        end: endDate.toISOString(),
        days: period,
      },
      summary: {
        totalFeedbacks,
        averageRating: Math.round(avgRating * 100) / 100,
        accuracyRate: Math.round(accuracyRate * 100) / 100,
      },
      byType,
      topIssues,
      isAdmin,
    })
  } catch (error) {
    console.error('Error in GET /api/feedback:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

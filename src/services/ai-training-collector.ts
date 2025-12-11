/**
 * AI Training Data Collector Service
 * Saves Claude analysis results to ai_training_data table for future model training
 */

import { createAdminClient } from '@/lib/supabase/server'
import type { PhotoAnalysisResult } from './ai-analysis'

export interface SaveTrainingDataParams {
  photoId: string | null
  photoUrl: string
  claudeAnalysis: PhotoAnalysisResult
  roomName?: string
  roomCategory?: string
  fromVideo?: boolean
  frameNumber?: number
  transcription?: string
}

/**
 * Save AI analysis result to training_data table
 * This data will be used to train custom models (BERT, YOLO) after reaching 3,000 inspections
 */
export async function saveTrainingData(
  params: SaveTrainingDataParams
): Promise<string | null> {
  try {
    const supabase = createAdminClient()

    const { data, error } = await supabase
      .from('ai_training_data')
      .insert({
        photo_id: params.photoId,
        photo_url: params.photoUrl,
        claude_analysis: params.claudeAnalysis as unknown as Record<string, unknown>,
        claude_model: 'claude-sonnet-4-20250514',
        room_name: params.roomName || null,
        room_category: params.roomCategory || null,
        from_video: params.fromVideo || false,
        yolo_detections: [], // Will be populated later when YOLO is implemented
        created_at: new Date().toISOString(),
      })
      .select('id')
      .single()

    if (error) {
      console.error('[AI Training] Failed to save training data:', error)
      return null
    }

    console.log('[AI Training] Saved training data:', {
      id: data.id,
      photoId: params.photoId,
      fromVideo: params.fromVideo,
      hasProblems: params.claudeAnalysis.hasProblems,
    })

    return data.id
  } catch (error) {
    console.error('[AI Training] Exception saving training data:', error)
    return null
  }
}

/**
 * Update training data with user corrections
 * Called when user provides feedback on AI analysis
 */
export async function updateTrainingDataWithFeedback(
  photoId: string,
  feedback: {
    isCorrect: boolean
    rating: number
    userCorrection?: Record<string, unknown>
    userComment?: string
  }
): Promise<boolean> {
  try {
    const supabase = createAdminClient()

    // Find the most recent training data for this photo
    const { error } = await supabase
      .from('ai_training_data')
      .update({
        is_correct: feedback.isCorrect,
        feedback_rating: feedback.rating,
        user_correction: feedback.userCorrection || null,
        feedback_comment: feedback.userComment || null,
        corrected_at: new Date().toISOString(),
      })
      .eq('photo_id', photoId)
      .order('created_at', { ascending: false })
      .limit(1)

    if (error) {
      console.error('[AI Training] Failed to update training data with feedback:', error)
      return false
    }

    console.log('[AI Training] Updated training data with user feedback:', {
      photoId,
      isCorrect: feedback.isCorrect,
      rating: feedback.rating,
    })

    return true
  } catch (error) {
    console.error('[AI Training] Exception updating training data:', error)
    return false
  }
}

/**
 * Get training data statistics
 * Used for progress tracking toward 3,000 inspections milestone
 */
export async function getTrainingStats(): Promise<{
  totalSamples: number
  samplesWithCorrections: number
  samplesConfirmedCorrect: number
  avgFeedbackRating: number | null
}> {
  try {
    const supabase = createAdminClient()

    const { data, error } = await supabase.rpc('get_ai_training_stats')

    if (error) {
      console.error('[AI Training] Failed to get training stats:', error)
      return {
        totalSamples: 0,
        samplesWithCorrections: 0,
        samplesConfirmedCorrect: 0,
        avgFeedbackRating: null,
      }
    }

    return {
      totalSamples: Number(data[0]?.total_samples || 0),
      samplesWithCorrections: Number(data[0]?.samples_with_corrections || 0),
      samplesConfirmedCorrect: Number(data[0]?.samples_confirmed_correct || 0),
      avgFeedbackRating: data[0]?.avg_feedback_rating 
        ? Number(data[0].avg_feedback_rating) 
        : null,
    }
  } catch (error) {
    console.error('[AI Training] Exception getting training stats:', error)
    return {
      totalSamples: 0,
      samplesWithCorrections: 0,
      samplesConfirmedCorrect: 0,
      avgFeedbackRating: null,
    }
  }
}

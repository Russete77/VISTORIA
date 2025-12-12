import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { createAdminClient } from '@/lib/supabase/server'
import { uploadInspectionPhoto } from '@/services/storage'
import { analyzePhoto } from '@/services/ai-analysis'
import { estimateProblemCosts } from '@/services/cost-estimation'
import { quickRateLimit } from '@/lib/api-utils'
import { saveTrainingData } from '@/services/ai-training-collector'

/**
 * Inspection Photos API - VistorIA Pro
 * POST: Upload and analyze photo for inspection
 */

interface RouteParams {
  params: Promise<{ id: string }>
}

export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Rate limiting (AI analysis + upload)
    const rateLimited = await quickRateLimit(request, 'ai')
    if (rateLimited) return rateLimited

    const { id: inspectionId } = await params
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

    // Verify inspection ownership
    const { data: inspection } = await supabase
      .from('inspections')
      .select('id, status')
      .eq('id', inspectionId)
      .eq('user_id', user.id)
      .is('deleted_at', null)
      .single()

    if (!inspection) {
      return NextResponse.json(
        { error: 'Inspection not found' },
        { status: 404 }
      )
    }

    // Parse form data
    const formData = await request.formData()
    const file = formData.get('photo') as File
    const roomId = formData.get('room_id') as string
    const roomNameRaw = formData.get('room_name') as string
    const roomName = (roomNameRaw || 'Sem nome').trim() // Trim whitespace to prevent matching issues

    // Get room category/type - handle 'undefined' string from frontend
    const roomCategoryRaw = formData.get('room_category') || formData.get('room_type')
    let roomCategory = 'other'
    if (roomCategoryRaw && String(roomCategoryRaw) !== 'undefined' && String(roomCategoryRaw) !== 'null') {
      roomCategory = String(roomCategoryRaw)
    }

    const description = formData.get('description') as string | null

    if (!file || !roomId) {
      return NextResponse.json(
        { error: 'Photo and room_id are required' },
        { status: 400 }
      )
    }

    console.log('Photo upload - room_name:', roomName, 'room_category:', roomCategory, 'formData keys:', Array.from(formData.keys()))

    // Upload photo to Supabase Storage
    const { url: photoUrl, path: photoPath } = await uploadInspectionPhoto(
      file,
      inspectionId,
      roomName || 'photo'
    )

    // Analyze photo with AI (Claude 4)
    let aiAnalysis = null
    try {
      aiAnalysis = await analyzePhoto(photoUrl, roomName, roomCategory)
    } catch (error) {
      console.error('AI analysis failed:', error)
      // Continue without AI analysis if it fails
    }

    // Save photo to database
    const { data: photo, error: dbError } = await supabase
      .from('inspection_photos')
      .insert({
        inspection_id: inspectionId,
        user_id: user.id,
        room_name: roomName,
        room_category: roomCategory,
        storage_path: photoPath,
        file_size: file.size,
        ai_analyzed: !!aiAnalysis,
        ai_analysis_at: aiAnalysis ? new Date().toISOString() : null,
        ai_has_problems: aiAnalysis?.hasProblems || false,
        ai_summary: aiAnalysis?.summary || null,
        ai_confidence: aiAnalysis?.confidence || null,
        user_notes: description || null,
        display_order: 0, // Will be updated based on existing photos
      })
      .select()
      .single()

    if (dbError) {
      console.error('Error saving photo:', dbError)
      return NextResponse.json(
        { error: 'Failed to save photo' },
        { status: 500 }
      )
    }

    // Save training data for AI model improvement (passive collection)
    if (aiAnalysis) {
      try {
        await saveTrainingData({
          photoId: photo.id,
          photoUrl,
          claudeAnalysis: aiAnalysis,
          roomName,
          roomCategory,
          fromVideo: false,
        })
        console.log('[AI Training] Training data saved for photo:', photo.id)
      } catch (trainingError) {
        console.warn('[AI Training] Failed to save training data:', trainingError)
        // Don't fail the request - photo was saved successfully
      }
    }

    // If AI detected problems, save them to photo_problems table
    if (aiAnalysis?.hasProblems && aiAnalysis.problems && aiAnalysis.problems.length > 0) {
      const problems = aiAnalysis.problems.map((problem: any) => ({
        photo_id: photo.id,
        inspection_id: inspectionId,
        description: problem.description,
        severity: problem.severity,
        location: problem.location || null,
        suggested_action: problem.suggestedAction || null,
        ai_confidence: problem.confidence,
      }))

      const { error: problemsError } = await supabase.from('photo_problems').insert(problems)
      if (problemsError) {
        console.error('Error saving problems:', problemsError)
      }
    }

    // Fetch the complete photo with problems for consistent response
    const { data: completePhoto } = await supabase
      .from('inspection_photos')
      .select(`
        *,
        problems:photo_problems(*)
      `)
      .eq('id', photo.id)
      .single()

    return NextResponse.json(
      {
        photo: {
          ...(completePhoto || photo),
          photo_url: photoUrl, // Include public URL for frontend
        },
        aiAnalysis,
        message: 'Photo uploaded and analyzed successfully',
      },
      { status: 201 }
    )
  } catch (error) {
    console.error('Error in POST /api/inspections/[id]/photos:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id: inspectionId } = await params
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

    // Verify inspection ownership
    const { data: inspection } = await supabase
      .from('inspections')
      .select('id')
      .eq('id', inspectionId)
      .eq('user_id', user.id)
      .is('deleted_at', null)
      .single()

    if (!inspection) {
      return NextResponse.json(
        { error: 'Inspection not found' },
        { status: 404 }
      )
    }

    // Get all photos for this inspection with problems
    const { data: photos, error } = await supabase
      .from('inspection_photos')
      .select(`
        *,
        problems:photo_problems(*)
      `)
      .eq('inspection_id', inspectionId)
      .order('created_at', { ascending: true })

    if (error) {
      console.error('Error fetching photos:', error)
      return NextResponse.json(
        { error: 'Failed to fetch photos' },
        { status: 500 }
      )
    }

    // Generate public URLs for all photos
    const photosWithUrls = photos?.map((photo: any) => {
      const { data: urlData } = supabase.storage
        .from('inspection-photos')
        .getPublicUrl(photo.storage_path)

      return {
        ...photo,
        photo_url: urlData.publicUrl,
      }
    }) || []

    // Get region code from user settings or use default
    const { data: userSettings } = await supabase
      .from('user_settings')
      .select('default_region')
      .eq('user_id', user.id)
      .single()

    const regionCode = userSettings?.default_region || 'sp_capital'

    // Estimate costs for all problems
    const allProblems = photosWithUrls.flatMap((photo: any) =>
      (photo.problems || []).map((problem: any) => ({
        ...problem,
        photoId: photo.id,
      }))
    )

    let problemsWithCosts: any[] = []
    if (allProblems.length > 0) {
      const problemsForEstimation = allProblems.map((p: any) => ({
        description: p.description,
        severity: p.severity,
        location: p.location || undefined,
        suggestedAction: p.suggested_action || undefined,
      }))

      const estimatedProblems = await estimateProblemCosts(problemsForEstimation, regionCode)

      // Map back to original problems with costs
      problemsWithCosts = allProblems.map((problem: any, index: number) => ({
        ...problem,
        estimatedCost: estimatedProblems[index]?.estimatedCost || null,
      }))
    }

    // Add estimated costs back to photos
    const photosWithCosts = photosWithUrls.map((photo: any) => ({
      ...photo,
      problems: (photo.problems || []).map((problem: any) => {
        const problemWithCost = problemsWithCosts.find(
          (p: any) => p.id === problem.id
        )
        return problemWithCost || problem
      }),
    }))

    // Calculate cost summary
    const costSummary = {
      totalMin: 0,
      totalMax: 0,
      totalAvg: 0,
      problemsWithCosts: 0,
      problemsWithoutCosts: 0,
    }

    for (const problem of problemsWithCosts) {
      if (problem.estimatedCost) {
        costSummary.totalMin += problem.estimatedCost.min
        costSummary.totalMax += problem.estimatedCost.max
        costSummary.totalAvg += problem.estimatedCost.avg
        costSummary.problemsWithCosts++
      } else {
        costSummary.problemsWithoutCosts++
      }
    }

    return NextResponse.json({
      photos: photosWithCosts,
      count: photosWithCosts.length,
      costSummary: allProblems.length > 0 ? {
        ...costSummary,
        totalAvg: Math.round(costSummary.totalAvg * 100) / 100,
        region: regionCode,
      } : null,
    })
  } catch (error) {
    console.error('Error in GET /api/inspections/[id]/photos:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id: inspectionId } = await params
    const body = await request.json()
    const { photoId, user_notes, ai_summary, problems } = body

    if (!photoId) {
      return NextResponse.json({ error: 'Photo ID is required' }, { status: 400 })
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

    // Verify photo ownership
    const { data: photo } = await supabase
      .from('inspection_photos')
      .select('*, inspection:inspections(user_id)')
      .eq('id', photoId)
      .single()

    if (!photo) {
      return NextResponse.json({ error: 'Photo not found' }, { status: 404 })
    }

    if (photo.inspection.user_id !== user.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    // Build update object with provided fields
    const updateData: Record<string, any> = {}
    if (user_notes !== undefined) updateData.user_notes = user_notes
    if (ai_summary !== undefined) {
      updateData.ai_summary = ai_summary
      updateData.ai_edited = true
      updateData.ai_edited_at = new Date().toISOString()
    }

    // Update photo if there's data to update
    let updatedPhoto = photo
    if (Object.keys(updateData).length > 0) {
      const { data, error: updateError } = await supabase
        .from('inspection_photos')
        .update(updateData)
        .eq('id', photoId)
        .select()
        .single()

      if (updateError) {
        console.error('Error updating photo:', updateError)
        return NextResponse.json({ error: 'Failed to update photo' }, { status: 500 })
      }
      updatedPhoto = data
    }

    // Update problems if provided
    if (problems !== undefined) {
      // Delete existing problems
      await supabase
        .from('photo_problems')
        .delete()
        .eq('photo_id', photoId)

      // Insert new problems
      if (problems && problems.length > 0) {
        const problemsToInsert = problems.map((problem: any) => ({
          photo_id: photoId,
          inspection_id: inspectionId,
          description: problem.description,
          severity: problem.severity || 'medium',
          location: problem.location || null,
          suggested_action: problem.suggested_action || problem.suggestedAction || null,
          ai_confidence: problem.ai_confidence || problem.confidence || null,
        }))

        const { error: problemsError } = await supabase
          .from('photo_problems')
          .insert(problemsToInsert)

        if (problemsError) {
          console.error('Error updating problems:', problemsError)
          return NextResponse.json({ error: 'Failed to update problems' }, { status: 500 })
        }
      }

      // Update ai_has_problems flag
      await supabase
        .from('inspection_photos')
        .update({ ai_has_problems: problems.length > 0 })
        .eq('id', photoId)
    }

    // **SAVE TO AI TRAINING DATA** for model improvement
    // This is critical for training our AI models
    if (ai_summary !== undefined || problems !== undefined) {
      try {
        // Get the original AI analysis from training data
        const { data: existingTrainingData } = await supabase
          .from('ai_training_data')
          .select('*')
          .eq('photo_id', photoId)
          .order('created_at', { ascending: false })
          .limit(1)
          .single()

        if (existingTrainingData) {
          // Update existing training data with user correction
          const userCorrection = {
            ai_summary: ai_summary || photo.ai_summary,
            problems: problems || [],
            edited_at: new Date().toISOString(),
          }

          await supabase
            .from('ai_training_data')
            .update({
              user_correction: userCorrection,
              is_correct: false, // User edited = AI was not 100% correct
              corrected_at: new Date().toISOString(),
            })
            .eq('id', existingTrainingData.id)

          console.log('[AI Training] Saved user correction for training:', {
            photoId,
            trainingDataId: existingTrainingData.id,
            hasNewSummary: ai_summary !== undefined,
            problemsCount: problems?.length || 0,
          })
        } else {
          // No existing training data - create new entry with correction
          const photoUrl = photo.storage_path 
            ? supabase.storage.from('inspection-photos').getPublicUrl(photo.storage_path).data.publicUrl 
            : ''

          await supabase
            .from('ai_training_data')
            .insert({
              photo_id: photoId,
              photo_url: photoUrl,
              claude_analysis: {
                hasProblems: photo.ai_has_problems,
                summary: photo.ai_summary,
                confidence: photo.ai_confidence,
              },
              claude_model: 'claude-sonnet-4-20250514',
              user_correction: {
                ai_summary: ai_summary || photo.ai_summary,
                problems: problems || [],
                edited_at: new Date().toISOString(),
              },
              is_correct: false,
              room_name: photo.room_name,
              room_category: photo.room_category,
              corrected_at: new Date().toISOString(),
            })

          console.log('[AI Training] Created new training data with user correction:', {
            photoId,
          })
        }
      } catch (trainingError) {
        console.warn('[AI Training] Failed to save correction (non-blocking):', trainingError)
        // Don't fail the request - photo was saved successfully
      }
    }

    // Fetch updated photo with problems
    const { data: completePhoto } = await supabase
      .from('inspection_photos')
      .select(`
        *,
        problems:photo_problems(*)
      `)
      .eq('id', photoId)
      .single()

    return NextResponse.json({
      photo: completePhoto || updatedPhoto,
      message: 'Photo updated successfully',
    })
  } catch (error) {
    console.error('Error in PATCH /api/inspections/[id]/photos:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id: inspectionId } = await params
    const { searchParams } = new URL(request.url)
    const photoId = searchParams.get('photoId')

    if (!photoId) {
      return NextResponse.json({ error: 'Photo ID is required' }, { status: 400 })
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

    // Get photo to verify ownership and get storage path
    const { data: photo, error: photoError } = await supabase
      .from('inspection_photos')
      .select('*, inspection:inspections(user_id)')
      .eq('id', photoId)
      .single()

    if (photoError || !photo) {
      return NextResponse.json({ error: 'Photo not found' }, { status: 404 })
    }

    // Verify ownership
    if (photo.inspection.user_id !== user.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    // Delete photo from storage
    const { error: storageError } = await supabase.storage
      .from('inspection-photos')
      .remove([photo.storage_path])

    if (storageError) {
      console.error('Error deleting photo from storage:', storageError)
    }

    // Delete problems associated with this photo
    await supabase.from('photo_problems').delete().eq('photo_id', photoId)

    // Delete photo record from database
    const { error: deleteError } = await supabase
      .from('inspection_photos')
      .delete()
      .eq('id', photoId)

    if (deleteError) {
      console.error('Error deleting photo:', deleteError)
      return NextResponse.json(
        { error: 'Failed to delete photo' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'Photo deleted successfully',
    })
  } catch (error) {
    console.error('Error in DELETE /api/inspections/[id]/photos:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

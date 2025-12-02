import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { createAdminClient } from '@/lib/supabase/server'
import { uploadInspectionPhoto } from '@/services/storage'
import { analyzePhoto } from '@/services/ai-analysis'

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

    return NextResponse.json({
      photos: photosWithUrls,
      count: photosWithUrls.length,
    })
  } catch (error) {
    console.error('Error in GET /api/inspections/[id]/photos:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
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

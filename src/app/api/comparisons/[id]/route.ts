import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { createAdminClient } from '@/lib/supabase/server'

/**
 * Comparison Detail API - VistorIA Pro
 * GET: Get specific comparison with all details
 * DELETE: Delete comparison (soft delete)
 */

// GET: Get specific comparison
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params
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

    // Get comparison with all details
    const { data: comparison, error } = await supabase
      .from('comparisons')
      .select(`
        *,
        property:properties(*),
        move_in_inspection:inspections!comparisons_move_in_inspection_id_fkey(*),
        move_out_inspection:inspections!comparisons_move_out_inspection_id_fkey(*)
      `)
      .eq('id', id)
      .eq('user_id', user.id)
      .single()

    if (error || !comparison) {
      return NextResponse.json(
        { error: 'Comparison not found' },
        { status: 404 }
      )
    }

    // Get all differences with photo details
    const { data: differences } = await supabase
      .from('comparison_differences')
      .select(`
        *,
        before_photo:inspection_photos!comparison_differences_before_photo_id_fkey(*),
        after_photo:inspection_photos!comparison_differences_after_photo_id_fkey(*)
      `)
      .eq('comparison_id', id)
      .order('created_at', { ascending: true })

    // Add public URLs to photos
    const differencesWithUrls = differences?.map((diff) => {
      let beforePhotoUrl = null
      let afterPhotoUrl = null

      if (diff.before_photo && 'storage_path' in diff.before_photo) {
        beforePhotoUrl = supabase.storage
          .from('inspection-photos')
          .getPublicUrl(diff.before_photo.storage_path).data.publicUrl
      }

      if (diff.after_photo && 'storage_path' in diff.after_photo) {
        afterPhotoUrl = supabase.storage
          .from('inspection-photos')
          .getPublicUrl(diff.after_photo.storage_path).data.publicUrl
      }

      return {
        ...diff,
        before_photo_url: beforePhotoUrl,
        after_photo_url: afterPhotoUrl,
      }
    })

    return NextResponse.json({
      comparison: {
        ...comparison,
        differences: differencesWithUrls || [],
      },
    })
  } catch (error) {
    console.error('Error in GET /api/comparisons/[id]:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// DELETE: Delete comparison
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params
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

    // Verificar que a comparação pertence ao usuário
    const { data: comparison } = await supabase
      .from('comparisons')
      .select('id, user_id')
      .eq('id', id)
      .eq('user_id', user.id)
      .single()

    if (!comparison) {
      return NextResponse.json(
        { error: 'Comparison not found' },
        { status: 404 }
      )
    }

    // Deletar comparação (hard delete para simplificar)
    // Em produção, considere soft delete se necessário
    const { error: deleteError } = await supabase
      .from('comparisons')
      .delete()
      .eq('id', id)

    if (deleteError) {
      console.error('Error deleting comparison:', deleteError)
      return NextResponse.json(
        { error: 'Failed to delete comparison' },
        { status: 500 }
      )
    }

    // As diferenças serão deletadas automaticamente via CASCADE

    return NextResponse.json({
      message: 'Comparison deleted successfully',
    })
  } catch (error) {
    console.error('Error in DELETE /api/comparisons/[id]:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

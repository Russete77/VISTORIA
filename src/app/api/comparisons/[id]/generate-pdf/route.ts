import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { createAdminClient } from '@/lib/supabase/server'
import { generateComparisonPDF } from '@/services/pdf-comparison-generator'
import type { ComparisonWithDetails } from '@/types/database'

/**
 * Generate PDF API for Comparisons - VistorIA Pro
 * POST: Generate PDF report for a comparison
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

    const { id: comparisonId } = await params
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
    const { data: comparison, error: comparisonError } = await supabase
      .from('comparisons')
      .select(`
        *,
        property:properties(*),
        move_in_inspection:inspections!comparisons_move_in_inspection_id_fkey(*),
        move_out_inspection:inspections!comparisons_move_out_inspection_id_fkey(*)
      `)
      .eq('id', comparisonId)
      .eq('user_id', user.id)
      .single()

    if (comparisonError || !comparison) {
      console.error('[Generate PDF] Comparison not found:', comparisonError)
      return NextResponse.json(
        { error: 'Comparison not found' },
        { status: 404 }
      )
    }

    if (comparison.status !== 'completed') {
      return NextResponse.json(
        { error: 'Comparison is not completed yet' },
        { status: 400 }
      )
    }

    // Get differences
    const { data: differences } = await supabase
      .from('comparison_differences')
      .select('*')
      .eq('comparison_id', comparisonId)
      .order('room_name')

    // Get photos from both inspections
    const { data: moveInPhotos } = await supabase
      .from('inspection_photos')
      .select('id, room_name, photo_url')
      .eq('inspection_id', comparison.move_in_inspection_id)
      .is('deleted_at', null)

    const { data: moveOutPhotos } = await supabase
      .from('inspection_photos')
      .select('id, room_name, photo_url')
      .eq('inspection_id', comparison.move_out_inspection_id)
      .is('deleted_at', null)

    // Create photo maps by room name
    const beforePhotosMap = new Map<string, string>()
    const afterPhotosMap = new Map<string, string>()

    moveInPhotos?.forEach((photo) => {
      if (!beforePhotosMap.has(photo.room_name)) {
        beforePhotosMap.set(photo.room_name, photo.photo_url)
      }
    })

    moveOutPhotos?.forEach((photo) => {
      if (!afterPhotosMap.has(photo.room_name)) {
        afterPhotosMap.set(photo.room_name, photo.photo_url)
      }
    })

    console.log('[Generate PDF] Generating PDF for comparison:', comparisonId)
    console.log('[Generate PDF] Differences count:', differences?.length || 0)
    console.log('[Generate PDF] Before photos:', beforePhotosMap.size)
    console.log('[Generate PDF] After photos:', afterPhotosMap.size)

    // Generate PDF
    const pdfBuffer = await generateComparisonPDF({
      comparison: comparison as ComparisonWithDetails,
      differences: differences || [],
      beforePhotosMap,
      afterPhotosMap,
    })

    console.log('[Generate PDF] PDF generated successfully, size:', pdfBuffer.length)

    // Return PDF as downloadable file
    return new NextResponse(pdfBuffer as unknown as BodyInit, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="comparacao-${comparisonId.slice(0, 8)}.pdf"`,
      },
    })
  } catch (error) {
    console.error('Error in POST /api/comparisons/[id]/generate-pdf:', error)
    return NextResponse.json(
      {
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

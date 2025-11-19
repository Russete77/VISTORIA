import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { createAdminClient } from '@/lib/supabase/server'
import { generateSatelitPDF } from '@/services/pdf-generator-satelit'

/**
 * Generate PDF API - VistorIA Pro
 * POST: Generate PDF for inspection
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
      .select('id, full_name, email')
      .eq('clerk_id', userId)
      .single()

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Get inspection with property and photos
    const { data: inspection, error } = await supabase
      .from('inspections')
      .select(`
        *,
        property:properties(
          id,
          name,
          address,
          city,
          state,
          type,
          bedrooms,
          bathrooms,
          area
        )
      `)
      .eq('id', inspectionId)
      .eq('user_id', user.id)
      .is('deleted_at', null)
      .single()

    if (error || !inspection) {
      return NextResponse.json(
        { error: 'Inspection not found' },
        { status: 404 }
      )
    }

    // Get all photos for this inspection
    const { data: photos } = await supabase
      .from('inspection_photos')
      .select('id, room_name, room_category, photo_url, ai_analysis, created_at')
      .eq('inspection_id', inspectionId)
      .is('deleted_at', null)
      .order('created_at', { ascending: true })

    // Group photos by room
    const roomsMap = new Map()
    photos?.forEach((photo) => {
      const key = photo.room_name
      if (!roomsMap.has(key)) {
        roomsMap.set(key, {
          id: `room-${photo.room_name.toLowerCase().replace(/\s+/g, '-')}`,
          name: photo.room_name,
          type: photo.room_category || 'other',
          photos: [],
        })
      }
      roomsMap.get(key).photos.push({
        id: photo.id,
        photo_url: photo.photo_url,
        ai_analysis: photo.ai_analysis,
      })
    })

    const rooms = Array.from(roomsMap.values())

    // Generate PDF using Satélit format
    const pdfBuffer = await generateSatelitPDF({
      inspection: {
        id: inspection.id,
        type: inspection.type,
        status: inspection.status,
        scheduled_date: inspection.scheduled_date,
        created_at: inspection.created_at,
        inspector_name: inspection.inspector_name,
        tenant_name: inspection.tenant_name,
        landlord_name: inspection.landlord_name,
        property: inspection.property,
      },
      rooms,
    })

    // Return PDF as downloadable file
    return new NextResponse(pdfBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="laudo-${inspectionId}.pdf"`,
      },
    })
  } catch (error) {
    console.error('Error in POST /api/inspections/[id]/generate-pdf:', error)
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}

import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { createAdminClient } from '@/lib/supabase/server'
import { z } from 'zod'

/**
 * Inspection Rooms API - VistorIA Pro
 * GET: List all rooms for an inspection
 * POST: Create new room for inspection
 */

const roomSchema = z.object({
  name: z.string().min(2),
  type: z.string().optional(),
  category: z.string().optional(),
  order_index: z.number().int().min(0).optional().default(0),
})

interface RouteParams {
  params: Promise<{ id: string }>
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

    // Get unique rooms from photos
    const { data: photos, error } = await supabase
      .from('inspection_photos')
      .select('room_name, room_category')
      .eq('inspection_id', inspectionId)

    if (error) {
      console.error('Error fetching rooms:', error)
      return NextResponse.json(
        { error: 'Failed to fetch rooms' },
        { status: 500 }
      )
    }

    // Group by room_name to get unique rooms with photo count
    const roomsMap = new Map()
    photos?.forEach((photo, index) => {
      const key = photo.room_name
      if (!roomsMap.has(key)) {
        roomsMap.set(key, {
          id: `room-${photo.room_name.toLowerCase().replace(/\s+/g, '-')}`,
          name: photo.room_name,
          type: photo.room_category || 'other',
          order_index: roomsMap.size,
          photos: [{ count: 0 }]
        })
      }
      roomsMap.get(key).photos[0].count++
    })

    const rooms = Array.from(roomsMap.values()).sort((a, b) => a.order_index - b.order_index)

    return NextResponse.json({
      rooms,
      count: rooms.length,
    })
  } catch (error) {
    console.error('Error in GET /api/inspections/[id]/rooms:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
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

    // Parse and validate request body
    const body = await request.json()
    console.log('Received body:', body)

    const validatedData = roomSchema.parse(body)
    console.log('Validated data:', validatedData)

    // Note: Rooms are not stored separately in the database
    // They are derived from room_name in inspection_photos
    // Return the room data as-is for frontend compatibility
    const room = {
      id: `room-${Date.now()}`,
      inspection_id: inspectionId,
      ...validatedData,
      created_at: new Date().toISOString(),
    }

    return NextResponse.json(
      { room, message: 'Room registered successfully (will be created with first photo)' },
      { status: 201 }
    )
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.errors },
        { status: 400 }
      )
    }

    console.error('Error in POST /api/inspections/[id]/rooms:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

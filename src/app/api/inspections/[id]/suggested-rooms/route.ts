import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { createAdminClient } from '@/lib/supabase/server'

/**
 * Suggested Rooms API - VistorIA Pro
 * GET: Get suggested room names from previous move-in inspection
 *
 * This endpoint helps maintain consistency by suggesting room names
 * from the corresponding move-in inspection when creating a move-out inspection.
 *
 * Query params:
 * - autoCreate=true: Automatically create rooms from move-in inspection
 */

interface SuggestedRoom {
  name: string
  category: string
  photo_count: number
}

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
    const searchParams = request.nextUrl.searchParams
    const autoCreate = searchParams.get('autoCreate') === 'true'

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

    // Verify current inspection ownership and get its details
    const { data: currentInspection, error: currentError } = await supabase
      .from('inspections')
      .select('id, type, property_id')
      .eq('id', inspectionId)
      .eq('user_id', user.id)
      .is('deleted_at', null)
      .single()

    if (currentError || !currentInspection) {
      return NextResponse.json(
        { error: 'Inspection not found' },
        { status: 404 }
      )
    }

    // Only provide suggestions for move-out inspections
    if (currentInspection.type !== 'move_out') {
      return NextResponse.json({
        suggestions: [],
        message: 'Suggestions are only available for move-out inspections',
      })
    }

    // Find the corresponding move-in inspection for the same property
    const { data: moveInInspection, error: moveInError } = await supabase
      .from('inspections')
      .select('id')
      .eq('property_id', currentInspection.property_id)
      .eq('user_id', user.id)
      .eq('type', 'move_in')
      .is('deleted_at', null)
      .order('created_at', { ascending: false })
      .limit(1)
      .single()

    // If no move-in inspection found, return empty suggestions
    if (moveInError || !moveInInspection) {
      return NextResponse.json({
        suggestions: [],
        message: 'No move-in inspection found for this property',
      })
    }

    // Get all photos from the move-in inspection grouped by room
    const { data: photos, error: photosError } = await supabase
      .from('inspection_photos')
      .select('room_name, room_category')
      .eq('inspection_id', moveInInspection.id)

    if (photosError) {
      console.error('Error fetching photos for suggestions:', photosError)
      return NextResponse.json(
        { error: 'Failed to fetch room suggestions' },
        { status: 500 }
      )
    }

    // If no photos found in move-in inspection
    if (!photos || photos.length === 0) {
      return NextResponse.json({
        suggestions: [],
        message: 'Move-in inspection has no rooms with photos',
      })
    }

    // Group photos by room name and count them
    const roomsMap = new Map<string, SuggestedRoom>()

    photos.forEach((photo) => {
      const trimmedName = photo.room_name.trim()

      if (!roomsMap.has(trimmedName)) {
        roomsMap.set(trimmedName, {
          name: trimmedName,
          category: photo.room_category || 'other',
          photo_count: 0,
        })
      }

      const room = roomsMap.get(trimmedName)!
      room.photo_count++
    })

    // Convert to array and sort by photo count (most photos first)
    const suggestions: SuggestedRoom[] = Array.from(roomsMap.values())
      .sort((a, b) => b.photo_count - a.photo_count)

    // Auto-create rooms if requested
    if (autoCreate && suggestions.length > 0) {
      // First, check if current inspection already has rooms
      const { data: existingRooms } = await supabase
        .from('inspection_rooms')
        .select('id')
        .eq('inspection_id', inspectionId)
        .limit(1)

      // Only auto-create if no rooms exist
      if (!existingRooms || existingRooms.length === 0) {
        const roomsToCreate = suggestions.map((suggestion, index) => ({
          inspection_id: inspectionId,
          name: suggestion.name,
          type: suggestion.category,
          order_index: index,
        }))

        const { data: createdRooms, error: createError } = await supabase
          .from('inspection_rooms')
          .insert(roomsToCreate)
          .select('id, name, type, order_index')

        if (createError) {
          console.error('Error auto-creating rooms:', createError)
          // Don't fail - just return suggestions without auto-creation
        } else {
          console.log(`[AutoCreate] Created ${createdRooms?.length} rooms from move-in inspection`)

          return NextResponse.json({
            suggestions,
            move_in_inspection_id: moveInInspection.id,
            total_rooms: suggestions.length,
            total_photos: photos.length,
            autoCreated: true,
            createdRooms: createdRooms,
          })
        }
      }
    }

    return NextResponse.json({
      suggestions,
      move_in_inspection_id: moveInInspection.id,
      total_rooms: suggestions.length,
      total_photos: photos.length,
      autoCreated: false,
    })
  } catch (error) {
    console.error('Error in GET /api/inspections/[id]/suggested-rooms:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

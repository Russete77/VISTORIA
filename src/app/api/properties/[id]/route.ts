import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { createAdminClient } from '@/lib/supabase/server'
import { z } from 'zod'

/**
 * Property Detail API - VistorIA Pro
 * GET: Get single property
 * PATCH: Update property
 * DELETE: Delete property (soft delete)
 */

const propertyUpdateSchema = z.object({
  name: z.string().min(3).optional(),
  address: z.string().min(5).optional(),
  city: z.string().optional().nullable(),
  state: z.string().optional().nullable(),
  zip_code: z.string().optional().nullable(),
  type: z.enum(['apartment', 'house', 'commercial', 'land', 'other']).optional(),
  bedrooms: z.number().int().min(0).optional().nullable(),
  bathrooms: z.number().int().min(0).optional().nullable(),
  area: z.number().min(0).optional().nullable(),
  floor: z.number().int().optional().nullable(),
  parking_spaces: z.number().int().min(0).optional().nullable(),
  has_elevator: z.boolean().optional().nullable(),
  is_furnished: z.boolean().optional().nullable(),
  notes: z.string().optional().nullable(),
  coordinates: z.object({
    lat: z.number(),
    lng: z.number(),
  }).optional().nullable(),
  thumbnail_url: z.string().url().optional().nullable(),
  status: z.enum(['active', 'inactive', 'pending']).optional(),
})

interface RouteParams {
  params: Promise<{ id: string }>
}

// GET: Get single property
export async function GET(request: NextRequest, { params }: RouteParams) {
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

    // Get property
    const { data: property, error } = await supabase
      .from('properties')
      .select('*')
      .eq('id', id)
      .eq('user_id', user.id)
      .is('deleted_at', null)
      .single()

    if (error || !property) {
      return NextResponse.json(
        { error: 'Property not found' },
        { status: 404 }
      )
    }

    // Get inspection counts
    const { data: inspections } = await supabase
      .from('inspections')
      .select('type, status')
      .eq('property_id', id)
      .is('deleted_at', null)

    const moveInCount = inspections?.filter(i => i.type === 'move_in').length || 0
    const moveOutCount = inspections?.filter(i => i.type === 'move_out').length || 0
    const periodicCount = inspections?.filter(i => i.type === 'periodic').length || 0
    const totalInspections = inspections?.length || 0

    return NextResponse.json({
      property: {
        ...property,
        move_in_count: moveInCount,
        move_out_count: moveOutCount,
        periodic_count: periodicCount,
        total_inspections: totalInspections,
      }
    })
  } catch (error) {
    console.error('Error in GET /api/properties/[id]:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// PATCH: Update property
export async function PATCH(request: NextRequest, { params }: RouteParams) {
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

    // Verify ownership
    const { data: existingProperty } = await supabase
      .from('properties')
      .select('id')
      .eq('id', id)
      .eq('user_id', user.id)
      .is('deleted_at', null)
      .single()

    if (!existingProperty) {
      return NextResponse.json(
        { error: 'Property not found' },
        { status: 404 }
      )
    }

    // Parse and validate request body
    const body = await request.json()
    const validatedData = propertyUpdateSchema.parse(body)

    // Update property
    const { data: property, error } = await supabase
      .from('properties')
      .update({
        ...validatedData,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single()

    if (error) {
      console.error('Error updating property:', error)
      return NextResponse.json(
        { error: 'Failed to update property' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      property,
      message: 'Property updated successfully',
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.errors },
        { status: 400 }
      )
    }

    console.error('Error in PATCH /api/properties/[id]:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// DELETE: Delete property (soft delete)
export async function DELETE(request: NextRequest, { params }: RouteParams) {
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

    // Verify ownership
    const { data: existingProperty } = await supabase
      .from('properties')
      .select('id')
      .eq('id', id)
      .eq('user_id', user.id)
      .is('deleted_at', null)
      .single()

    if (!existingProperty) {
      return NextResponse.json(
        { error: 'Property not found' },
        { status: 404 }
      )
    }

    // Soft delete
    const { error } = await supabase
      .from('properties')
      .update({
        deleted_at: new Date().toISOString(),
      })
      .eq('id', id)

    if (error) {
      console.error('Error deleting property:', error)
      return NextResponse.json(
        { error: 'Failed to delete property' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      message: 'Property deleted successfully',
    })
  } catch (error) {
    console.error('Error in DELETE /api/properties/[id]:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

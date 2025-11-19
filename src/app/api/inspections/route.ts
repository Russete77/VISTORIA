import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { createAdminClient } from '@/lib/supabase/server'
import { z } from 'zod'

/**
 * Inspections API - VistorIA Pro
 * GET: List all inspections for authenticated user
 * POST: Create new inspection
 */

const inspectionSchema = z.object({
  property_id: z.string().uuid(),
  type: z.enum(['move_in', 'move_out', 'periodic']),
  inspector_name: z.string().min(2),
  tenant_name: z.string().optional(),
  landlord_name: z.string().optional(),
  scheduled_date: z.string().datetime(),
  notes: z.string().optional(),
})

// GET: List all inspections
export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
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

    // Get search params
    const searchParams = request.nextUrl.searchParams
    const propertyId = searchParams.get('property_id')
    const status = searchParams.get('status')
    const type = searchParams.get('type')

    // Build query
    let query = supabase
      .from('inspections')
      .select(`
        *,
        property:properties(id, name, address)
      `)
      .eq('user_id', user.id)
      .is('deleted_at', null)
      .order('created_at', { ascending: false })

    // Apply filters
    if (propertyId) {
      query = query.eq('property_id', propertyId)
    }

    if (status && status !== 'all') {
      query = query.eq('status', status)
    }

    if (type && type !== 'all') {
      query = query.eq('type', type)
    }

    const { data: inspections, error } = await query

    if (error) {
      console.error('Error fetching inspections:', error)
      return NextResponse.json(
        { error: 'Failed to fetch inspections' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      inspections: inspections || [],
      count: inspections?.length || 0,
    })
  } catch (error) {
    console.error('Error in GET /api/inspections:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// POST: Create new inspection
export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const supabase = createAdminClient()

    // Get user from database
    const { data: user } = await supabase
      .from('users')
      .select('id, credits')
      .eq('clerk_id', userId)
      .single()

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Check if user has credits
    if (user.credits < 1) {
      return NextResponse.json(
        { error: 'Insufficient credits. Please purchase more credits.' },
        { status: 402 }
      )
    }

    // Parse and validate request body
    const body = await request.json()
    const validatedData = inspectionSchema.parse(body)

    // Verify property belongs to user
    const { data: property } = await supabase
      .from('properties')
      .select('id')
      .eq('id', validatedData.property_id)
      .eq('user_id', user.id)
      .is('deleted_at', null)
      .single()

    if (!property) {
      return NextResponse.json(
        { error: 'Property not found' },
        { status: 404 }
      )
    }

    // Create inspection
    const { data: inspection, error } = await supabase
      .from('inspections')
      .insert({
        user_id: user.id,
        ...validatedData,
        status: 'draft',
      })
      .select()
      .single()

    if (error) {
      console.error('Error creating inspection:', error)
      return NextResponse.json(
        { error: 'Failed to create inspection' },
        { status: 500 }
      )
    }

    return NextResponse.json(
      { inspection, message: 'Inspection created successfully' },
      { status: 201 }
    )
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.errors },
        { status: 400 }
      )
    }

    console.error('Error in POST /api/inspections:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

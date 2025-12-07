import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { createAdminClient, getOrCreateUser } from '@/lib/supabase/server'
import { z } from 'zod'
import { canUseCredits } from '@/lib/auth/dev-access'

/**
 * Inspections API - VistorIA Pro
 * GET: List all inspections for authenticated user
 * POST: Create new inspection
 */

const inspectionSchema = z.object({
  property_id: z.string().uuid(),
  type: z.enum(['move_in', 'move_out', 'periodic']),
  inspector_name: z.string().min(2),
  inspector_email: z.string().email().optional().nullable(),
  tenant_name: z.string().optional().nullable(),
  tenant_email: z.string().email().optional().nullable(),
  landlord_name: z.string().optional().nullable(),
  landlord_email: z.string().email().optional().nullable(),
  scheduled_date: z.string().datetime(),
  notes: z.string().optional().nullable(),
})

// GET: List all inspections
export async function GET(request: NextRequest) {
  try {
    console.log('[Inspections GET] START')
    const { userId } = await auth()
    console.log('[Inspections GET] Clerk userId:', userId)
    
    if (!userId) {
      console.warn('[Inspections GET] No userId from auth()')
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    console.log('[Inspections GET] Creating Supabase admin client...')
    const supabase = createAdminClient()

    // Get or create user (fallback if webhook hasn't synced)
    let userData
    try {
      console.log('[Inspections GET] Calling getOrCreateUser with userId:', userId)
      const result = await getOrCreateUser(userId, supabase)
      userData = result.data
      console.log('[Inspections GET] ✓ getOrCreateUser returned:', userData?.id)
    } catch (err: any) {
      console.error('[Inspections GET] ✗ Failed to get or create user:', {
        message: err?.message,
        stack: err?.stack,
        userId
      })
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Get search params
    const searchParams = request.nextUrl.searchParams
    const propertyId = searchParams.get('propertyId') || searchParams.get('property_id') // Aceita ambos
    const status = searchParams.get('status')
    const type = searchParams.get('type')

    // Build query - include photos count
    let query = supabase
      .from('inspections')
      .select(`
        *,
        property:properties(id, name, address),
        photos:inspection_photos(count)
      `)
      .eq('user_id', userData.id)
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

    // Map photos count to photos_count field
    const inspectionsWithCount = inspections?.map((inspection: any) => ({
      ...inspection,
      photos_count: Array.isArray(inspection.photos) ? inspection.photos.length : 0,
      photos: undefined, // Remove photos array to avoid confusion
    })) || []

    return NextResponse.json({
      inspections: inspectionsWithCount,
      count: inspectionsWithCount.length,
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

    // Get or create user (fallback if webhook hasn't synced)
    let userData
    try {
      const result = await getOrCreateUser(userId, supabase)
      userData = result.data
    } catch (err: any) {
      console.error('[Inspections POST] Failed to get or create user:', err?.message)
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Get full user data including credits
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('id, credits, email')
      .eq('id', userData.id)
      .single()

    if (!user || userError) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Check if user has credits (developers bypass this check)
    if (!canUseCredits(user.credits, user.email)) {
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
        { error: 'Validation error', details: error.issues },
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

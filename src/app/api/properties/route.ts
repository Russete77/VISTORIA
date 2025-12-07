import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { createAdminClient, getOrCreateUser } from '@/lib/supabase/server'
import { z } from 'zod'

/**
 * Properties API - VistorIA Pro
 * GET: List all properties for authenticated user
 * POST: Create new property
 */

// Validation schema
const propertySchema = z.object({
  name: z.string().min(3, 'Nome deve ter no mínimo 3 caracteres'),
  address: z.string().min(5, 'Endereço deve ter no mínimo 5 caracteres'),
  city: z.string().optional(),
  state: z.string().optional(),
  zip_code: z.string().optional(),
  property_type: z.enum(['apartment', 'house', 'commercial', 'land']).optional(),
  bedrooms: z.number().int().min(0).optional(),
  bathrooms: z.number().int().min(0).optional(),
  area_sqm: z.number().min(0).optional(),
  year_built: z.number().int().optional(),
  notes: z.string().optional(),
  latitude: z.number().optional(),
  longitude: z.number().optional(),
})

// GET: List all properties
export async function GET(request: NextRequest) {
  try {
    console.log('[Properties GET] START')
    const { userId } = await auth()
    console.log('[Properties GET] Clerk userId:', userId)
    
    if (!userId) {
      console.warn('[Properties GET] No userId from auth()')
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    console.log('[Properties GET] Creating Supabase admin client...')
    const supabase = createAdminClient()

    // Get or create user from database (fallback if webhook hasn't synced yet)
    let userData
    try {
      console.log('[Properties GET] Calling getOrCreateUser with userId:', userId)
      const result = await getOrCreateUser(userId, supabase)
      userData = result.data
      console.log('[Properties GET] ✓ getOrCreateUser returned:', userData?.id)
    } catch (err: any) {
      console.error('[Properties GET] ✗ Failed to get or create user:', {
        message: err?.message,
        stack: err?.stack,
        userId
      })
      return NextResponse.json({ error: 'Failed to get user', details: err?.message }, { status: 500 })
    }

    // Get search params
    const searchParams = request.nextUrl.searchParams
    const status = searchParams.get('status')
    const type = searchParams.get('type')
    const search = searchParams.get('search')

    // Build query
    let query = supabase
      .from('properties')
      .select('*')
      .eq('user_id', userData.id)
      .is('deleted_at', null)
      .order('created_at', { ascending: false })

    // Apply filters
    if (status && status !== 'all') {
      query = query.eq('status', status)
    }

    if (type && type !== 'all') {
      query = query.eq('type', type)
    }

    if (search) {
      query = query.or(`name.ilike.%${search}%,address.ilike.%${search}%`)
    }

    const { data: properties, error } = await query

    if (error) {
      console.error('Error fetching properties:', error)
      return NextResponse.json(
        { error: 'Failed to fetch properties' },
        { status: 500 }
      )
    }

    // For each property, get inspection counts
    const propertiesWithCounts = await Promise.all(
      (properties || []).map(async (property) => {
        // Count inspections by type
        const { data: inspections } = await supabase
          .from('inspections')
          .select('type, status')
          .eq('property_id', property.id)
          .is('deleted_at', null)

        const moveInCount = inspections?.filter(i => i.type === 'move_in').length || 0
        const moveOutCount = inspections?.filter(i => i.type === 'move_out').length || 0
        const totalInspections = inspections?.length || 0

        return {
          ...property,
          move_in_count: moveInCount,
          move_out_count: moveOutCount,
          total_inspections: totalInspections,
        }
      })
    )

    return NextResponse.json({
      properties: propertiesWithCounts,
      count: propertiesWithCounts.length,
    })
  } catch (error) {
    console.error('Error in GET /api/properties:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// POST: Create new property
export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const supabase = createAdminClient()

    // Get or create user from database (fallback if webhook hasn't synced yet)
    let userData
    try {
      const result = await getOrCreateUser(userId, supabase)
      userData = result.data
    } catch (err: any) {
      console.error('[Properties POST] Failed to get or create user:', err?.message)
      return NextResponse.json({ error: 'Failed to get user', details: err?.message }, { status: 500 })
    }

    // Parse and validate request body
    const body = await request.json()
    const validatedData = propertySchema.parse(body)

    // Create property
    const { data: property, error } = await supabase
      .from('properties')
      .insert({
        user_id: userData.id,
        ...validatedData,
        status: 'active', // Default status (must be 'active', 'inactive', or 'archived')
      })
      .select()
      .single()

    if (error) {
      console.error('Error creating property:', error)
      return NextResponse.json(
        { error: 'Failed to create property' },
        { status: 500 }
      )
    }

    return NextResponse.json(
      { property, message: 'Property created successfully' },
      { status: 201 }
    )
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.issues },
        { status: 400 }
      )
    }

    console.error('Error in POST /api/properties:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

/**
 * Custom Service Prices API - VistorIA Pro
 * GET: List all services with user's custom prices
 * PATCH: Update user's custom price for a service
 */

import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { createAdminClient } from '@/lib/supabase/server'
import { z } from 'zod'

const updatePriceSchema = z.object({
  service_id: z.string().uuid(),
  custom_price_min: z.number().positive(),
  custom_price_max: z.number().positive(),
  notes: z.string().max(500).optional().nullable(),
})

export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const categoryCode = searchParams.get('category')
    const search = searchParams.get('search')

    const supabase = createAdminClient()

    // Get user
    const { data: user } = await supabase
      .from('users')
      .select('id')
      .eq('clerk_id', userId)
      .single()

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Get categories
    const { data: categories } = await supabase
      .from('service_categories')
      .select('*')
      .eq('is_active', true)
      .order('display_order')

    // Build services query
    let servicesQuery = supabase
      .from('repair_services')
      .select(`
        *,
        category:service_categories(id, code, name, icon)
      `)
      .eq('is_active', true)
      .order('display_order')

    if (categoryCode) {
      const category = categories?.find(c => c.code === categoryCode)
      if (category) {
        servicesQuery = servicesQuery.eq('category_id', category.id)
      }
    }

    if (search) {
      servicesQuery = servicesQuery.or(`name.ilike.%${search}%,description.ilike.%${search}%`)
    }

    const { data: services, error } = await servicesQuery

    if (error) {
      console.error('Error fetching services:', error)
      return NextResponse.json({ error: 'Failed to fetch services' }, { status: 500 })
    }

    // Get user's custom prices
    const { data: customPrices } = await supabase
      .from('user_custom_prices')
      .select('*')
      .eq('user_id', user.id)

    // Map custom prices to services
    const customPricesMap = new Map(
      customPrices?.map(cp => [cp.service_id, cp]) || []
    )

    // Merge services with custom prices
    const servicesWithCustomPrices = services?.map(service => {
      const customPrice = customPricesMap.get(service.id)
      return {
        ...service,
        custom_price: customPrice ? {
          min: customPrice.custom_price_min,
          max: customPrice.custom_price_max,
          notes: customPrice.notes,
          updated_at: customPrice.updated_at,
        } : null,
        effective_price: {
          min: customPrice?.custom_price_min ?? service.base_price_min,
          max: customPrice?.custom_price_max ?? service.base_price_max,
          is_custom: !!customPrice,
        },
      }
    })

    return NextResponse.json({
      categories,
      services: servicesWithCustomPrices,
      total: servicesWithCustomPrices?.length || 0,
    })
  } catch (error) {
    console.error('Error in GET /api/costs/services:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const data = updatePriceSchema.parse(body)

    // Validate min <= max
    if (data.custom_price_min > data.custom_price_max) {
      return NextResponse.json(
        { error: 'Preço mínimo não pode ser maior que o máximo' },
        { status: 400 }
      )
    }

    const supabase = createAdminClient()

    // Get user
    const { data: user } = await supabase
      .from('users')
      .select('id')
      .eq('clerk_id', userId)
      .single()

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Verify service exists
    const { data: service } = await supabase
      .from('repair_services')
      .select('id, name')
      .eq('id', data.service_id)
      .single()

    if (!service) {
      return NextResponse.json({ error: 'Service not found' }, { status: 404 })
    }

    // Upsert custom price
    const { data: customPrice, error } = await supabase
      .from('user_custom_prices')
      .upsert({
        user_id: user.id,
        service_id: data.service_id,
        custom_price_min: data.custom_price_min,
        custom_price_max: data.custom_price_max,
        notes: data.notes || null,
        updated_at: new Date().toISOString(),
      }, {
        onConflict: 'user_id,service_id',
      })
      .select()
      .single()

    if (error) {
      console.error('Error saving custom price:', error)
      return NextResponse.json({ error: 'Failed to save custom price' }, { status: 500 })
    }

    return NextResponse.json({
      message: 'Preço personalizado salvo com sucesso',
      custom_price: customPrice,
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request data', details: error.issues },
        { status: 400 }
      )
    }

    console.error('Error in PATCH /api/costs/services:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const serviceId = searchParams.get('service_id')

    if (!serviceId) {
      return NextResponse.json({ error: 'service_id is required' }, { status: 400 })
    }

    const supabase = createAdminClient()

    // Get user
    const { data: user } = await supabase
      .from('users')
      .select('id')
      .eq('clerk_id', userId)
      .single()

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Delete custom price (revert to default)
    const { error } = await supabase
      .from('user_custom_prices')
      .delete()
      .eq('user_id', user.id)
      .eq('service_id', serviceId)

    if (error) {
      console.error('Error deleting custom price:', error)
      return NextResponse.json({ error: 'Failed to delete custom price' }, { status: 500 })
    }

    return NextResponse.json({
      message: 'Preço revertido para o padrão',
    })
  } catch (error) {
    console.error('Error in DELETE /api/costs/services:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

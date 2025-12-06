/**
 * Costs API - VistorIA Pro
 * GET: List services and categories with prices
 */

import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { createAdminClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const categoryCode = searchParams.get('category')
    const regionCode = searchParams.get('region') || 'sp_capital'
    const search = searchParams.get('search')

    const supabase = createAdminClient()

    // Get region multiplier
    const { data: region } = await supabase
      .from('regions')
      .select('id, code, name, cost_multiplier')
      .eq('code', regionCode)
      .single()

    const regionMultiplier = region?.cost_multiplier || 1.0

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

    // Get regional adjustments for this region
    const { data: adjustments } = await supabase
      .from('regional_cost_adjustments')
      .select('*')
      .eq('region_id', region?.id)
      .or(`valid_until.is.null,valid_until.gte.${new Date().toISOString().split('T')[0]}`)

    // Apply regional pricing to services
    const servicesWithPricing = services?.map(service => {
      // Check for specific service adjustment
      const serviceAdjustment = adjustments?.find(a => a.service_id === service.id)
      // Check for category adjustment
      const categoryAdjustment = adjustments?.find(a => a.category_id === service.category_id && !a.service_id)
      // Check for region-wide adjustment
      const regionAdjustment = adjustments?.find(a => !a.category_id && !a.service_id)

      let multiplier = regionMultiplier
      let priceMin = service.base_price_min
      let priceMax = service.base_price_max

      // Apply adjustments (most specific wins)
      if (serviceAdjustment) {
        if (serviceAdjustment.price_min_override) {
          priceMin = serviceAdjustment.price_min_override
          priceMax = serviceAdjustment.price_max_override || priceMin * 1.5
        } else {
          multiplier = serviceAdjustment.cost_multiplier
        }
      } else if (categoryAdjustment) {
        multiplier = categoryAdjustment.cost_multiplier
      } else if (regionAdjustment) {
        multiplier = regionAdjustment.cost_multiplier
      }

      // Calculate final prices
      const finalPriceMin = Math.round(priceMin * multiplier * 100) / 100
      const finalPriceMax = Math.round(priceMax * multiplier * 100) / 100
      const finalPriceAvg = Math.round((finalPriceMin + finalPriceMax) / 2 * 100) / 100

      return {
        ...service,
        regional_price: {
          min: finalPriceMin,
          max: finalPriceMax,
          avg: finalPriceAvg,
          multiplier,
          region: region?.name || 'São Paulo Capital',
        },
      }
    })

    return NextResponse.json({
      categories,
      services: servicesWithPricing,
      region: region || { code: 'sp_capital', name: 'São Paulo Capital', cost_multiplier: 1.0 },
      total: servicesWithPricing?.length || 0,
    })
  } catch (error) {
    console.error('Error in GET /api/costs:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

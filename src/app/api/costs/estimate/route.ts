/**
 * Cost Estimate API - VistorIA Pro
 * POST: Estimate repair cost based on problem description
 */

import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { createAdminClient } from '@/lib/supabase/server'
import { z } from 'zod'

const estimateSchema = z.object({
  description: z.string().min(3),
  severity: z.enum(['low', 'medium', 'high', 'urgent']).optional(),
  region_code: z.string().default('sp_capital'),
  quantity: z.number().positive().default(1),
  // Optional: specific service code if known
  service_code: z.string().optional(),
  // For saving estimation history
  inspection_id: z.string().uuid().optional(),
  photo_id: z.string().uuid().optional(),
  problem_id: z.string().uuid().optional(),
})

// Keywords mapping for common problems
const problemKeywords: Record<string, string[]> = {
  // Pintura
  'pintura': ['pintura', 'pintar', 'tinta', 'descascando', 'descascada', 'manchas', 'mancha', 'desbotada', 'desbotado'],
  'mofo': ['mofo', 'bolor', 'fungo', 'mofada', 'mofado'],
  'trinca_parede': ['trinca', 'rachadura', 'fissura', 'rachado', 'trincado', 'rachaduras'],

  // Hidráulica
  'vazamento': ['vazamento', 'vazando', 'goteira', 'gotejando', 'infiltração', 'infiltrando', 'água', 'molhado'],
  'entupido': ['entupido', 'entupimento', 'entupida', 'obstruído', 'obstrução', 'não escoa'],
  'torneira': ['torneira', 'registro', 'pingando', 'gotejando'],

  // Elétrica
  'tomada': ['tomada', 'interruptor', 'não funciona', 'queimada', 'queimado', 'sem energia'],
  'curto': ['curto', 'circuito', 'disjuntor', 'desarmando', 'faísca'],

  // Pisos
  'piso': ['piso', 'cerâmica', 'porcelanato', 'azulejo', 'solto', 'solta', 'quebrado', 'quebrada', 'trincado'],
  'rejunte': ['rejunte', 'rejuntamento', 'escurecido', 'sujo', 'caindo'],

  // Portas e janelas
  'porta': ['porta', 'dobradiça', 'maçaneta', 'fechadura', 'não fecha', 'emperrada', 'arranhando'],
  'janela': ['janela', 'vidro', 'quebrado', 'trincado', 'roldana', 'não abre', 'travada'],

  // Forro
  'forro': ['forro', 'gesso', 'teto', 'caindo', 'manchas', 'danificado'],

  // Ar condicionado
  'ar_condicionado': ['ar condicionado', 'ar-condicionado', 'split', 'não gela', 'vazando', 'barulho'],
}

// Map keywords to service codes
const keywordToService: Record<string, string[]> = {
  'pintura': ['pintura_parede_simples', 'pintura_parede_completa'],
  'mofo': ['tratamento_mofo', 'pintura_parede_completa'],
  'trinca_parede': ['reparo_trinca_parede', 'reparo_trinca_gesso'],
  'vazamento': ['reparo_vazamento', 'tratamento_infiltracao'],
  'entupido': ['desentupimento_simples', 'desentupimento_vaso', 'desentupimento_esgoto'],
  'torneira': ['troca_torneira', 'troca_registro'],
  'tomada': ['troca_tomada', 'troca_interruptor'],
  'curto': ['reparo_curto_circuito', 'troca_disjuntor'],
  'piso': ['troca_piso_ceramico', 'troca_piso_porcelanato', 'reparo_rejunte'],
  'rejunte': ['reparo_rejunte'],
  'porta': ['ajuste_porta', 'troca_fechadura_simples', 'troca_dobradica'],
  'janela': ['troca_vidro_janela', 'ajuste_janela_aluminio', 'troca_roldana_janela'],
  'forro': ['reparo_forro_gesso', 'reparo_trinca_gesso'],
  'ar_condicionado': ['manutencao_split', 'reparo_ar', 'carga_gas'],
}

export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const data = estimateSchema.parse(body)

    const supabase = createAdminClient()

    // Get user
    const { data: user } = await supabase
      .from('users')
      .select('id')
      .eq('clerk_id', userId)
      .single()

    // Get region
    const { data: region } = await supabase
      .from('regions')
      .select('*')
      .eq('code', data.region_code)
      .single()

    const regionMultiplier = region?.cost_multiplier || 1.0

    let serviceCodes: string[] = []

    // If specific service code provided, use it
    if (data.service_code) {
      serviceCodes = [data.service_code]
    } else {
      // Analyze description to find matching services
      const descLower = data.description.toLowerCase()

      for (const [category, keywords] of Object.entries(problemKeywords)) {
        for (const keyword of keywords) {
          if (descLower.includes(keyword)) {
            const services = keywordToService[category]
            if (services) {
              serviceCodes.push(...services)
            }
            break
          }
        }
      }

      // Remove duplicates
      serviceCodes = [...new Set(serviceCodes)]
    }

    // If no matches found, try full-text search
    if (serviceCodes.length === 0) {
      const { data: searchResults } = await supabase
        .from('repair_services')
        .select('code')
        .or(`name.ilike.%${data.description}%,description.ilike.%${data.description}%`)
        .limit(5)

      serviceCodes = searchResults?.map(r => r.code) || []
    }

    // Fetch matching services with prices
    const { data: services, error } = await supabase
      .from('repair_services')
      .select(`
        *,
        category:service_categories(id, code, name, icon)
      `)
      .in('code', serviceCodes.length > 0 ? serviceCodes : ['pintura_parede_simples'])
      .eq('is_active', true)

    if (error) {
      console.error('Error fetching services:', error)
      return NextResponse.json({ error: 'Failed to fetch services' }, { status: 500 })
    }

    // Filter by severity if provided
    let matchedServices = services || []
    if (data.severity) {
      matchedServices = matchedServices.filter(s =>
        s.severity_tags?.includes(data.severity)
      )
      // If no matches with severity, fall back to all
      if (matchedServices.length === 0) {
        matchedServices = services || []
      }
    }

    // Calculate prices for each service
    const estimates = matchedServices.map(service => {
      const priceMin = Math.round(service.base_price_min * regionMultiplier * data.quantity * 100) / 100
      const priceMax = Math.round(service.base_price_max * regionMultiplier * data.quantity * 100) / 100
      const priceAvg = Math.round((priceMin + priceMax) / 2 * 100) / 100

      return {
        service: {
          code: service.code,
          name: service.name,
          description: service.description,
          unit: service.unit,
          unit_label: service.unit_label,
          category: service.category,
          difficulty: service.difficulty,
          includes_material: service.includes_material,
          includes_labor: service.includes_labor,
        },
        estimate: {
          quantity: data.quantity,
          price_min: priceMin,
          price_max: priceMax,
          price_avg: priceAvg,
          region: region?.name || 'São Paulo Capital',
          region_multiplier: regionMultiplier,
        },
      }
    })

    // Calculate total range
    const totalMin = estimates.reduce((sum, e) => sum + e.estimate.price_min, 0)
    const totalMax = estimates.reduce((sum, e) => sum + e.estimate.price_max, 0)
    const totalAvg = Math.round((totalMin + totalMax) / 2 * 100) / 100

    // Save estimation to history (optional)
    if (user && estimates.length > 0) {
      const primaryEstimate = estimates[0]
      const { data: savedEstimation } = await supabase
        .from('cost_estimations')
        .insert({
          user_id: user.id,
          inspection_id: data.inspection_id || null,
          photo_id: data.photo_id || null,
          problem_id: data.problem_id || null,
          region_id: region?.id || null,
          service_id: null, // Would need service ID
          quantity: data.quantity,
          estimated_min: totalMin,
          estimated_max: totalMax,
          estimated_avg: totalAvg,
        })
        .select()
        .single()
    }

    return NextResponse.json({
      success: true,
      description: data.description,
      severity: data.severity,
      estimates,
      summary: {
        services_matched: estimates.length,
        total_min: Math.round(totalMin * 100) / 100,
        total_max: Math.round(totalMax * 100) / 100,
        total_avg: totalAvg,
        region: region?.name || 'São Paulo Capital',
        region_code: data.region_code,
      },
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request data', details: error.issues },
        { status: 400 }
      )
    }

    console.error('Error in POST /api/costs/estimate:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

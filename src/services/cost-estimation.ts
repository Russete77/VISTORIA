/**
 * Cost Estimation Service - VistorIA Pro
 * Estimates repair costs based on problem descriptions
 */

import { createAdminClient } from '@/lib/supabase/server'

export interface ProblemWithCost {
  description: string
  severity: string
  location?: string
  suggestedAction?: string
  estimatedCost?: {
    min: number
    max: number
    avg: number
    service_name: string
    unit: string
    region: string
  }
}

// Keywords mapping for common problems (Portuguese)
const problemKeywords: Record<string, string[]> = {
  // Pintura
  'pintura_parede_completa': ['pintura', 'pintar', 'tinta', 'descascando', 'descascada', 'parede', 'repintar'],
  'pintura_parede_simples': ['manchas', 'mancha', 'desbotada', 'desbotado', 'retocar'],
  'tratamento_mofo': ['mofo', 'bolor', 'fungo', 'mofada', 'mofado'],
  'reparo_trinca_parede': ['trinca', 'rachadura', 'fissura', 'rachado', 'trincado', 'rachaduras', 'fissuras'],

  // Hidráulica
  'reparo_vazamento': ['vazamento', 'vazando', 'goteira', 'gotejando', 'infiltração', 'infiltrando'],
  'desentupimento_simples': ['entupido', 'entupimento', 'entupida', 'obstruído', 'não escoa'],
  'troca_torneira': ['torneira', 'pingando'],
  'troca_registro': ['registro', 'vazando', 'gotejando'],
  'troca_sifao': ['sifão', 'odor', 'mau cheiro'],
  'troca_valvula_descarga': ['válvula', 'descarga', 'não para'],

  // Elétrica
  'troca_tomada': ['tomada', 'queimada', 'derretida', 'não funciona'],
  'troca_interruptor': ['interruptor', 'quebrado', 'não funciona'],
  'reparo_curto_circuito': ['curto', 'circuito', 'disjuntor', 'desarmando', 'faísca'],
  'instalacao_luminaria': ['luminária', 'luz', 'lâmpada'],

  // Pisos
  'troca_piso_ceramico': ['piso', 'cerâmica', 'porcelanato', 'solto', 'solta', 'quebrado', 'quebrada', 'trincado'],
  'reparo_rejunte': ['rejunte', 'rejuntamento', 'escurecido', 'sujo', 'caindo'],
  'troca_rodape': ['rodapé', 'solto', 'danificado'],
  'troca_soleira': ['soleira', 'quebrada', 'danificada'],

  // Portas e janelas
  'ajuste_porta': ['porta', 'não fecha', 'emperrada', 'arranhando', 'rangendo'],
  'troca_fechadura_simples': ['fechadura', 'maçaneta', 'não funciona', 'travada'],
  'troca_dobradica': ['dobradiça', 'caindo', 'solta'],
  'troca_vidro_janela': ['vidro', 'quebrado', 'trincado', 'rachado'],
  'ajuste_janela_aluminio': ['janela', 'não abre', 'travada', 'emperrada'],
  'troca_roldana_janela': ['roldana', 'janela', 'desliza'],

  // Gesso e forro
  'reparo_forro_gesso': ['forro', 'gesso', 'teto', 'caindo', 'manchas', 'danificado'],
  'reparo_trinca_gesso': ['trinca', 'gesso', 'fissura', 'forro'],

  // Impermeabilização
  'tratamento_infiltracao': ['infiltração', 'umidade', 'úmido', 'molhado'],
  'impermeabilizacao_box': ['box', 'infiltração', 'banheiro'],

  // Ar condicionado
  'manutencao_split': ['ar condicionado', 'ar-condicionado', 'split', 'limpeza'],
  'reparo_ar': ['ar condicionado', 'não gela', 'não esfria', 'barulho'],

  // Louças e metais
  'troca_vaso_sanitario': ['vaso', 'sanitário', 'rachado', 'quebrado'],
  'troca_assento_vaso': ['assento', 'tampa', 'vaso'],
  'instalacao_ducha_higienica': ['ducha', 'higiênica'],

  // Limpeza
  'limpeza_pos_obra': ['limpeza', 'sujeira', 'pós-obra'],

  // Alvenaria
  'reparo_buraco_parede': ['buraco', 'parede', 'furo'],
  'reboco_parede': ['reboco', 'massa', 'regularização'],
}

/**
 * Find matching services based on problem description
 */
function findMatchingServices(description: string, severity: string): string[] {
  const descLower = description.toLowerCase()
  const matches: string[] = []

  for (const [serviceCode, keywords] of Object.entries(problemKeywords)) {
    let matchCount = 0
    for (const keyword of keywords) {
      if (descLower.includes(keyword.toLowerCase())) {
        matchCount++
      }
    }
    if (matchCount >= 1) {
      matches.push(serviceCode)
    }
  }

  return [...new Set(matches)]
}

/**
 * Estimate costs for a list of problems
 */
export async function estimateProblemCosts(
  problems: Array<{
    description: string
    severity: string
    location?: string
    suggestedAction?: string
  }>,
  regionCode: string = 'sp_capital'
): Promise<ProblemWithCost[]> {
  const supabase = createAdminClient()

  // Get region multiplier
  const { data: region } = await supabase
    .from('regions')
    .select('id, code, name, cost_multiplier')
    .eq('code', regionCode)
    .single()

  const regionMultiplier = region?.cost_multiplier || 1.0
  const regionName = region?.name || 'São Paulo Capital'

  // Get all services for matching
  const { data: services } = await supabase
    .from('repair_services')
    .select('*')
    .eq('is_active', true)

  const servicesMap = new Map(services?.map(s => [s.code, s]) || [])

  // Estimate costs for each problem
  return problems.map(problem => {
    const matchingServiceCodes = findMatchingServices(problem.description, problem.severity)

    // Also check suggestedAction for matches
    if (problem.suggestedAction) {
      const actionMatches = findMatchingServices(problem.suggestedAction, problem.severity)
      matchingServiceCodes.push(...actionMatches)
    }

    // Get unique service codes
    const uniqueCodes = [...new Set(matchingServiceCodes)]

    // Find best matching service (prefer exact matches)
    let bestService = null
    for (const code of uniqueCodes) {
      const service = servicesMap.get(code)
      if (service) {
        // Check if severity matches
        if (service.severity_tags?.includes(problem.severity)) {
          bestService = service
          break
        }
        if (!bestService) {
          bestService = service
        }
      }
    }

    if (bestService) {
      const priceMin = Math.round(bestService.base_price_min * regionMultiplier * 100) / 100
      const priceMax = Math.round(bestService.base_price_max * regionMultiplier * 100) / 100
      const priceAvg = Math.round((priceMin + priceMax) / 2 * 100) / 100

      return {
        ...problem,
        estimatedCost: {
          min: priceMin,
          max: priceMax,
          avg: priceAvg,
          service_name: bestService.name,
          unit: bestService.unit_label,
          region: regionName,
        },
      }
    }

    return problem
  })
}

/**
 * Get cost summary for a list of problems
 */
export function getCostSummary(problems: ProblemWithCost[]): {
  totalMin: number
  totalMax: number
  totalAvg: number
  problemsWithCosts: number
  problemsWithoutCosts: number
} {
  let totalMin = 0
  let totalMax = 0
  let problemsWithCosts = 0
  let problemsWithoutCosts = 0

  for (const problem of problems) {
    if (problem.estimatedCost) {
      totalMin += problem.estimatedCost.min
      totalMax += problem.estimatedCost.max
      problemsWithCosts++
    } else {
      problemsWithoutCosts++
    }
  }

  return {
    totalMin: Math.round(totalMin * 100) / 100,
    totalMax: Math.round(totalMax * 100) / 100,
    totalAvg: Math.round((totalMin + totalMax) / 2 * 100) / 100,
    problemsWithCosts,
    problemsWithoutCosts,
  }
}

/**
 * Format price for display
 */
export function formatPrice(value: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value)
}

/**
 * Format price range for display
 */
export function formatPriceRange(min: number, max: number): string {
  if (min === max) {
    return formatPrice(min)
  }
  return `${formatPrice(min)} - ${formatPrice(max)}`
}

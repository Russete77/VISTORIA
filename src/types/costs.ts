/**
 * Cost Types - VistorIA Pro
 * Types for regional repair cost estimation
 */

export interface Region {
  id: string
  code: string
  name: string
  state: string | null
  type: 'capital' | 'metropolitan' | 'interior' | 'region'
  cost_multiplier: number
  created_at: string
  updated_at: string
}

export interface ServiceCategory {
  id: string
  code: string
  name: string
  description: string | null
  icon: string | null
  display_order: number
  is_active: boolean
  created_at: string
}

export type ServiceDifficulty = 'simple' | 'medium' | 'complex' | 'specialist'

export type ServiceUnit = 'm²' | 'm' | 'un' | 'h' | 'diária'

export interface RepairService {
  id: string
  category_id: string
  code: string
  name: string
  description: string | null
  unit: ServiceUnit
  unit_label: string
  base_price_min: number
  base_price_max: number
  base_price_avg: number
  includes_material: boolean
  includes_labor: boolean
  estimated_hours: number | null
  difficulty: ServiceDifficulty | null
  keywords: string[]
  severity_tags: string[]
  is_active: boolean
  display_order: number
  created_at: string
  updated_at: string
  category?: ServiceCategory
}

export interface RepairServiceWithPricing extends RepairService {
  regional_price: {
    min: number
    max: number
    avg: number
    multiplier: number
    region: string
  }
}

export interface CostEstimate {
  service: {
    code: string
    name: string
    description: string | null
    unit: ServiceUnit
    unit_label: string
    category: ServiceCategory | null
    difficulty: ServiceDifficulty | null
    includes_material: boolean
    includes_labor: boolean
  }
  estimate: {
    quantity: number
    price_min: number
    price_max: number
    price_avg: number
    region: string
    region_multiplier: number
  }
}

export interface CostEstimateResponse {
  success: boolean
  description: string
  severity?: string
  estimates: CostEstimate[]
  summary: {
    services_matched: number
    total_min: number
    total_max: number
    total_avg: number
    region: string
    region_code: string
  }
}

export interface CostEstimation {
  id: string
  user_id: string | null
  inspection_id: string | null
  photo_id: string | null
  problem_id: string | null
  region_id: string | null
  service_id: string | null
  quantity: number
  estimated_min: number
  estimated_max: number
  estimated_avg: number
  actual_cost: number | null
  feedback_accuracy: 'accurate' | 'low' | 'high' | 'way_off' | null
  created_at: string
}

// Helper functions
export function formatPrice(value: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value)
}

export function formatPriceRange(min: number, max: number): string {
  if (min === max) {
    return formatPrice(min)
  }
  return `${formatPrice(min)} - ${formatPrice(max)}`
}

export function getDifficultyLabel(difficulty: ServiceDifficulty | null): string {
  switch (difficulty) {
    case 'simple':
      return 'Simples'
    case 'medium':
      return 'Médio'
    case 'complex':
      return 'Complexo'
    case 'specialist':
      return 'Especialista'
    default:
      return 'Não definido'
  }
}

export function getUnitLabel(unit: ServiceUnit): string {
  switch (unit) {
    case 'm²':
      return 'por m²'
    case 'm':
      return 'por metro'
    case 'un':
      return 'por unidade'
    case 'h':
      return 'por hora'
    case 'diária':
      return 'por diária'
    default:
      return unit
  }
}

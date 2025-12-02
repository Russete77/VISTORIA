/**
 * Constants - VistorIA Pro
 * Centralized constants for the application
 */

import type { PropertyType, RoomCategory, ProblemSeverity, UserTier } from '@/types'

// =============================================================================
// Application Constants
// =============================================================================

export const APP_NAME = 'VistorIA Pro'
export const APP_DESCRIPTION = 'Vistorias inteligentes em minutos, não em horas'
export const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'

// =============================================================================
// Pricing & Credits
// =============================================================================

export const PRICING = {
  FREE_TIER_CREDITS: 1, // Credits per month for free users

  PAY_PER_USE: {
    PRICE: 9.90,
    CREDITS: 1,
    NAME: 'Vistoria Avulsa',
  },

  PACKS: {
    STARTER: {
      PRICE: 89.00,
      CREDITS: 10,
      NAME: 'Starter Pack',
      DISCOUNT: '10%',
      COMPARISONS: 3,
      VALIDITY_MONTHS: 6,
    },
    PRO: {
      PRICE: 199.00,
      CREDITS: 25,
      NAME: 'Pro Pack',
      DISCOUNT: '20%',
      COMPARISONS: 8,
      GOOGLE_VISION: 10,
      VALIDITY_MONTHS: 12,
    },
    BUSINESS: {
      PRICE: 449.00,
      CREDITS: 60,
      NAME: 'Business Pack',
      DISCOUNT: '25%',
      COMPARISONS: 'unlimited',
      GOOGLE_VISION: 30,
      STORAGE_GB: 50,
      VALIDITY_MONTHS: 12,
    },
  },

  SUBSCRIPTIONS: {
    PROFESSIONAL: {
      PRICE: 299.00,
      CREDITS: 50,
      NAME: 'Professional',
      COMPARISONS: 'unlimited',
      GOOGLE_VISION: 25,
      STORAGE_GB: 100,
      USERS: 3,
      OVERAGE_PRICE: 5.90,
      EXTRA_USER_PRICE: 50.00,
    },
    BUSINESS: {
      PRICE: 699.00,
      CREDITS: 150,
      NAME: 'Business',
      COMPARISONS: 'unlimited',
      GOOGLE_VISION: 'unlimited',
      STORAGE_GB: 500,
      USERS: 10,
      WHITE_LABEL: true,
      API_ACCESS: true,
      OVERAGE_PRICE: 4.90,
      EXTRA_USER_PRICE: 50.00,
    },
  },

  ADD_ONS: {
    COMPARISON: {
      PRICE: 5.00,
      NAME: 'Comparação Entrada/Saída',
    },
    GOOGLE_VISION: {
      PRICE: 2.00,
      NAME: 'Google Vision AI',
    },
    STORAGE_GB: {
      PRICE: 0.10,
      NAME: 'Storage Extra (por GB/mês)',
    },
  },
} as const

// =============================================================================
// Property Types & Categories
// =============================================================================

export const PROPERTY_TYPES: Record<PropertyType, string> = {
  apartment: 'Apartamento',
  house: 'Casa',
  commercial: 'Comercial',
  land: 'Terreno',
}

export const ROOM_CATEGORIES: Record<RoomCategory, string> = {
  living_room: 'Sala de Estar',
  kitchen: 'Cozinha',
  bathroom: 'Banheiro',
  bedroom: 'Quarto',
  hallway: 'Corredor',
  balcony: 'Varanda',
  garage: 'Garagem',
  other: 'Outro',
}

export const DEFAULT_ROOMS = [
  { name: 'Sala de Estar', category: 'living_room' as RoomCategory },
  { name: 'Cozinha', category: 'kitchen' as RoomCategory },
  { name: 'Banheiro Principal', category: 'bathroom' as RoomCategory },
  { name: 'Quarto 1', category: 'bedroom' as RoomCategory },
  { name: 'Quarto 2', category: 'bedroom' as RoomCategory },
  { name: 'Corredor', category: 'hallway' as RoomCategory },
  { name: 'Varanda', category: 'balcony' as RoomCategory },
]

// =============================================================================
// Problem Severity
// =============================================================================

export const PROBLEM_SEVERITY: Record<ProblemSeverity, { label: string; color: string; bgColor: string }> = {
  low: {
    label: 'Baixo',
    color: 'text-blue-700',
    bgColor: 'bg-blue-100',
  },
  medium: {
    label: 'Médio',
    color: 'text-yellow-700',
    bgColor: 'bg-yellow-100',
  },
  high: {
    label: 'Alto',
    color: 'text-orange-700',
    bgColor: 'bg-orange-100',
  },
  urgent: {
    label: 'Urgente',
    color: 'text-red-700',
    bgColor: 'bg-red-100',
  },
}

// =============================================================================
// User Tiers
// =============================================================================

export const USER_TIERS: Record<UserTier, { label: string; color: string }> = {
  free: {
    label: 'Gratuito',
    color: 'text-gray-600',
  },
  pay_per_use: {
    label: 'Avulso',
    color: 'text-blue-600',
  },
  professional: {
    label: 'Professional',
    color: 'text-purple-600',
  },
  business: {
    label: 'Business',
    color: 'text-indigo-600',
  },
  enterprise: {
    label: 'Enterprise',
    color: 'text-pink-600',
  },
}

// =============================================================================
// Inspection Types
// =============================================================================

export const INSPECTION_TYPES = {
  move_in: {
    label: 'Entrada',
    description: 'Vistoria de entrada do inquilino',
    icon: '📥',
  },
  move_out: {
    label: 'Saída',
    description: 'Vistoria de saída do inquilino',
    icon: '📤',
  },
  periodic: {
    label: 'Periódica',
    description: 'Vistoria periódica do imóvel',
    icon: '🔄',
  },
} as const

export const INSPECTION_STATUS = {
  draft: {
    label: 'Rascunho',
    color: 'text-gray-600',
    bgColor: 'bg-gray-100',
  },
  in_progress: {
    label: 'Em Andamento',
    color: 'text-blue-700',
    bgColor: 'bg-blue-100',
  },
  completed: {
    label: 'Concluída',
    color: 'text-green-700',
    bgColor: 'bg-green-100',
  },
  signed: {
    label: 'Assinada',
    color: 'text-purple-700',
    bgColor: 'bg-purple-100',
  },
} as const

// =============================================================================
// File Upload Limits
// =============================================================================

export const UPLOAD_LIMITS = {
  MAX_FILE_SIZE: 10 * 1024 * 1024, // 10MB
  MAX_FILES_PER_INSPECTION: 100,
  MAX_FILES_PER_ROOM: 20,
  ALLOWED_IMAGE_TYPES: ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'],
  ALLOWED_IMAGE_EXTENSIONS: ['.jpg', '.jpeg', '.png', '.webp'],
} as const

// =============================================================================
// AI Configuration
// =============================================================================

export const AI_CONFIG = {
  MIN_CONFIDENCE_THRESHOLD: 0.7, // Only show problems with confidence >= 70%
  MAX_PROBLEMS_PER_PHOTO: 10,
  ANALYSIS_TIMEOUT_MS: 30000, // 30 seconds
  RETRY_ATTEMPTS: 2,
} as const

// =============================================================================
// Storage Buckets
// =============================================================================

export const STORAGE_BUCKETS = {
  INSPECTION_PHOTOS: 'inspection-photos',
  REPORTS: 'reports',
  AVATARS: 'avatars',
} as const

// =============================================================================
// Date Formats
// =============================================================================

export const DATE_FORMATS = {
  DISPLAY: 'dd/MM/yyyy',
  DISPLAY_WITH_TIME: 'dd/MM/yyyy HH:mm',
  ISO: "yyyy-MM-dd'T'HH:mm:ss.SSSxxx",
  FILE_NAME: 'yyyyMMdd_HHmmss',
} as const

// =============================================================================
// Validation Rules
// =============================================================================

export const VALIDATION = {
  MIN_PASSWORD_LENGTH: 8,
  MAX_PROPERTY_NAME_LENGTH: 200,
  MAX_ADDRESS_LENGTH: 500,
  MAX_NOTES_LENGTH: 2000,
  MAX_ROOM_NAME_LENGTH: 100,
  MIN_AREA_SQM: 1,
  MAX_AREA_SQM: 100000,
} as const

// =============================================================================
// Feature Flags
// =============================================================================

export const FEATURES = {
  ENABLE_GOOGLE_VISION: process.env.GOOGLE_VISION_API_KEY !== undefined,
  ENABLE_COMPARISONS: true,
  ENABLE_TEAM_FEATURES: false, // Coming in Q2 2025
  ENABLE_WHITE_LABEL: false, // Coming in Phase 3
  ENABLE_MOBILE_APP: false, // Coming in Phase 3
  ENABLE_API_ACCESS: false, // Coming in Phase 3
} as const

// =============================================================================
// Team Features Configuration
// =============================================================================

export const TEAM_FEATURES = [
  {
    id: 'multi-users',
    title: 'Múltiplos Usuários',
    description: 'Adicione até 10 membros na sua equipe',
    requiredTier: 'business' as UserTier,
  },
  {
    id: 'permissions',
    title: 'Permissões Granulares',
    description: 'Controle o que cada membro pode visualizar e editar',
    requiredTier: 'business' as UserTier,
  },
  {
    id: 'centralized',
    title: 'Gestão Centralizada',
    description: 'Gerencie todos os imóveis e vistorias em um só lugar',
    requiredTier: 'business' as UserTier,
  },
  {
    id: 'workflows',
    title: 'Workflows Colaborativos',
    description: 'Vistorias em equipe com atribuição de tarefas',
    requiredTier: 'business' as UserTier,
  },
  {
    id: 'audit',
    title: 'Auditoria Completa',
    description: 'Histórico de todas as ações dos membros',
    requiredTier: 'business' as UserTier,
  },
  {
    id: 'white-label',
    title: 'White Label',
    description: 'Personalize com sua marca e domínio próprio',
    requiredTier: 'business' as UserTier,
  },
] as const

export const TEAM_LAUNCH_DATE = {
  QUARTER: 'Q2',
  YEAR: 2025,
  DISPLAY: 'segundo trimestre de 2025',
} as const

// =============================================================================
// Routes
// =============================================================================

export const ROUTES = {
  HOME: '/',
  SIGN_IN: '/sign-in',
  SIGN_UP: '/sign-up',
  DASHBOARD: '/dashboard',
  PROPERTIES: '/properties',
  INSPECTIONS: '/inspections',
  SETTINGS: '/settings',
  BILLING: '/billing',
  HELP: '/help',
  DISPUTES: '/disputes',
} as const

// =============================================================================
// Dispute Categories
// =============================================================================

export const DISPUTE_CATEGORIES = {
  damage_assessment: {
    label: 'Avaliação de Dano',
    description: 'Contestação sobre a avaliação de danos no imóvel',
    icon: '🔍',
  },
  missing_item: {
    label: 'Item Ausente',
    description: 'Contestação sobre item relatado como ausente',
    icon: '📦',
  },
  cleaning_standard: {
    label: 'Padrão de Limpeza',
    description: 'Contestação sobre o padrão de limpeza exigido',
    icon: '🧹',
  },
  appliance_condition: {
    label: 'Condição de Equipamentos',
    description: 'Contestação sobre a condição de eletrodomésticos',
    icon: '⚙️',
  },
  general_condition: {
    label: 'Condição Geral',
    description: 'Contestação sobre a condição geral do imóvel',
    icon: '🏠',
  },
  other: {
    label: 'Outro',
    description: 'Outras contestações',
    icon: '💬',
  },
} as const

// =============================================================================
// Dispute Status
// =============================================================================

export const DISPUTE_STATUS = {
  pending: {
    label: 'Pendente',
    description: 'Aguardando análise',
    color: 'text-gray-700',
    bgColor: 'bg-gray-100',
    icon: '⏳',
  },
  under_review: {
    label: 'Em Análise',
    description: 'Contestação sendo analisada',
    color: 'text-blue-700',
    bgColor: 'bg-blue-100',
    icon: '👀',
  },
  accepted: {
    label: 'Aceita',
    description: 'Contestação aceita',
    color: 'text-green-700',
    bgColor: 'bg-green-100',
    icon: '✅',
  },
  rejected: {
    label: 'Rejeitada',
    description: 'Contestação rejeitada',
    color: 'text-red-700',
    bgColor: 'bg-red-100',
    icon: '❌',
  },
  resolved: {
    label: 'Resolvida',
    description: 'Contestação resolvida',
    color: 'text-purple-700',
    bgColor: 'bg-purple-100',
    icon: '🎯',
  },
} as const

// =============================================================================
// Dispute Configuration
// =============================================================================

export const DISPUTE_CONFIG = {
  MAX_ATTACHMENTS_PER_DISPUTE: 5,
  MAX_ATTACHMENT_SIZE: 10 * 1024 * 1024, // 10MB
  ALLOWED_ATTACHMENT_TYPES: ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'],
  TOKEN_EXPIRY_DAYS: 90, // 90 days to access dispute
  PROTOCOL_PREFIX: 'DISP',
} as const

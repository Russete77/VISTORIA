/**
 * PDF Template Types - VistorIA Pro
 * Sistema de templates personalizáveis para laudos
 */

export interface PDFTemplateColors {
  primary: string       // Cor principal (cabeçalhos, destaques)
  secondary: string     // Cor secundária (fundos, bordas)
  accent: string        // Cor de destaque (CTAs, badges)
  text: string          // Cor do texto principal
  textLight: string     // Cor do texto secundário
  background: string    // Cor de fundo
  danger: string        // Cor para problemas graves
  warning: string       // Cor para atenção
  success: string       // Cor para status OK
}

export interface PDFTemplateFonts {
  title: 'Helvetica-Bold' | 'Times-Bold' | 'Courier-Bold'
  body: 'Helvetica' | 'Times-Roman' | 'Courier'
  size: {
    title: number       // Tamanho do título principal (ex: 24)
    subtitle: number    // Tamanho de subtítulos (ex: 16)
    body: number        // Tamanho do texto (ex: 10)
    small: number       // Texto pequeno (ex: 8)
  }
}

export interface PDFTemplateSections {
  showCover: boolean           // Página de capa
  showInfo: boolean            // Página informativa
  showSummary: boolean         // Resumo geral da vistoria
  showProblems: boolean        // Lista de problemas encontrados
  showPhotos: boolean          // Páginas de fotos
  showSignatures: boolean      // Área de assinaturas
  showAIAnalysis: boolean      // Mostrar análise da IA
  showChecklist: boolean       // Checkbox de itens verificados
  maxPhotosPerPage: 4 | 6 | 8  // Fotos por página
  photoLayout: '2x2' | '2x3' | '2x4' | '1x1'  // Layout das fotos
}

export interface PDFTemplateBranding {
  logo?: string                // URL do logo (base64 ou URL)
  companyName?: string         // Nome da empresa
  companyAddress?: string      // Endereço da empresa
  companyPhone?: string        // Telefone
  companyEmail?: string        // Email de contato
  companyWebsite?: string      // Website
  footerText?: string          // Texto do rodapé
  showWatermark: boolean       // Mostrar marca d'água VistorIA
}

export interface PDFTemplateHeader {
  style: 'full' | 'minimal' | 'logo-only' | 'none'
  position: 'left' | 'center' | 'right'
  showPageNumber: boolean
  showDate: boolean
}

export interface PDFTemplateConfig {
  colors: PDFTemplateColors
  fonts: PDFTemplateFonts
  sections: PDFTemplateSections
  branding: PDFTemplateBranding
  header: PDFTemplateHeader
}

export interface PDFTemplate {
  id: string
  user_id: string
  name: string
  description?: string
  type: 'inspection' | 'comparison' | 'both'
  config: PDFTemplateConfig
  is_default: boolean
  is_system: boolean    // Templates do sistema (não editáveis)
  created_at: string
  updated_at: string
}

// Templates padrão do sistema
export const DEFAULT_COLORS: PDFTemplateColors = {
  primary: '#1a56db',      // Azul VistorIA
  secondary: '#f3f4f6',    // Cinza claro
  accent: '#7c3aed',       // Roxo
  text: '#111827',         // Quase preto
  textLight: '#6b7280',    // Cinza
  background: '#ffffff',   // Branco
  danger: '#dc2626',       // Vermelho
  warning: '#f59e0b',      // Laranja
  success: '#10b981',      // Verde
}

export const DEFAULT_FONTS: PDFTemplateFonts = {
  title: 'Helvetica-Bold',
  body: 'Helvetica',
  size: {
    title: 24,
    subtitle: 14,
    body: 10,
    small: 8,
  },
}

export const DEFAULT_SECTIONS: PDFTemplateSections = {
  showCover: true,
  showInfo: true,
  showSummary: true,
  showProblems: true,
  showPhotos: true,
  showSignatures: true,
  showAIAnalysis: true,
  showChecklist: true,
  maxPhotosPerPage: 6,
  photoLayout: '2x3',
}

export const DEFAULT_BRANDING: PDFTemplateBranding = {
  showWatermark: true,
}

export const DEFAULT_HEADER: PDFTemplateHeader = {
  style: 'full',
  position: 'left',
  showPageNumber: true,
  showDate: true,
}

export const DEFAULT_TEMPLATE_CONFIG: PDFTemplateConfig = {
  colors: DEFAULT_COLORS,
  fonts: DEFAULT_FONTS,
  sections: DEFAULT_SECTIONS,
  branding: DEFAULT_BRANDING,
  header: DEFAULT_HEADER,
}

// Preset de templates
export interface TemplatePreset {
  id: string
  name: string
  description: string
  preview?: string  // URL da imagem de preview
  config: Partial<PDFTemplateConfig>
}

export const TEMPLATE_PRESETS: TemplatePreset[] = [
  {
    id: 'professional',
    name: 'Profissional',
    description: 'Layout limpo e formal para imobiliárias',
    config: {
      colors: {
        ...DEFAULT_COLORS,
        primary: '#1e3a5f',
        accent: '#2563eb',
      },
      header: {
        style: 'full',
        position: 'left',
        showPageNumber: true,
        showDate: true,
      },
    },
  },
  {
    id: 'modern',
    name: 'Moderno',
    description: 'Design contemporâneo com cores vibrantes',
    config: {
      colors: {
        ...DEFAULT_COLORS,
        primary: '#7c3aed',
        accent: '#ec4899',
      },
      header: {
        style: 'minimal',
        position: 'center',
        showPageNumber: true,
        showDate: true,
      },
    },
  },
  {
    id: 'minimal',
    name: 'Minimalista',
    description: 'Foco no conteúdo, sem distrações',
    config: {
      colors: {
        ...DEFAULT_COLORS,
        primary: '#374151',
        secondary: '#f9fafb',
        accent: '#6b7280',
      },
      sections: {
        ...DEFAULT_SECTIONS,
        showInfo: false,
        showChecklist: false,
      },
      header: {
        style: 'logo-only',
        position: 'center',
        showPageNumber: true,
        showDate: false,
      },
    },
  },
  {
    id: 'detailed',
    name: 'Detalhado',
    description: 'Máximo de informações para vistorias completas',
    config: {
      sections: {
        ...DEFAULT_SECTIONS,
        maxPhotosPerPage: 4,
        photoLayout: '2x2',
      },
    },
  },
]

// Helper para criar template com valores padrão
export function createTemplateConfig(
  partial: Partial<PDFTemplateConfig> = {}
): PDFTemplateConfig {
  return {
    colors: { ...DEFAULT_COLORS, ...partial.colors },
    fonts: {
      ...DEFAULT_FONTS,
      ...partial.fonts,
      size: { ...DEFAULT_FONTS.size, ...partial.fonts?.size },
    },
    sections: { ...DEFAULT_SECTIONS, ...partial.sections },
    branding: { ...DEFAULT_BRANDING, ...partial.branding },
    header: { ...DEFAULT_HEADER, ...partial.header },
  }
}

// Helper para aplicar preset
export function applyPreset(
  presetId: string,
  currentConfig?: PDFTemplateConfig
): PDFTemplateConfig {
  const preset = TEMPLATE_PRESETS.find(p => p.id === presetId)
  if (!preset) {
    return currentConfig || DEFAULT_TEMPLATE_CONFIG
  }

  const baseConfig = currentConfig || DEFAULT_TEMPLATE_CONFIG
  return createTemplateConfig({
    ...baseConfig,
    ...preset.config,
  })
}

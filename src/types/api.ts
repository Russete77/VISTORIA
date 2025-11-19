/**
 * API Types - VistorIA Pro
 * Request/Response types for API endpoints
 */

import type { ProblemSeverity } from './database'

// =============================================================================
// AI Analysis Types
// =============================================================================

export interface AnalyzePhotoRequest {
  imageUrl: string
  roomName: string
  inspectionType: 'move_in' | 'move_out' | 'periodic'
  context?: {
    propertyType?: string
    previousProblems?: string[]
  }
}

export interface AnalyzePhotoResponse {
  success: boolean
  data?: {
    hasProblems: boolean
    summary: string
    confidence: number
    problems: Array<{
      description: string
      severity: ProblemSeverity
      location: string
      suggestedAction: string
      confidence: number
    }>
  }
  error?: string
}

// =============================================================================
// Inspection Types
// =============================================================================

export interface CreateInspectionRequest {
  propertyId: string
  type: 'move_in' | 'move_out' | 'periodic'
  scheduledAt?: string
  inspectorName?: string
  tenantName?: string
  landlordName?: string
}

export interface UpdateInspectionRequest {
  status?: 'draft' | 'in_progress' | 'completed' | 'signed'
  inspectorName?: string
  tenantName?: string
  landlordName?: string
  notes?: string
  inspectorSignature?: string
  tenantSignature?: string
  landlordSignature?: string
}

export interface UploadPhotoRequest {
  inspectionId: string
  roomName: string
  roomCategory: string
  file: File
}

export interface UploadPhotoResponse {
  success: boolean
  data?: {
    photoId: string
    storageUrl: string
  }
  error?: string
}

// =============================================================================
// Billing Types
// =============================================================================

export interface PurchaseCreditsRequest {
  package: 'pay_per_use' | 'starter_pack' | 'pro_pack' | 'business_pack'
  quantity?: number
}

export interface PurchaseCreditsResponse {
  success: boolean
  data?: {
    clientSecret: string
    credits: number
    amount: number
  }
  error?: string
}

export interface SubscribeRequest {
  plan: 'professional' | 'business' | 'enterprise'
}

export interface SubscribeResponse {
  success: boolean
  data?: {
    subscriptionId: string
    clientSecret: string
  }
  error?: string
}

// =============================================================================
// Report Types
// =============================================================================

export interface GenerateReportRequest {
  inspectionId: string
  format?: 'pdf'
  options?: {
    includeThumbnails?: boolean
    includeProblemsOnly?: boolean
    logoUrl?: string
  }
}

export interface GenerateReportResponse {
  success: boolean
  data?: {
    reportUrl: string
    generatedAt: string
  }
  error?: string
}

// =============================================================================
// Comparison Types
// =============================================================================

export interface CreateComparisonRequest {
  propertyId: string
  moveInInspectionId: string
  moveOutInspectionId: string
}

export interface ComparisonAnalysisResponse {
  success: boolean
  data?: {
    comparisonId: string
    differencesDetected: number
    newDamages: number
    estimatedCost: number
    differences: Array<{
      roomName: string
      description: string
      severity: ProblemSeverity
      isNewDamage: boolean
      estimatedCost: number
    }>
  }
  error?: string
}

// =============================================================================
// Generic API Response
// =============================================================================

export interface ApiResponse<T = unknown> {
  success: boolean
  data?: T
  error?: string
  message?: string
}

export interface ApiError {
  success: false
  error: string
  code?: string
  details?: unknown
}

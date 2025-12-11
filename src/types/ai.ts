/**
 * AI Types - VistorIA Pro
 * Centralized types for AI analysis, training, and YOLO detection
 */

// ============================================
// YOLO Detection Types
// ============================================

export type YOLOClass = 
  | 'crack'       // Rachadura
  | 'stain'       // Mancha
  | 'mold'        // Mofo/Bolor
  | 'damage'      // Dano genérico
  | 'water_damage'// Dano de água
  | 'peeling'     // Descascamento
  | 'hole'        // Buraco
  | 'scratch'     // Arranhão

export interface YOLODetection {
  class: YOLOClass
  confidence: number
  bbox: [number, number, number, number] // [x1, y1, x2, y2]
  area?: number // pixel area of detection
}

export interface YOLOResult {
  frameIndex: number
  detections: YOLODetection[]
  hasProblems: boolean
  processingTimeMs: number
}

// ============================================
// Claude Analysis Types  
// ============================================

export interface ProblemDetail {
  description: string
  severity: 'low' | 'medium' | 'high' | 'urgent'
  location?: string
  suggestedAction?: string
  confidence: number
  estimatedCost?: {
    min: number
    max: number
  }
}

export interface ClaudeAnalysis {
  hasProblems: boolean
  summary: string
  confidence: number
  detailedAnalysis: {
    piso?: string
    parede?: string
    forro?: string
    [key: string]: string | undefined
  }
  problems: ProblemDetail[]
}

// ============================================
// Training Data Types
// ============================================

export interface TrainingData {
  id: string
  photo_id: string | null
  photo_url: string
  
  // YOLO data
  yolo_detections: YOLODetection[]
  
  // Claude data
  claude_analysis: ClaudeAnalysis
  claude_model: string
  
  // User corrections
  user_correction: ClaudeAnalysis | null
  severity_corrected: 'low' | 'medium' | 'high' | 'urgent' | null
  problems_corrected: ProblemDetail[] | null
  
  // Feedback
  feedback_rating: number | null
  feedback_comment: string | null
  is_correct: boolean | null
  
  // Metadata
  room_name: string | null
  room_category: string | null
  from_video: boolean
  
  // Tracking
  created_at: string
  corrected_at: string | null
  used_for_training: boolean
  training_batch_id: string | null
}

export interface TrainingDataInsert {
  photo_id?: string
  photo_url: string
  yolo_detections?: YOLODetection[]
  claude_analysis: ClaudeAnalysis
  claude_model?: string
  room_name?: string
  room_category?: string
  from_video?: boolean
}

// ============================================
// Model Version Types
// ============================================

export interface ModelVersion {
  id: string
  model_type: 'yolo' | 'bert' | 'other'
  version: string
  description: string | null
  
  // Metrics
  training_samples: number | null
  accuracy: number | null
  precision_score: number | null
  recall_score: number | null
  f1_score: number | null
  
  // File info
  model_path: string | null
  model_size_mb: number | null
  
  // Status
  is_active: boolean
  created_at: string
  trained_at: string | null
}

// ============================================
// Training Stats Types
// ============================================

export interface TrainingStats {
  total_samples: number
  samples_with_corrections: number
  samples_confirmed_correct: number
  samples_unused: number
  avg_feedback_rating: number | null
}

// ============================================
// AI Pipeline Types
// ============================================

export interface FrameAnalysisInput {
  frameBuffer: Buffer
  frameIndex: number
  roomName: string
  roomCategory: string
  transcription?: string
}

export interface FrameAnalysisResult {
  frameIndex: number
  yoloResult: YOLOResult
  claudeAnalysis: ClaudeAnalysis | null // null if YOLO found nothing
  trainingDataId?: string // ID of saved training data
}

export interface VideoAnalysisSummary {
  totalFrames: number
  framesWithProblems: number
  framesAnalyzedByYOLO: number
  framesAnalyzedByClaude: number
  totalProblemsFound: number
  processingTimeMs: number
  costSaved: number // estimated cost saved by YOLO filtering
}

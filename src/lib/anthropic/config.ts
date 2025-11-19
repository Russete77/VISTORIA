import Anthropic from '@anthropic-ai/sdk'

if (!process.env.ANTHROPIC_API_KEY) {
  throw new Error('Missing ANTHROPIC_API_KEY environment variable')
}

export const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
})

export const ANTHROPIC_CONFIG = {
  model: 'claude-sonnet-4-20250514',
  maxTokens: 1024,
  temperature: 0.3, // Lower temperature for more consistent analysis
} as const

export type ProblemSeverity = 'low' | 'medium' | 'high' | 'urgent'

export interface PhotoAnalysisResult {
  hasProblems: boolean
  problems: Array<{
    description: string
    severity: ProblemSeverity
    location: string
    suggestedAction: string
    confidence: number
  }>
  summary: string
}

'use client'

import { useState, useEffect } from 'react'
import { Sparkles, X, CheckCircle, TrendingUp } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface AITrainingBannerProps {
  className?: string
}

interface TrainingStats {
  totalSamples: number
  samplesWithCorrections: number
  samplesConfirmedCorrect: number
  avgFeedbackRating: number | null
}

/**
 * AITrainingBanner - Displays educational banner on review page
 * Explains to users how their corrections help train the AI
 */
export function AITrainingBanner({ className = '' }: AITrainingBannerProps) {
  const [isDismissed, setIsDismissed] = useState(false)
  const [stats, setStats] = useState<TrainingStats | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  // Check if banner was previously dismissed
  useEffect(() => {
    const dismissed = localStorage.getItem('ai_training_banner_dismissed')
    if (dismissed === 'true') {
      setIsDismissed(true)
    }
    
    // Fetch training stats
    fetchStats()
  }, [])

  const fetchStats = async () => {
    try {
      const res = await fetch('/api/training-stats')
      if (res.ok) {
        const data = await res.json()
        setStats(data)
      }
    } catch (error) {
      console.error('Failed to fetch training stats:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleDismiss = () => {
    setIsDismissed(true)
    localStorage.setItem('ai_training_banner_dismissed', 'true')
  }

  if (isDismissed) return null

  return (
    <div className={`rounded-xl bg-primary-600 p-4 sm:p-5 ${className}`}>
      <div className="flex flex-col sm:flex-row items-start gap-4">
        {/* Icon */}
        <div className="shrink-0 p-3 rounded-full bg-white/20">
          <Sparkles className="h-6 w-6 text-white" />
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <h3 className="text-lg font-semibold text-white">
            Ajude a IA a aprender! 🎯
          </h3>
          <p className="mt-1 text-sm text-white/90">
            Suas correções treinam nossa IA para análises cada vez mais precisas. 
            Use o botão <strong>"Editar"</strong> para corrigir descrições incorretas e os 
            botões <strong>👍/👎</strong> para avaliar cada problema detectado.
          </p>

          {/* Stats row */}
          {stats && !isLoading && (
            <div className="mt-3 flex flex-wrap items-center gap-3 text-sm">
              <div className="flex items-center gap-1.5 text-white">
                <TrendingUp className="h-4 w-4" />
                <span>{stats.totalSamples} amostras coletadas</span>
              </div>
              {stats.samplesWithCorrections > 0 && (
                <div className="flex items-center gap-1.5 text-white">
                  <CheckCircle className="h-4 w-4" />
                  <span>{stats.samplesWithCorrections} correções</span>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Dismiss button */}
        <Button
          variant="ghost"
          size="icon"
          onClick={handleDismiss}
          className="shrink-0 text-white/70 hover:text-white hover:bg-white/20"
        >
          <X className="h-5 w-5" />
        </Button>
      </div>

      {/* How-to tips */}
      <div className="mt-4 grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="flex items-start gap-2 p-3 rounded-lg bg-white/10">
          <span className="text-lg">✏️</span>
          <div>
            <p className="text-xs font-medium text-white">Editar Análise</p>
            <p className="text-xs text-white/70">Corrija descrições e problemas</p>
          </div>
        </div>
        <div className="flex items-start gap-2 p-3 rounded-lg bg-white/10">
          <span className="text-lg">👍</span>
          <div>
            <p className="text-xs font-medium text-white">IA Acertou</p>
            <p className="text-xs text-white/70">Confirme análises corretas</p>
          </div>
        </div>
        <div className="flex items-start gap-2 p-3 rounded-lg bg-white/10">
          <span className="text-lg">👎</span>
          <div>
            <p className="text-xs font-medium text-white">IA Errou</p>
            <p className="text-xs text-white/70">Reporte erros para corrigir</p>
          </div>
        </div>
      </div>
    </div>
  )
}

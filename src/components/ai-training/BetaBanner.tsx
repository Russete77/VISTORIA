'use client'

import { useState, useEffect } from 'react'
import { useTrainingStats } from '@/hooks/use-training-stats'
import { X, GraduationCap, Sparkles } from 'lucide-react'
import { cn } from '@/lib/utils'

export function BetaBanner() {
  const [isDismissed, setIsDismissed] = useState(false)
  const {
    totalInspections,
    targetMilestone,
    progressPercentage,
    isBetaPhase,
    isLoading,
  } = useTrainingStats()

  // Check localStorage for dismiss state
  useEffect(() => {
    const dismissed = localStorage.getItem('beta-banner-dismissed')
    if (dismissed === 'true') {
      setIsDismissed(true)
    }
  }, [])

  const handleDismiss = () => {
    setIsDismissed(true)
    localStorage.setItem('beta-banner-dismissed', 'true')
  }

  // Don't show if loading, dismissed, or beta phase is over
  if (isLoading || isDismissed || !isBetaPhase) {
    return null
  }

  return (
    <div className={cn(
      'relative bg-gradient-to-r from-amber-50 via-yellow-50 to-amber-50',
      'border-b border-amber-200',
      'animate-in slide-in-from-top duration-300'
    )}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between py-3 gap-4">
          {/* Icon + Message */}
          <div className="flex items-center gap-3 flex-1 min-w-0">
            <div className="flex-shrink-0">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-100 text-amber-600">
                <GraduationCap className="h-5 w-5" />
              </div>
            </div>

            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-amber-900">
                <span className="inline-flex items-center gap-1.5">
                  <Sparkles className="h-4 w-4" />
                  <span>PROGRAMA BETA - App 100% grátis!</span>
                </span>
              </p>
              <p className="text-xs text-amber-700 mt-0.5">
                Ajude-nos a coletar dados para treinar a IA.{' '}
                <span className="font-semibold">
                  {totalInspections.toLocaleString('pt-BR')}/{targetMilestone.toLocaleString('pt-BR')} vistorias
                </span>{' '}
                ({progressPercentage}%)
              </p>
            </div>
          </div>

          {/* Progress bar (hidden on mobile) */}
          <div className="hidden md:block flex-shrink-0 w-32">
            <div className="h-2 bg-amber-200 rounded-full overflow-hidden">
              <div 
                className="h-full bg-gradient-to-r from-amber-500 to-yellow-500 transition-all duration-500"
                style={{ width: `${progressPercentage}%` }}
              />
            </div>
          </div>

          {/* Dismiss button */}
          <button
            onClick={handleDismiss}
            className="flex-shrink-0 p-1 rounded-md text-amber-600 hover:bg-amber-100 transition-colors"
            aria-label="Fechar banner"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  )
}

'use client'

import { useTrainingStats } from '@/hooks/use-training-stats'
import { Card } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Brain, TrendingUp, Loader2, Sparkles } from 'lucide-react'
import { cn } from '@/lib/utils'

interface TrainingMilestoneBadgeProps {
  className?: string
  compact?: boolean
}

export function TrainingMilestoneBadge({ 
  className, 
  compact = false 
}: TrainingMilestoneBadgeProps) {
  const {
    totalInspections,
    targetMilestone,
    progressPercentage,
    daysToMilestone,
    isBetaPhase,
    isLoading,
  } = useTrainingStats()

  if (isLoading) {
    return (
      <Card className={cn('p-4 flex items-center justify-center', className)}>
        <Loader2 className="h-5 w-5 animate-spin text-primary-600" />
      </Card>
    )
  }

  if (!isBetaPhase) {
    // Milestone reached!
    return (
      <Card className={cn(
        'p-6 bg-gradient-to-br from-emerald-50 to-teal-50 border-emerald-200',
        className
      )}>
        <div className="flex items-start gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-100 text-emerald-600">
            <Sparkles className="h-6 w-6" />
          </div>
          <div className="flex-1">
            <h3 className="font-semibold text-emerald-900">
              🎉 Milestone Atingido!
            </h3>
            <p className="mt-1 text-sm text-emerald-700">
              {totalInspections.toLocaleString('pt-BR')} vistorias completadas.
              Nossa IA já está sendo treinada!
            </p>
          </div>
        </div>
      </Card>
    )
  }

  if (compact) {
    return (
      <div className={cn(
        'flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary-50 border border-primary-200',
        className
      )}>
        <Brain className="h-4 w-4 text-primary-600" />
        <span className="text-sm font-medium text-primary-700">
          {totalInspections}/{targetMilestone}
        </span>
        <span className="text-xs text-primary-600">
          {progressPercentage}%
        </span>
      </div>
    )
  }

  return (
    <Card className={cn(
      'p-6 bg-gradient-to-br from-primary-50 to-purple-50 border-primary-200',
      className
    )}>
      <div className="flex items-start gap-4">
        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary-100 text-primary-600">
          <Brain className="h-6 w-6" />
        </div>
        
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between mb-2">
            <h3 className="font-semibold text-neutral-900">
              🧠 Treinando IA
            </h3>
            <span className="text-sm font-medium text-primary-600">
              {progressPercentage}%
            </span>
          </div>

          <p className="text-sm text-neutral-600 mb-3">
            {totalInspections.toLocaleString('pt-BR')} / {targetMilestone.toLocaleString('pt-BR')} vistorias coletadas
          </p>

          <Progress value={progressPercentage} className="h-2 mb-3" />

          <div className="flex items-center gap-2 text-xs text-neutral-500">
            {daysToMilestone !== null && (
              <>
                <TrendingUp className="h-3.5 w-3.5" />
                <span>
                  Estimativa: {daysToMilestone} {daysToMilestone === 1 ? 'dia' : 'dias'} para 3.000
                </span>
              </>
            )}
          </div>

          <p className="mt-3 text-xs text-neutral-600">
            Ajude-nos a chegar em 3.000 vistorias para treinar nossos modelos de IA!
          </p>
        </div>
      </div>
    </Card>
  )
}

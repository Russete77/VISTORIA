'use client'

import { useTrainingStats } from '@/hooks/use-training-stats'
import { Card } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { 
  Brain, 
  TrendingUp, 
  Database, 
  FileText, 
  Loader2,
  CheckCircle2,
  Clock,
  Users
} from 'lucide-react'
import { TrainingMilestoneBadge } from '@/components/ai-training/TrainingMilestoneBadge'

export default function AITrainingPage() {
  const {
    totalInspections,
    totalTrainingPhotos,
    targetMilestone,
    progressPercentage,
    daysToMilestone,
    isBetaPhase,
    isLoading,
  } = useTrainingStats()

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary-600" />
      </div>
    )
  }

  const statsCards = [
    {
      name: 'Vistorias Coletadas',
      value: totalInspections.toLocaleString('pt-BR'),
      target: targetMilestone.toLocaleString('pt-BR'),
      icon: FileText,
      color: 'primary',
    },
    {
      name: 'Fotos Analisadas',
      value: totalTrainingPhotos.toLocaleString('pt-BR'),
      icon: Database,
      color: 'purple',
    },
    {
      name: 'Progresso',
      value: `${progressPercentage}%`,
      icon: TrendingUp,
      color: 'emerald',
    },
    {
      name: 'Estimativa',
      value: daysToMilestone 
        ? `${daysToMilestone} ${daysToMilestone === 1 ? 'dia' : 'dias'}`
        : 'Calculando...',
      icon: Clock,
      color: 'amber',
    },
  ]

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="px-4 sm:px-0">
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-neutral-900">
          🧠 Treinamento de IA
        </h1>
        <p className="mt-2 text-sm sm:text-base text-neutral-600">
          Acompanhe o progresso da coleta de dados para treinar nossos modelos de AI
        </p>
      </div>

      {/* Milestone Badge */}
      <div className="px-4 sm:px-0">
        <TrainingMilestoneBadge />
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 sm:gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 px-4 sm:px-0">
        {statsCards.map((stat) => {
          const Icon = stat.icon
          const colorClasses = {
            primary: 'bg-primary-100 text-primary-600',
            purple: 'bg-purple-100 text-purple-600',
            emerald: 'bg-emerald-100 text-emerald-600',
            amber: 'bg-amber-100 text-amber-600',
          }[stat.color]

          return (
            <Card
              key={stat.name}
              className="border-neutral-200 bg-white p-4 sm:p-6"
            >
              <div className="flex items-center justify-between mb-3">
                <div className={`flex h-10 w-10 sm:h-12 sm:w-12 items-center justify-center rounded-lg ${colorClasses}`}>
                  <Icon className="h-5 w-5 sm:h-6 sm:w-6" />
                </div>
              </div>
              <div className="mt-3 sm:mt-4">
                <p className="text-xs sm:text-sm font-medium text-neutral-600">
                  {stat.name}
                </p>
                <p className="mt-1 text-2xl sm:text-3xl font-bold text-neutral-900">
                  {stat.value}
                  {stat.target && (
                    <span className="text-base sm:text-lg text-neutral-500 font-normal">
                      {' '}/ {stat.target}
                    </span>
                  )}
                </p>
              </div>
            </Card>
          )
        })}
      </div>

      {/* Progress Details */}
      <div className="px-4 sm:px-0">
        <Card className="border-neutral-200 bg-white p-6">
          <h2 className="text-lg font-semibold text-neutral-900 mb-4">
            Progresso Detalhado
          </h2>

          <div className="space-y-6">
            {/* Overall Progress */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-neutral-700">
                  Caminho para 3.000 vistorias
                </span>
                <span className="text-sm font-semibold text-primary-600">
                  {progressPercentage}%
                </span>
              </div>
              <Progress value={progressPercentage} className="h-3" />
              <p className="mt-2 text-xs text-neutral-500">
                {totalInspections.toLocaleString('pt-BR')} de {targetMilestone.toLocaleString('pt-BR')} vistorias completadas
              </p>
            </div>

            {/* Status */}
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="flex items-start gap-3 p-4 rounded-lg bg-neutral-50">
                {isBetaPhase ? (
                  <Clock className="h-5 w-5 text-amber-600 mt-0.5" />
                ) : (
                  <CheckCircle2 className="h-5 w-5 text-emerald-600 mt-0.5" />
                )}
                <div>
                  <p className="text-sm font-medium text-neutral-900">
                    {isBetaPhase ? 'Fase Beta Ativa' : 'Milestone Atingido!'}
                  </p>
                  <p className="text-xs text-neutral-600 mt-1">
                    {isBetaPhase 
                      ? 'App gratuito durante coleta de dados'
                      : 'Treinamento de modelos iniciado'
                    }
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3 p-4 rounded-lg bg-neutral-50">
                <Users className="h-5 w-5 text-primary-600 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-neutral-900">
                    Contribuição Global
                  </p>
                  <p className="text-xs text-neutral-600 mt-1">
                    Todos os usuários estão ajudando a treinar a IA
                  </p>
                </div>
              </div>
            </div>
          </div>
        </Card>
      </div>

      {/* About AI Training */}
      <div className="px-4 sm:px-0">
        <Card className="border-neutral-200 bg-white p-6">
          <h2 className="text-lg font-semibold text-neutral-900 mb-4">
            O que acontece em 3.000 vistorias?
          </h2>

          <div className="space-y-4">
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0 h-6 w-6 rounded-full bg-primary-100 text-primary-600 flex items-center justify-center text-xs font-semibold">
                1
              </div>
              <div>
                <p className="text-sm font-medium text-neutral-900">
                  Fine-tuning ModernBERT
                </p>
                <p className="text-xs text-neutral-600 mt-1">
                  Treinamento de modelo de linguagem para classificação de texto e descrição de problemas
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="flex-shrink-0 h-6 w-6 rounded-full bg-primary-100 text-primary-600 flex items-center justify-center text-xs font-semibold">
                2
              </div>
              <div>
                <p className="text-sm font-medium text-neutral-900">
                  Training YOLOv8
                </p>
                <p className="text-xs text-neutral-600 mt-1">
                  Detecção visual rápida de problemas em imagens (rachaduras, manchas, mofo, etc)
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="flex-shrink-0 h-6 w-6 rounded-full bg-primary-100 text-primary-600 flex items-center justify-center text-xs font-semibold">
                3
              </div>
              <div>
                <p className="text-sm font-medium text-neutral-900">
                  Sistema Híbrido
                </p>
                <p className="text-xs text-neutral-600 mt-1">
                  Combinação de YOLO (detecção) + Claude (análise) + BERT (classificação) para análises ainda mais precisas
                </p>
              </div>
            </div>
          </div>

          <div className="mt-6 p-4 rounded-lg bg-primary-50 border border-primary-200">
            <p className="text-sm text-primary-900">
              <strong>Como você pode ajudar:</strong> Complete mais vistorias e dê feedback sobre as análises da IA. 
              Cada vistoria e cada feedback melhora nossos modelos!
            </p>
          </div>
        </Card>
      </div>
    </div>
  )
}

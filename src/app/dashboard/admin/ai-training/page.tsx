'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { 
  ArrowLeft, 
  Sparkles, 
  Loader2, 
  Download,
  CheckCircle,
  XCircle,
  TrendingUp,
  Database,
  Cpu,
  AlertTriangle,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { toast } from 'sonner'

interface TrainingStats {
  totalSamples: number
  withCorrections: number
  confirmedCorrect: number
  avgRating: number | null
}

interface RecentFeedback {
  id: string
  rating: number
  is_accurate: boolean
  feedback_type: string
  created_at: string
  user_comment?: string
}

export default function AdminAITrainingPage() {
  const [stats, setStats] = useState<TrainingStats | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isExporting, setIsExporting] = useState(false)

  useEffect(() => {
    fetchStats()
  }, [])

  const fetchStats = async () => {
    try {
      const res = await fetch('/api/admin/stats')
      if (!res.ok) throw new Error('Failed to fetch')
      const data = await res.json()
      setStats(data.aiTraining)
    } catch (err) {
      toast.error('Erro ao carregar estatísticas')
    } finally {
      setIsLoading(false)
    }
  }

  const handleExport = async () => {
    setIsExporting(true)
    try {
      toast.info('Exportação em desenvolvimento')
      // TODO: Implement export endpoint
    } finally {
      setIsExporting(false)
    }
  }

  const models = [
    {
      name: 'Claude Vision',
      version: 'claude-sonnet-4-20250514',
      status: 'active',
      description: 'Análise principal de fotos e vídeos',
      icon: Sparkles,
      color: 'bg-green-100 text-green-700',
    },
    {
      name: 'YOLOv8',
      version: 'Planejado',
      status: 'planned',
      description: 'Detecção de objetos (após 3.000 vistorias)',
      icon: Cpu,
      color: 'bg-amber-100 text-amber-700',
    },
    {
      name: 'ModernBERT',
      version: 'Planejado',
      status: 'planned',
      description: 'Classificação de texto (após 3.000 vistorias)',
      icon: Database,
      color: 'bg-blue-100 text-blue-700',
    },
  ]

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-primary-600" />
      </div>
    )
  }

  const progressTo3k = stats ? Math.min((stats.totalSamples / 3000) * 100, 100) : 0

  return (
    <div className="space-y-6 px-4 sm:px-0">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/dashboard/admin">
              <ArrowLeft className="h-5 w-5" />
            </Link>
          </Button>
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-neutral-900 flex items-center gap-2">
              <Sparkles className="h-7 w-7 text-amber-500" />
              Dashboard IA
            </h1>
            <p className="text-neutral-600 mt-1">
              Monitoramento de modelos e dados de treinamento
            </p>
          </div>
        </div>
        <Button onClick={handleExport} disabled={isExporting} variant="outline">
          {isExporting ? (
            <Loader2 className="h-4 w-4 animate-spin mr-2" />
          ) : (
            <Download className="h-4 w-4 mr-2" />
          )}
          Exportar Dados
        </Button>
      </div>

      {/* Progress to 3k */}
      <Card className="border-amber-200 bg-gradient-to-r from-amber-50 to-orange-50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-amber-800">
            <TrendingUp className="h-5 w-5" />
            Progresso para Treinamento Customizado
          </CardTitle>
          <CardDescription className="text-amber-700">
            Meta: 3.000 vistorias para treinar YOLO e BERT com dados próprios
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div className="flex justify-between text-sm font-medium">
              <span className="text-amber-800">{stats?.totalSamples || 0} amostras</span>
              <span className="text-amber-600">{progressTo3k.toFixed(1)}%</span>
            </div>
            <div className="w-full h-4 bg-amber-200 rounded-full overflow-hidden">
              <div 
                className="h-full bg-gradient-to-r from-amber-500 to-orange-500 transition-all duration-500"
                style={{ width: `${progressTo3k}%` }}
              />
            </div>
            <p className="text-sm text-amber-700">
              Faltam <strong>{Math.max(0, 3000 - (stats?.totalSamples || 0))}</strong> amostras para começar o treinamento
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Training Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <Database className="h-8 w-8 text-primary-600 mx-auto mb-2" />
              <p className="text-3xl font-bold text-neutral-900">{stats?.totalSamples || 0}</p>
              <p className="text-sm text-neutral-600">Amostras Totais</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <XCircle className="h-8 w-8 text-amber-500 mx-auto mb-2" />
              <p className="text-3xl font-bold text-neutral-900">{stats?.withCorrections || 0}</p>
              <p className="text-sm text-neutral-600">Com Correções</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <CheckCircle className="h-8 w-8 text-green-500 mx-auto mb-2" />
              <p className="text-3xl font-bold text-neutral-900">{stats?.confirmedCorrect || 0}</p>
              <p className="text-sm text-neutral-600">Confirmadas OK</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <TrendingUp className="h-8 w-8 text-blue-500 mx-auto mb-2" />
              <p className="text-3xl font-bold text-neutral-900">
                {stats?.avgRating?.toFixed(1) || '-'}
              </p>
              <p className="text-sm text-neutral-600">Rating Médio</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Model Status */}
      <Card>
        <CardHeader>
          <CardTitle>Status dos Modelos</CardTitle>
          <CardDescription>
            Visão geral dos modelos de IA utilizados
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {models.map((model) => (
              <div 
                key={model.name}
                className="flex items-center justify-between p-4 rounded-lg border border-neutral-200"
              >
                <div className="flex items-center gap-4">
                  <div className={`p-3 rounded-full ${model.color}`}>
                    <model.icon className="h-5 w-5" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-neutral-900">{model.name}</h4>
                    <p className="text-sm text-neutral-600">{model.description}</p>
                  </div>
                </div>
                <div className="text-right">
                  <Badge className={model.color}>
                    {model.status === 'active' ? '✓ Ativo' : '⏳ Planejado'}
                  </Badge>
                  <p className="text-xs text-neutral-500 mt-1">{model.version}</p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Algorithm Info */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-amber-500" />
            Próximos Passos
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3 text-sm">
            <div className="flex items-start gap-3">
              <div className="w-6 h-6 rounded-full bg-primary-100 text-primary-700 flex items-center justify-center text-xs font-bold shrink-0">1</div>
              <div>
                <p className="font-medium text-neutral-900">Coletar 3.000+ amostras</p>
                <p className="text-neutral-600">Cada vistoria gera dados de treinamento automaticamente</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-6 h-6 rounded-full bg-neutral-100 text-neutral-500 flex items-center justify-center text-xs font-bold shrink-0">2</div>
              <div>
                <p className="font-medium text-neutral-900">Treinar YOLOv8 para detecção</p>
                <p className="text-neutral-600">Detectar automaticamente problemas antes do Claude</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-6 h-6 rounded-full bg-neutral-100 text-neutral-500 flex items-center justify-center text-xs font-bold shrink-0">3</div>
              <div>
                <p className="font-medium text-neutral-900">Fine-tunar ModernBERT</p>
                <p className="text-neutral-600">Classificar severidade e categorias de problemas</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

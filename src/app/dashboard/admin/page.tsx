'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { 
  Users, 
  FileText, 
  TrendingUp, 
  Sparkles, 
  Activity,
  ArrowRight,
  Loader2,
  Shield,
  Calendar,
  BarChart3,
} from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'

interface AdminStats {
  users: {
    total: number
    newThisWeek: number
    byTier: Record<string, number>
  }
  inspections: {
    total: number
    today: number
  }
  aiTraining: {
    totalSamples: number
    withCorrections: number
    confirmedCorrect: number
    avgRating: number | null
  }
  heatmap: Record<string, Record<number, number>>
  generatedAt: string
}

export default function AdminDashboardPage() {
  const [stats, setStats] = useState<AdminStats | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchStats()
  }, [])

  const fetchStats = async () => {
    try {
      const res = await fetch('/api/admin/stats')
      if (res.status === 403) {
        setError('Acesso negado. Você não tem permissão de administrador.')
        return
      }
      if (!res.ok) throw new Error('Failed to fetch stats')
      const data = await res.json()
      setStats(data)
    } catch (err) {
      setError('Erro ao carregar estatísticas')
      console.error(err)
    } finally {
      setIsLoading(false)
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-primary-600" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <Shield className="h-16 w-16 text-red-500 mb-4" />
        <h2 className="text-2xl font-bold text-neutral-900 mb-2">Acesso Negado</h2>
        <p className="text-neutral-600">{error}</p>
        <Button asChild className="mt-4">
          <Link href="/dashboard">Voltar ao Dashboard</Link>
        </Button>
      </div>
    )
  }

  const tierLabels: Record<string, string> = {
    free: 'Gratuito',
    pay_per_use: 'Pay Per Use',
    professional: 'Profissional',
    business: 'Business',
    enterprise: 'Enterprise',
  }

  return (
    <div className="space-y-6 px-4 sm:px-0">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-neutral-900 flex items-center gap-3">
            <Shield className="h-8 w-8 text-primary-600" />
            Painel Admin
          </h1>
          <p className="text-neutral-600 mt-1">
            Gerencie usuários, monitore uso e acompanhe o treinamento da IA
          </p>
        </div>
        <Badge variant="outline" className="self-start sm:self-auto">
          Atualizado: {stats?.generatedAt ? new Date(stats.generatedAt).toLocaleTimeString('pt-BR') : '-'}
        </Badge>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-neutral-600">Total Usuários</p>
                <p className="text-3xl font-bold text-neutral-900">{stats?.users.total || 0}</p>
                <p className="text-xs text-green-600 mt-1">
                  +{stats?.users.newThisWeek || 0} esta semana
                </p>
              </div>
              <Users className="h-10 w-10 text-primary-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-neutral-600">Total Vistorias</p>
                <p className="text-3xl font-bold text-neutral-900">{stats?.inspections.total || 0}</p>
                <p className="text-xs text-green-600 mt-1">
                  {stats?.inspections.today || 0} hoje
                </p>
              </div>
              <FileText className="h-10 w-10 text-emerald-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-neutral-600">Amostras IA</p>
                <p className="text-3xl font-bold text-neutral-900">{stats?.aiTraining.totalSamples || 0}</p>
                <p className="text-xs text-amber-600 mt-1">
                  {stats?.aiTraining.withCorrections || 0} corrigidas
                </p>
              </div>
              <Sparkles className="h-10 w-10 text-amber-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-neutral-600">Rating IA</p>
                <p className="text-3xl font-bold text-neutral-900">
                  {stats?.aiTraining.avgRating?.toFixed(1) || '-'}
                </p>
                <p className="text-xs text-neutral-500 mt-1">
                  de 5.0
                </p>
              </div>
              <TrendingUp className="h-10 w-10 text-blue-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Link href="/dashboard/admin/users" className="block">
          <Card className="hover:border-primary-300 transition-colors cursor-pointer h-full">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Users className="h-5 w-5 text-primary-600" />
                Gestão de Usuários
              </CardTitle>
              <CardDescription>
                Editar créditos, planos e permissões
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div className="flex gap-2 flex-wrap">
                  {stats?.users.byTier && Object.entries(stats.users.byTier).slice(0, 3).map(([tier, count]) => (
                    <Badge key={tier} variant="outline" className="text-xs">
                      {tierLabels[tier] || tier}: {count}
                    </Badge>
                  ))}
                </div>
                <ArrowRight className="h-5 w-5 text-neutral-400" />
              </div>
            </CardContent>
          </Card>
        </Link>

        <Link href="/dashboard/admin/analytics" className="block">
          <Card className="hover:border-primary-300 transition-colors cursor-pointer h-full">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <BarChart3 className="h-5 w-5 text-emerald-600" />
                Analytics
              </CardTitle>
              <CardDescription>
                Heatmap de uso e métricas de retenção
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <span className="text-sm text-neutral-600">
                  Ver termômetro de horários
                </span>
                <ArrowRight className="h-5 w-5 text-neutral-400" />
              </div>
            </CardContent>
          </Card>
        </Link>

        <Link href="/dashboard/admin/ai-training" className="block">
          <Card className="hover:border-primary-300 transition-colors cursor-pointer h-full">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Sparkles className="h-5 w-5 text-amber-500" />
                Dashboard IA
              </CardTitle>
              <CardDescription>
                Status dos modelos e dados de treinamento
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div className="flex gap-2">
                  <Badge className="bg-green-100 text-green-700">Claude ✓</Badge>
                  <Badge className="bg-amber-100 text-amber-700">YOLO ⏳</Badge>
                </div>
                <ArrowRight className="h-5 w-5 text-neutral-400" />
              </div>
            </CardContent>
          </Card>
        </Link>
      </div>

      {/* Usage Heatmap Preview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5 text-primary-600" />
            Termômetro de Uso (Últimos 7 dias)
          </CardTitle>
          <CardDescription>
            Horários de pico de criação de vistorias
          </CardDescription>
        </CardHeader>
        <CardContent>
          {stats?.heatmap && (
            <div className="overflow-x-auto">
              <div className="min-w-[600px]">
                {/* Hours header */}
                <div className="flex mb-1">
                  <div className="w-12 shrink-0" />
                  {[6, 9, 12, 15, 18, 21].map(h => (
                    <div key={h} className="flex-1 text-center text-xs text-neutral-500">
                      {h}h
                    </div>
                  ))}
                </div>
                
                {/* Days rows */}
                {Object.entries(stats.heatmap).map(([day, hours]) => (
                  <div key={day} className="flex items-center mb-1">
                    <div className="w-12 text-xs text-neutral-600 shrink-0">{day}</div>
                    <div className="flex-1 flex gap-[2px]">
                      {Object.entries(hours).map(([hour, count]) => {
                        const intensity = Math.min(count / 5, 1) // Normalize to max 5
                        return (
                          <div
                            key={hour}
                            className="flex-1 h-4 rounded-sm"
                            style={{
                              backgroundColor: intensity === 0 
                                ? '#f3f4f6' 
                                : `rgba(79, 70, 229, ${0.2 + intensity * 0.8})`,
                            }}
                            title={`${day} ${hour}h: ${count} vistorias`}
                          />
                        )
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
          <div className="flex items-center justify-between mt-4 text-xs text-neutral-500">
            <span>Menos</span>
            <div className="flex gap-1">
              <div className="w-3 h-3 rounded-sm bg-neutral-100" />
              <div className="w-3 h-3 rounded-sm bg-primary-200" />
              <div className="w-3 h-3 rounded-sm bg-primary-400" />
              <div className="w-3 h-3 rounded-sm bg-primary-600" />
            </div>
            <span>Mais</span>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

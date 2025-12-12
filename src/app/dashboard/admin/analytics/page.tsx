'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { 
  ArrowLeft, 
  BarChart3, 
  Loader2, 
  TrendingUp,
  Users,
  Clock,
  Camera,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { toast } from 'sonner'

interface HeatmapData {
  [day: string]: {
    [hour: number]: number
  }
}

interface AnalyticsStats {
  heatmap: HeatmapData
  users: {
    total: number
    newThisWeek: number
    byTier: Record<string, number>
  }
  inspections: {
    total: number
    today: number
  }
}

export default function AdminAnalyticsPage() {
  const [stats, setStats] = useState<AnalyticsStats | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    fetchStats()
  }, [])

  const fetchStats = async () => {
    try {
      const res = await fetch('/api/admin/stats')
      if (!res.ok) throw new Error('Failed to fetch')
      const data = await res.json()
      setStats(data)
    } catch (err) {
      toast.error('Erro ao carregar estatísticas')
    } finally {
      setIsLoading(false)
    }
  }

  const days = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb']
  const hours = Array.from({ length: 24 }, (_, i) => i)

  // Find max value for normalization
  const getMaxValue = () => {
    if (!stats?.heatmap) return 1
    let max = 0
    Object.values(stats.heatmap).forEach(dayData => {
      Object.values(dayData).forEach(count => {
        if (count > max) max = count
      })
    })
    return max || 1
  }

  const maxValue = getMaxValue()

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-primary-600" />
      </div>
    )
  }

  return (
    <div className="space-y-6 px-4 sm:px-0">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/dashboard/admin">
            <ArrowLeft className="h-5 w-5" />
          </Link>
        </Button>
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-neutral-900 flex items-center gap-2">
            <BarChart3 className="h-7 w-7 text-emerald-600" />
            Analytics
          </h1>
          <p className="text-neutral-600 mt-1">
            Métricas de uso e comportamento de usuários
          </p>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-neutral-600">Usuários</p>
                <p className="text-2xl font-bold text-neutral-900">{stats?.users.total || 0}</p>
              </div>
              <Users className="h-8 w-8 text-primary-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-neutral-600">Novos (7d)</p>
                <p className="text-2xl font-bold text-green-600">+{stats?.users.newThisWeek || 0}</p>
              </div>
              <TrendingUp className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-neutral-600">Vistorias Hoje</p>
                <p className="text-2xl font-bold text-neutral-900">{stats?.inspections.today || 0}</p>
              </div>
              <Camera className="h-8 w-8 text-amber-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-neutral-600">Média/Dia</p>
                <p className="text-2xl font-bold text-neutral-900">
                  {stats?.inspections.total ? (stats.inspections.total / 7).toFixed(1) : '0'}
                </p>
              </div>
              <Clock className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Full Heatmap */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5 text-primary-600" />
            Termômetro de Uso (Últimos 7 dias)
          </CardTitle>
          <CardDescription>
            Visualize os horários de maior atividade no sistema
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <div className="min-w-[700px]">
              {/* Hours header */}
              <div className="flex mb-2">
                <div className="w-14 shrink-0" />
                {hours.map(h => (
                  <div 
                    key={h} 
                    className="flex-1 text-center text-xs text-neutral-500"
                    style={{ minWidth: '24px' }}
                  >
                    {h % 3 === 0 ? `${h}h` : ''}
                  </div>
                ))}
              </div>
              
              {/* Days rows */}
              {days.map((day) => (
                <div key={day} className="flex items-center mb-1">
                  <div className="w-14 text-sm text-neutral-700 font-medium shrink-0">{day}</div>
                  <div className="flex-1 flex gap-[2px]">
                    {hours.map((hour) => {
                      const count = stats?.heatmap?.[day]?.[hour] || 0
                      const intensity = count / maxValue
                      
                      return (
                        <div
                          key={hour}
                          className="flex-1 h-6 rounded-sm cursor-pointer transition-transform hover:scale-110 hover:z-10"
                          style={{
                            minWidth: '24px',
                            backgroundColor: intensity === 0 
                              ? '#f3f4f6' 
                              : `rgba(79, 70, 229, ${0.15 + intensity * 0.85})`,
                          }}
                          title={`${day} às ${hour}h: ${count} vistoria${count !== 1 ? 's' : ''}`}
                        />
                      )
                    })}
                  </div>
                </div>
              ))}
              
              {/* Legend */}
              <div className="flex items-center justify-between mt-6 px-14">
                <span className="text-xs text-neutral-500">Menos atividade</span>
                <div className="flex gap-1">
                  <div className="w-4 h-4 rounded-sm bg-neutral-100" title="0" />
                  <div className="w-4 h-4 rounded-sm bg-primary-100" title="Baixo" />
                  <div className="w-4 h-4 rounded-sm bg-primary-300" title="Médio" />
                  <div className="w-4 h-4 rounded-sm bg-primary-500" title="Alto" />
                  <div className="w-4 h-4 rounded-sm bg-primary-700" title="Muito alto" />
                </div>
                <span className="text-xs text-neutral-500">Mais atividade</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Users by Tier */}
      <Card>
        <CardHeader>
          <CardTitle>Distribuição por Plano</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
            {Object.entries(stats?.users.byTier || {}).map(([tier, count]) => {
              const labels: Record<string, { name: string; color: string }> = {
                free: { name: 'Gratuito', color: 'bg-neutral-100 text-neutral-800' },
                pay_per_use: { name: 'Pay Per Use', color: 'bg-blue-100 text-blue-800' },
                professional: { name: 'Profissional', color: 'bg-purple-100 text-purple-800' },
                business: { name: 'Business', color: 'bg-amber-100 text-amber-800' },
                enterprise: { name: 'Enterprise', color: 'bg-green-100 text-green-800' },
              }
              
              const label = labels[tier] || { name: tier, color: 'bg-neutral-100 text-neutral-700' }
              const total = stats?.users.total || 1
              const percentage = ((count as number) / total * 100).toFixed(1)
              
              return (
                <div 
                  key={tier}
                  className={`p-4 rounded-lg ${label.color}`}
                >
                  <p className="text-2xl font-bold">{count}</p>
                  <p className="text-sm font-medium">{label.name}</p>
                  <p className="text-xs opacity-75">{percentage}%</p>
                </div>
              )
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

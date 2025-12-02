'use client'

import { useState, useEffect } from 'react'
import { Building2, ClipboardCheck, FileText, TrendingUp, Plus, ArrowRight, Loader2, GitCompare } from 'lucide-react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { InspectionBadge } from '@/components/vistoria'
import { useProperties } from '@/hooks/use-properties'
import { useInspections } from '@/hooks/use-inspections'
import { useComparisons } from '@/hooks/use-comparisons'
import type { Inspection } from '@/types/database'

interface DashboardStats {
  totalProperties: number
  inspectionsThisMonth: number
  totalReports: number
  completionRate: number
}

export default function DashboardPage() {
  const { properties, isLoading: isLoadingProperties } = useProperties()
  const { inspections, isLoading: isLoadingInspections } = useInspections()
  const { comparisons, isLoading: isLoadingComparisons } = useComparisons()
  const [stats, setStats] = useState<DashboardStats>({
    totalProperties: 0,
    inspectionsThisMonth: 0,
    totalReports: 0,
    completionRate: 0,
  })

  useEffect(() => {
    if (!isLoadingProperties && !isLoadingInspections) {
      calculateStats()
    }
  }, [properties, inspections, isLoadingProperties, isLoadingInspections])

  const calculateStats = () => {
    // Total properties
    const totalProperties = properties.length

    // Inspections this month
    const now = new Date()
    const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
    const inspectionsThisMonth = inspections.filter(
      (i) => new Date(i.created_at) >= firstDayOfMonth
    ).length

    // Total reports (completed or signed inspections with report_url)
    const totalReports = inspections.filter(
      (i) => (i.status === 'completed' || i.status === 'signed') && i.report_url
    ).length

    // Completion rate
    const completedInspections = inspections.filter(
      (i) => i.status === 'completed' || i.status === 'signed'
    ).length
    const completionRate =
      inspections.length > 0
        ? Math.round((completedInspections / inspections.length) * 100)
        : 0

    setStats({
      totalProperties,
      inspectionsThisMonth,
      totalReports,
      completionRate,
    })
  }

  // Get recent inspections (last 4)
  const recentInspections = inspections
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    .slice(0, 4)

  // Get recent comparisons (last 3)
  const recentComparisons = comparisons
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    .slice(0, 3)

  const statsConfig = [
    {
      name: 'Total de Imóveis',
      value: stats.totalProperties.toString(),
      icon: Building2,
    },
    {
      name: 'Vistorias Este Mês',
      value: stats.inspectionsThisMonth.toString(),
      icon: ClipboardCheck,
    },
    {
      name: 'Laudos Gerados',
      value: stats.totalReports.toString(),
      icon: FileText,
    },
    {
      name: 'Taxa de Conclusão',
      value: `${stats.completionRate}%`,
      icon: TrendingUp,
    },
  ]

  const isLoading = isLoadingProperties || isLoadingInspections

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary-600" />
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between px-4 sm:px-0">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-neutral-900">
            Dashboard
          </h1>
          <p className="mt-2 text-sm sm:text-base text-neutral-600">
            Bem-vindo de volta! Aqui está um resumo das suas atividades.
          </p>
        </div>
        <Link href="/dashboard/inspections/new" className="w-full sm:w-auto">
          <Button size="lg" className="w-full sm:w-auto">
            <Plus className="mr-2 h-5 w-5" />
            Nova Vistoria
          </Button>
        </Link>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 sm:gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 px-4 sm:px-0">
        {statsConfig.map((stat) => {
          const Icon = stat.icon
          return (
            <Card
              key={stat.name}
              className="border-neutral-200 bg-white p-4 sm:p-6 transition-all hover:border-primary-300 hover:shadow-md"
            >
              <div className="flex items-center justify-between mb-3">
                <div className="flex h-10 w-10 sm:h-12 sm:w-12 items-center justify-center rounded-lg bg-primary-100 text-primary-600">
                  <Icon className="h-5 w-5 sm:h-6 sm:w-6" />
                </div>
              </div>
              <div className="mt-3 sm:mt-4">
                <p className="text-xs sm:text-sm font-medium text-neutral-600">
                  {stat.name}
                </p>
                <p className="mt-1 text-2xl sm:text-3xl font-bold text-neutral-900">
                  {stat.value}
                </p>
              </div>
            </Card>
          )
        })}
      </div>

      {/* Recent Inspections */}
      <div className="px-4 sm:px-0">
        <div className="mb-4 sm:mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h2 className="text-lg sm:text-xl font-semibold text-neutral-900">
              Vistorias Recentes
            </h2>
            <p className="mt-1 text-xs sm:text-sm text-neutral-600">
              Acompanhe o status das suas vistorias
            </p>
          </div>
          <Link href="/dashboard/inspections" className="w-full sm:w-auto">
            <Button variant="ghost" size="sm" className="w-full sm:w-auto">
              Ver Todas
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </Link>
        </div>

        <Card className="overflow-hidden border-neutral-200 bg-white">
          {/* Table Header */}
          <div className="hidden border-b border-neutral-200 bg-neutral-50 px-6 py-3 md:grid md:grid-cols-12 md:gap-4">
            <div className="col-span-4 text-xs font-semibold uppercase tracking-wide text-neutral-700">
              Imóvel
            </div>
            <div className="col-span-4 text-xs font-semibold uppercase tracking-wide text-neutral-700">
              Endereço
            </div>
            <div className="col-span-2 text-xs font-semibold uppercase tracking-wide text-neutral-700">
              Status
            </div>
            <div className="col-span-2 text-xs font-semibold uppercase tracking-wide text-neutral-700">
              Data
            </div>
          </div>

          {/* Table Body */}
          <div className="divide-y divide-neutral-200">
            {recentInspections.length === 0 ? (
              <div className="p-12 text-center">
                <p className="text-neutral-600">Nenhuma vistoria criada ainda</p>
                <Button asChild className="mt-4">
                  <Link href="/dashboard/inspections/new">
                    <Plus className="mr-2 h-4 w-4" />
                    Criar Primeira Vistoria
                  </Link>
                </Button>
              </div>
            ) : (
              recentInspections.map((inspection) => {
                const property = properties.find((p) => p.id === inspection.property_id)
                return (
                  <Link
                    key={inspection.id}
                    href={`/dashboard/inspections/${inspection.id}`}
                    className="block transition-colors hover:bg-neutral-50"
                  >
                    <div className="grid gap-4 px-6 py-4 md:grid-cols-12">
                      {/* Property Name */}
                      <div className="col-span-12 md:col-span-4">
                        <p className="font-medium text-neutral-900">
                          {property?.name || 'Imóvel não encontrado'}
                        </p>
                        <p className="mt-0.5 text-sm text-neutral-600 md:hidden">
                          {property?.address || ''}
                        </p>
                      </div>

                      {/* Address - Hidden on mobile */}
                      <div className="col-span-4 hidden md:block">
                        <p className="text-sm text-neutral-600">
                          {property?.address || ''}
                        </p>
                      </div>

                      {/* Status */}
                      <div className="col-span-6 md:col-span-2">
                        <InspectionBadge status={inspection.status} />
                      </div>

                      {/* Date */}
                      <div className="col-span-6 md:col-span-2">
                        <p className="text-sm text-neutral-600">
                          {new Intl.DateTimeFormat('pt-BR', {
                            day: '2-digit',
                            month: 'short',
                            year: 'numeric',
                          }).format(new Date(inspection.created_at))}
                        </p>
                      </div>
                    </div>
                  </Link>
                )
              })
            )}
          </div>
        </Card>
      </div>

      {/* Recent Comparisons */}
      <div className="px-4 sm:px-0">
        <div className="mb-4 sm:mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h2 className="text-lg sm:text-xl font-semibold text-neutral-900">
              Comparações Recentes
            </h2>
            <p className="mt-1 text-xs sm:text-sm text-neutral-600">
              Últimas comparações entre vistorias de entrada e saída
            </p>
          </div>
          <Link href="/dashboard/comparisons" className="w-full sm:w-auto">
            <Button variant="ghost" size="sm" className="w-full sm:w-auto">
              Ver Todas
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </Link>
        </div>

        <Card className="border-neutral-200 bg-white p-6">
          {recentComparisons.length === 0 ? (
            <div className="text-center py-8">
              <GitCompare className="h-12 w-12 text-neutral-400 mx-auto mb-3" />
              <p className="text-neutral-600 mb-4">Nenhuma comparação criada ainda</p>
              <Button asChild>
                <Link href="/dashboard/comparisons/new">
                  <Plus className="mr-2 h-4 w-4" />
                  Criar Primeira Comparação
                </Link>
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {recentComparisons.map((comparison) => {
                const property = properties.find((p) => p.id === comparison.property_id)
                const statusConfig = {
                  pending: { label: 'Pendente', color: 'bg-gray-100 text-gray-700' },
                  processing: { label: 'Processando', color: 'bg-blue-100 text-blue-700' },
                  completed: { label: 'Concluída', color: 'bg-green-100 text-green-700' },
                  failed: { label: 'Falhou', color: 'bg-red-100 text-red-700' },
                }
                const status = statusConfig[comparison.status]

                return (
                  <Link
                    key={comparison.id}
                    href={`/dashboard/comparisons/${comparison.id}`}
                    className="block border rounded-lg p-4 hover:bg-neutral-50 transition-colors"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="font-medium text-neutral-900">
                        {property?.name || 'Imóvel não encontrado'}
                      </h3>
                      <Badge className={status.color} variant="secondary">
                        {status.label}
                      </Badge>
                    </div>
                    <p className="text-sm text-neutral-600 mb-2">
                      {property?.address || ''}
                    </p>
                    {comparison.status === 'completed' && (
                      <div className="flex gap-4 text-sm">
                        <span className="text-neutral-600">
                          <strong className="text-red-600">{comparison.new_damages}</strong> danos novos
                        </span>
                        <span className="text-neutral-600">
                          Custo: <strong className="text-orange-600">R$ {(comparison.estimated_repair_cost || 0).toFixed(2)}</strong>
                        </span>
                      </div>
                    )}
                  </Link>
                )
              })}
            </div>
          )}
        </Card>
      </div>

      {/* Quick Actions */}
      <div className="px-4 sm:px-0">
        <h2 className="mb-4 sm:mb-6 text-lg sm:text-xl font-semibold text-neutral-900">
          Ações Rápidas
        </h2>
        <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
          <Link href="/dashboard/properties/new">
            <Card className="group cursor-pointer border-neutral-200 bg-white p-4 sm:p-6 transition-all hover:border-primary-300 hover:shadow-md">
              <Building2 className="mb-3 h-7 w-7 sm:h-8 sm:w-8 text-primary-600" />
              <h3 className="text-sm sm:text-base font-semibold text-neutral-900">
                Cadastrar Imóvel
              </h3>
              <p className="mt-1 text-xs sm:text-sm text-neutral-600">
                Adicione um novo imóvel ao sistema
              </p>
            </Card>
          </Link>

          <Link href="/dashboard/inspections/new">
            <Card className="group cursor-pointer border-neutral-200 bg-white p-4 sm:p-6 transition-all hover:border-primary-300 hover:shadow-md">
              <ClipboardCheck className="mb-3 h-7 w-7 sm:h-8 sm:w-8 text-primary-600" />
              <h3 className="text-sm sm:text-base font-semibold text-neutral-900">
                Iniciar Vistoria
              </h3>
              <p className="mt-1 text-xs sm:text-sm text-neutral-600">
                Comece uma nova vistoria agora
              </p>
            </Card>
          </Link>

          <Link href="/dashboard/comparisons/new">
            <Card className="group cursor-pointer border-neutral-200 bg-white p-4 sm:p-6 transition-all hover:border-primary-300 hover:shadow-md">
              <GitCompare className="mb-3 h-7 w-7 sm:h-8 sm:w-8 text-primary-600" />
              <h3 className="text-sm sm:text-base font-semibold text-neutral-900">
                Criar Comparação
              </h3>
              <p className="mt-1 text-xs sm:text-sm text-neutral-600">
                Compare entrada e saída com IA
              </p>
            </Card>
          </Link>

          <Link href="/dashboard/reports">
            <Card className="group cursor-pointer border-neutral-200 bg-white p-4 sm:p-6 transition-all hover:border-primary-300 hover:shadow-md">
              <FileText className="mb-3 h-7 w-7 sm:h-8 sm:w-8 text-primary-600" />
              <h3 className="text-sm sm:text-base font-semibold text-neutral-900">
                Ver Relatórios
              </h3>
              <p className="mt-1 text-xs sm:text-sm text-neutral-600">
                Acesse relatórios e análises
              </p>
            </Card>
          </Link>
        </div>
      </div>
    </div>
  )
}

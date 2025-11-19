'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Plus, Search, Download, ArrowRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { InspectionBadge } from '@/components/vistoria/InspectionBadge'
import { InspectionRowSkeleton } from '@/components/vistoria/InspectionRowSkeleton'
import { StatCardSkeleton } from '@/components/vistoria/StatCardSkeleton'
import { useInspections } from '@/hooks/use-inspections'
import { INSPECTION_TYPES } from '@/lib/constants'
import type { InspectionType, InspectionStatus } from '@/types/database'

/**
 * Inspections Page - VistorIA Pro
 * Lists all inspections with search and filters
 */

export default function InspectionsPage() {
  const { inspections, isLoading, error, fetchInspections } = useInspections()
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<InspectionStatus | 'all'>('all')
  const [typeFilter, setTypeFilter] = useState<InspectionType | 'all'>('all')

  // Filter inspections
  const filteredInspections = inspections.filter((inspection) => {
    const matchesSearch =
      search === '' ||
      (inspection.inspector_name?.toLowerCase() || '').includes(search.toLowerCase()) ||
      (inspection.tenant_name?.toLowerCase() || '').includes(search.toLowerCase()) ||
      (inspection.landlord_name?.toLowerCase() || '').includes(search.toLowerCase())

    const matchesStatus = statusFilter === 'all' || inspection.status === statusFilter
    const matchesType = typeFilter === 'all' || inspection.type === typeFilter

    return matchesSearch && matchesStatus && matchesType
  })

  // Group by status for stats
  const stats = {
    total: inspections.length,
    draft: inspections.filter((i) => i.status === 'draft').length,
    in_progress: inspections.filter((i) => i.status === 'in_progress').length,
    completed: inspections.filter((i) => i.status === 'completed').length,
    signed: inspections.filter((i) => i.status === 'signed').length,
  }

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-neutral-900 mb-2">
            Vistorias
          </h1>
          <p className="text-neutral-600">
            Gerencie todas as suas vistorias e laudos
          </p>
        </div>
        <Button asChild size="lg">
          <Link href="/dashboard/inspections/new">
            <Plus className="mr-2 h-5 w-5" />
            Nova Vistoria
          </Link>
        </Button>
      </div>

      {/* Stats Overview */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <Card className="p-4 border-neutral-200 bg-white">
          <p className="text-sm font-medium text-neutral-600">Total</p>
          <p className="mt-2 text-2xl font-bold text-neutral-900">{stats.total}</p>
        </Card>
        <Card className="p-4 border-neutral-200 bg-white">
          <p className="text-sm font-medium text-neutral-600">Rascunhos</p>
          <p className="mt-2 text-2xl font-bold text-gray-700">{stats.draft}</p>
        </Card>
        <Card className="p-4 border-neutral-200 bg-white">
          <p className="text-sm font-medium text-neutral-600">Em Andamento</p>
          <p className="mt-2 text-2xl font-bold text-blue-700">{stats.in_progress}</p>
        </Card>
        <Card className="p-4 border-neutral-200 bg-white">
          <p className="text-sm font-medium text-neutral-600">Concluídas</p>
          <p className="mt-2 text-2xl font-bold text-green-700">{stats.completed}</p>
        </Card>
        <Card className="p-4 border-neutral-200 bg-white">
          <p className="text-sm font-medium text-neutral-600">Assinadas</p>
          <p className="mt-2 text-2xl font-bold text-purple-700">{stats.signed}</p>
        </Card>
      </div>

      {/* Filters Bar */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
        {/* Search */}
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-500" />
          <Input
            type="search"
            placeholder="Buscar por nome de inspetor, inquilino ou proprietário..."
            className="pl-10"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        {/* Status Filter */}
        <Select value={statusFilter} onValueChange={(value) => setStatusFilter(value as InspectionStatus | 'all')}>
          <SelectTrigger className="w-full sm:w-[180px]">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos os Status</SelectItem>
            <SelectItem value="draft">Rascunho</SelectItem>
            <SelectItem value="in_progress">Em Andamento</SelectItem>
            <SelectItem value="completed">Concluída</SelectItem>
            <SelectItem value="signed">Assinada</SelectItem>
          </SelectContent>
        </Select>

        {/* Type Filter */}
        <Select value={typeFilter} onValueChange={(value) => setTypeFilter(value as InspectionType | 'all')}>
          <SelectTrigger className="w-full sm:w-[180px]">
            <SelectValue placeholder="Tipo" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos os Tipos</SelectItem>
            <SelectItem value="move_in">Entrada</SelectItem>
            <SelectItem value="move_out">Saída</SelectItem>
            <SelectItem value="periodic">Periódica</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Loading State */}
      {isLoading && (
        <>
          {/* Stats Skeleton */}
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
            {[1, 2, 3, 4, 5].map((i) => (
              <StatCardSkeleton key={i} />
            ))}
          </div>

          {/* Table Skeleton */}
          <Card className="overflow-hidden border-neutral-200 bg-white">
            <div className="divide-y divide-neutral-200">
              {[1, 2, 3, 4, 5].map((i) => (
                <InspectionRowSkeleton key={i} />
              ))}
            </div>
          </Card>
        </>
      )}

      {/* Error State */}
      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
          <p className="font-semibold">Erro ao carregar vistorias</p>
          <p className="text-sm mt-1">{error}</p>
          <Button
            variant="outline"
            size="sm"
            className="mt-3"
            onClick={() => fetchInspections()}
          >
            Tentar novamente
          </Button>
        </div>
      )}

      {/* Empty State */}
      {!isLoading && !error && filteredInspections.length === 0 && (
        <div className="text-center py-12">
          <div className="inline-flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-primary-50 to-primary-100 mb-4">
            <Plus className="h-10 w-10 text-primary-600" />
          </div>
          <h3 className="text-xl font-semibold text-neutral-900 mb-2">
            {inspections.length === 0
              ? 'Nenhuma vistoria cadastrada'
              : 'Nenhuma vistoria encontrada'}
          </h3>
          <p className="text-neutral-600 mb-6 max-w-md mx-auto">
            {inspections.length === 0
              ? 'Crie sua primeira vistoria e aproveite a análise inteligente com IA para detectar problemas automaticamente'
              : 'Tente ajustar os filtros de busca para encontrar a vistoria desejada'}
          </p>
          {inspections.length === 0 && (
            <Button asChild>
              <Link href="/dashboard/inspections/new">
                <Plus className="mr-2 h-4 w-4" />
                Criar Primeira Vistoria
              </Link>
            </Button>
          )}
        </div>
      )}

      {/* Inspections Table/List */}
      {!isLoading && !error && filteredInspections.length > 0 && (
        <>
          <Card className="overflow-hidden border-neutral-200 bg-white">
            {/* Table Header - Desktop */}
            <div className="hidden border-b border-neutral-200 bg-neutral-50 px-6 py-3 md:grid md:grid-cols-12 md:gap-4">
              <div className="col-span-2 text-xs font-semibold uppercase tracking-wide text-neutral-700">
                Tipo
              </div>
              <div className="col-span-3 text-xs font-semibold uppercase tracking-wide text-neutral-700">
                Inquilino/Inspetor
              </div>
              <div className="col-span-2 text-xs font-semibold uppercase tracking-wide text-neutral-700">
                Status
              </div>
              <div className="col-span-2 text-xs font-semibold uppercase tracking-wide text-neutral-700">
                Problemas
              </div>
              <div className="col-span-2 text-xs font-semibold uppercase tracking-wide text-neutral-700">
                Data
              </div>
              <div className="col-span-1 text-xs font-semibold uppercase tracking-wide text-neutral-700">
                Ações
              </div>
            </div>

            {/* Table Body */}
            <div className="divide-y divide-neutral-200">
              {filteredInspections.map((inspection) => {
                const typeInfo = INSPECTION_TYPES[inspection.type]
                const canContinue = inspection.status === 'draft' || inspection.status === 'in_progress'
                const canDownload = inspection.status === 'completed' || inspection.status === 'signed'

                return (
                  <div
                    key={inspection.id}
                    className="grid gap-4 px-6 py-4 md:grid-cols-12 hover:bg-neutral-50 transition-colors"
                  >
                    {/* Type */}
                    <div className="col-span-12 md:col-span-2">
                      <div className="flex items-center gap-2">
                        <span className="text-lg">{typeInfo.icon}</span>
                        <div>
                          <p className="font-medium text-neutral-900">{typeInfo.label}</p>
                          <p className="text-xs text-neutral-500 md:hidden">
                            {inspection.tenant_name || inspection.inspector_name || 'Sem nome'}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Names - Hidden on mobile */}
                    <div className="col-span-3 hidden md:block">
                      <p className="text-sm font-medium text-neutral-900">
                        {inspection.tenant_name || 'Sem inquilino'}
                      </p>
                      <p className="text-xs text-neutral-500">
                        {inspection.inspector_name || 'Sem inspetor'}
                      </p>
                    </div>

                    {/* Status */}
                    <div className="col-span-6 md:col-span-2">
                      <InspectionBadge status={inspection.status} />
                    </div>

                    {/* Problems */}
                    <div className="col-span-6 md:col-span-2">
                      {inspection.total_problems > 0 ? (
                        <div className="flex flex-wrap gap-2">
                          {inspection.urgent_problems > 0 && (
                            <Badge variant="danger" className="text-xs">
                              {inspection.urgent_problems} urgente{inspection.urgent_problems > 1 ? 's' : ''}
                            </Badge>
                          )}
                          {inspection.high_problems > 0 && (
                            <Badge variant="warning" className="text-xs">
                              {inspection.high_problems} alto{inspection.high_problems > 1 ? 's' : ''}
                            </Badge>
                          )}
                          {!inspection.urgent_problems && !inspection.high_problems && (
                            <Badge variant="default" className="text-xs">
                              {inspection.total_problems} problema{inspection.total_problems > 1 ? 's' : ''}
                            </Badge>
                          )}
                        </div>
                      ) : (
                        <span className="text-sm text-neutral-500">Nenhum problema</span>
                      )}
                    </div>

                    {/* Date */}
                    <div className="col-span-6 md:col-span-2">
                      <p className="text-sm text-neutral-600">
                        {inspection.completed_at
                          ? new Intl.DateTimeFormat('pt-BR', {
                              day: '2-digit',
                              month: 'short',
                              year: 'numeric',
                            }).format(new Date(inspection.completed_at))
                          : inspection.started_at
                          ? new Intl.DateTimeFormat('pt-BR', {
                              day: '2-digit',
                              month: 'short',
                              year: 'numeric',
                            }).format(new Date(inspection.started_at))
                          : new Intl.DateTimeFormat('pt-BR', {
                              day: '2-digit',
                              month: 'short',
                              year: 'numeric',
                            }).format(new Date(inspection.created_at))}
                      </p>
                    </div>

                    {/* Actions */}
                    <div className="col-span-6 md:col-span-1 flex gap-2">
                      {canContinue && (
                        <Button asChild variant="ghost" size="sm">
                          <Link href={`/dashboard/inspections/${inspection.id}/capture`}>
                            <ArrowRight className="h-4 w-4" />
                          </Link>
                        </Button>
                      )}
                      {canDownload && inspection.report_url && (
                        <Button asChild variant="ghost" size="sm">
                          <a href={inspection.report_url} download>
                            <Download className="h-4 w-4" />
                          </a>
                        </Button>
                      )}
                      <Button asChild variant="ghost" size="sm">
                        <Link href={`/dashboard/inspections/${inspection.id}`}>
                          Ver
                        </Link>
                      </Button>
                    </div>
                  </div>
                )
              })}
            </div>
          </Card>

          {/* Results Count */}
          <div className="text-center text-sm text-neutral-600">
            Mostrando {filteredInspections.length} de {inspections.length} vistorias
          </div>
        </>
      )}
    </div>
  )
}

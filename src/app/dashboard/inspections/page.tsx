'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Plus, Search, Download, ArrowRight, Trash2, Loader2, Eye, ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { InspectionBadge } from '@/components/vistoria/InspectionBadge'
import { InspectionRowSkeleton } from '@/components/vistoria/InspectionRowSkeleton'
import { StatCardSkeleton } from '@/components/vistoria/StatCardSkeleton'
import { useInspections } from '@/hooks/use-inspections'
import { INSPECTION_TYPES } from '@/lib/constants'
import { toast } from 'sonner'
import type { InspectionType, InspectionStatus } from '@/types/database'

/**
 * Inspections Page - VistorIA Pro
 * Lists all inspections with search and filters
 */

export default function InspectionsPage() {
  const router = useRouter()
  const { inspections, isLoading, error, fetchInspections } = useInspections()
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<InspectionStatus | 'all'>('all')
  const [typeFilter, setTypeFilter] = useState<InspectionType | 'all'>('all')
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [confirmDelete, setConfirmDelete] = useState<{ id: string; type: string } | null>(null)

  const handleDeleteInspection = async (id: string) => {
    setDeletingId(id)
    try {
      const response = await fetch(`/api/inspections/${id}`, {
        method: 'DELETE',
        credentials: 'include',
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Erro ao deletar vistoria')
      }

      toast.success('Vistoria excluída com sucesso!')
      fetchInspections() // Recarregar lista
    } catch (error) {
      console.error('Error deleting inspection:', error)
      toast.error(error instanceof Error ? error.message : 'Erro ao excluir vistoria')
    } finally {
      setDeletingId(null)
      setConfirmDelete(null)
    }
  }

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
    <div className="space-y-8 px-4 sm:px-0">
      {/* Page Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={() => router.back()} 
            className="shrink-0 sm:hidden"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-neutral-900 mb-1">
              Vistorias
            </h1>
            <p className="text-sm sm:text-base text-neutral-600">
              Gerencie todas as suas vistorias e laudos
            </p>
          </div>
        </div>
        <Button asChild size="lg" className="w-full sm:w-auto">
          <Link href="/dashboard/inspections/new">
            <Plus className="mr-2 h-5 w-5" />
            Nova Vistoria
          </Link>
        </Button>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-5">
        <Card className="p-3 sm:p-4 border-neutral-200 bg-white">
          <p className="text-xs sm:text-sm font-medium text-neutral-600">Total</p>
          <p className="mt-1 sm:mt-2 text-xl sm:text-2xl font-bold text-neutral-900">{stats.total}</p>
        </Card>
        <Card className="p-3 sm:p-4 border-neutral-200 bg-white">
          <p className="text-xs sm:text-sm font-medium text-neutral-600">Rascunhos</p>
          <p className="mt-1 sm:mt-2 text-xl sm:text-2xl font-bold text-gray-700">{stats.draft}</p>
        </Card>
        <Card className="p-3 sm:p-4 border-neutral-200 bg-white">
          <p className="text-xs sm:text-sm font-medium text-neutral-600">Em Andamento</p>
          <p className="mt-1 sm:mt-2 text-xl sm:text-2xl font-bold text-blue-700">{stats.in_progress}</p>
        </Card>
        <Card className="p-3 sm:p-4 border-neutral-200 bg-white">
          <p className="text-xs sm:text-sm font-medium text-neutral-600">Concluídas</p>
          <p className="mt-1 sm:mt-2 text-xl sm:text-2xl font-bold text-green-700">{stats.completed}</p>
        </Card>
        <Card className="col-span-2 lg:col-span-1 p-3 sm:p-4 border-neutral-200 bg-white">
          <p className="text-xs sm:text-sm font-medium text-neutral-600">Assinadas</p>
          <p className="mt-1 sm:mt-2 text-xl sm:text-2xl font-bold text-purple-700">{stats.signed}</p>
        </Card>
      </div>

      {/* Filters Bar */}
      <div className="flex flex-col gap-3">
        {/* Search */}
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-500" />
          <Input
            type="search"
            placeholder="Buscar por nome..."
            className="pl-10"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        {/* Filters Row */}
        <div className="flex gap-3">
          {/* Status Filter */}
          <Select value={statusFilter} onValueChange={(value) => setStatusFilter(value as InspectionStatus | 'all')}>
            <SelectTrigger className="flex-1 sm:w-[180px] sm:flex-none">
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
            <SelectTrigger className="flex-1 sm:w-[180px] sm:flex-none">
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
            <div className="hidden border-b border-neutral-200 bg-neutral-50 px-4 py-3 lg:grid lg:grid-cols-10 lg:gap-3">
              <div className="col-span-1 text-xs font-semibold uppercase tracking-wide text-neutral-700">
                Tipo
              </div>
              <div className="col-span-2 text-xs font-semibold uppercase tracking-wide text-neutral-700">
                Participantes
              </div>
              <div className="col-span-2 text-xs font-semibold uppercase tracking-wide text-neutral-700">
                Status
              </div>
              <div className="col-span-2 text-xs font-semibold uppercase tracking-wide text-neutral-700">
                Problemas
              </div>
              <div className="col-span-1 text-xs font-semibold uppercase tracking-wide text-neutral-700">
                Data
              </div>
              <div className="col-span-2 text-xs font-semibold uppercase tracking-wide text-neutral-700 text-right">
                Ações
              </div>
            </div>

            {/* Table Body */}
            <div className="divide-y divide-neutral-200">
              {filteredInspections.map((inspection) => {
                const typeInfo = INSPECTION_TYPES[inspection.type]
                const canContinue = inspection.status === 'draft' || inspection.status === 'in_progress'
                const canDownload = inspection.status === 'completed' || inspection.status === 'signed'
                const isDeleting = deletingId === inspection.id

                return (
                  <div
                    key={inspection.id}
                    className="grid gap-3 px-4 py-3 lg:grid-cols-10 hover:bg-neutral-50 transition-colors items-center"
                  >
                    {/* Type */}
                    <div className="col-span-12 lg:col-span-1">
                      <div className="flex items-center gap-2">
                        <span className="text-base">{typeInfo.icon}</span>
                        <span className="font-medium text-neutral-900 text-sm">{typeInfo.label}</span>
                      </div>
                    </div>

                    {/* Names */}
                    <div className="col-span-6 lg:col-span-2">
                      <p className="text-sm font-medium text-neutral-900 truncate">
                        {inspection.tenant_name || 'Sem inquilino'}
                      </p>
                      <p className="text-xs text-neutral-500 truncate">
                        {inspection.inspector_name || 'Sem inspetor'}
                      </p>
                    </div>

                    {/* Status */}
                    <div className="col-span-6 lg:col-span-2">
                      <InspectionBadge status={inspection.status} />
                    </div>

                    {/* Problems */}
                    <div className="col-span-6 lg:col-span-2">
                      {inspection.total_problems > 0 ? (
                        <div className="flex flex-wrap gap-1">
                          {inspection.urgent_problems > 0 && (
                            <Badge variant="danger" className="text-xs px-1.5 py-0.5">
                              {inspection.urgent_problems} urg
                            </Badge>
                          )}
                          {inspection.high_problems > 0 && (
                            <Badge variant="warning" className="text-xs px-1.5 py-0.5">
                              {inspection.high_problems} alto
                            </Badge>
                          )}
                          {!inspection.urgent_problems && !inspection.high_problems && (
                            <Badge variant="default" className="text-xs px-1.5 py-0.5">
                              {inspection.total_problems}
                            </Badge>
                          )}
                        </div>
                      ) : (
                        <span className="text-xs text-neutral-400">—</span>
                      )}
                    </div>

                    {/* Date */}
                    <div className="col-span-6 lg:col-span-1">
                      <p className="text-xs text-neutral-600">
                        {new Intl.DateTimeFormat('pt-BR', {
                          day: '2-digit',
                          month: 'short',
                        }).format(new Date(inspection.completed_at || inspection.started_at || inspection.created_at))}
                      </p>
                    </div>

                    {/* Actions */}
                    <div className="col-span-12 lg:col-span-2 flex gap-1 justify-end">
                      <Button asChild variant="outline" size="sm" className="h-8 px-3">
                        <Link href={`/dashboard/inspections/${inspection.id}`}>
                          <Eye className="h-3.5 w-3.5 mr-1.5" />
                          Ver
                        </Link>
                      </Button>

                      {canContinue && (
                        <Button asChild size="sm" className="h-8 px-3">
                          <Link href={`/dashboard/inspections/${inspection.id}/capture`}>
                            <ArrowRight className="h-3.5 w-3.5 mr-1.5" />
                            Continuar
                          </Link>
                        </Button>
                      )}

                      {canDownload && inspection.report_url && (
                        <Button asChild variant="outline" size="sm" className="h-8 px-3">
                          <a href={inspection.report_url} download>
                            <Download className="h-3.5 w-3.5" />
                          </a>
                        </Button>
                      )}

                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 w-8 p-0 text-danger-600 hover:text-danger-700 hover:bg-danger-50"
                        onClick={() => setConfirmDelete({ id: inspection.id, type: typeInfo.label })}
                        disabled={isDeleting}
                      >
                        {isDeleting ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Trash2 className="h-4 w-4" />
                        )}
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

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!confirmDelete} onOpenChange={(open) => !open && setConfirmDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir Vistoria?</AlertDialogTitle>
            <AlertDialogDescription>
              Você está prestes a excluir uma vistoria de <strong>{confirmDelete?.type}</strong>.
              Esta ação não pode ser desfeita. Todas as fotos e análises serão removidas permanentemente.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={!!deletingId}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => confirmDelete && handleDeleteInspection(confirmDelete.id)}
              disabled={!!deletingId}
              className="!bg-danger-600 hover:!bg-danger-700 !text-white !border-danger-600"
            >
              {deletingId ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Excluindo...
                </>
              ) : (
                <>
                  <Trash2 className="mr-2 h-4 w-4" />
                  Sim, Excluir
                </>
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

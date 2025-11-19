'use client'

import { use, useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Plus, Download, ArrowRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { InspectionBadge } from '@/components/vistoria/InspectionBadge'
import { useInspections } from '@/hooks/use-inspections'
import { INSPECTION_TYPES } from '@/lib/constants'
import type { Property } from '@/types/database'

/**
 * Property Inspections Page - VistorIA Pro
 * Lists all inspections for a specific property
 */

interface PropertyInspectionsPageProps {
  params: Promise<{ id: string }>
}

export default function PropertyInspectionsPage({ params }: PropertyInspectionsPageProps) {
  const { id } = use(params)
  const router = useRouter()
  const { inspections, isLoading, error, fetchInspections } = useInspections({
    propertyId: id,
  })

  const [property, setProperty] = useState<Property | null>(null)
  const [isLoadingProperty, setIsLoadingProperty] = useState(true)

  useEffect(() => {
    fetchProperty()
  }, [id])

  const fetchProperty = async () => {
    try {
      setIsLoadingProperty(true)
      const response = await fetch(`/api/properties/${id}`, {
        credentials: 'include',
      })

      if (!response.ok) {
        throw new Error('Failed to fetch property')
      }

      const data = await response.json()
      setProperty(data.property)
    } catch (err) {
      console.error('Error fetching property:', err)
    } finally {
      setIsLoadingProperty(false)
    }
  }

  if (isLoadingProperty) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-primary-600 border-r-transparent"></div>
      </div>
    )
  }

  if (!property) {
    return (
      <div className="text-center py-12">
        <p className="text-red-600">Imóvel não encontrado</p>
        <Button className="mt-4" onClick={() => router.push('/dashboard/properties')}>
          Voltar para Imóveis
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => router.back()}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-neutral-900">
              Vistorias - {property.name}
            </h1>
            <p className="text-neutral-600 mt-1">
              {property.address}, {property.city} - {property.state}
            </p>
          </div>
        </div>
        <Button asChild size="lg">
          <Link href={`/dashboard/inspections/new?propertyId=${id}`}>
            <Plus className="mr-2 h-5 w-5" />
            Nova Vistoria
          </Link>
        </Button>
      </div>

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="p-4">
          <p className="text-sm font-medium text-neutral-600">Total</p>
          <p className="mt-2 text-2xl font-bold">{inspections.length}</p>
        </Card>
        <Card className="p-4">
          <p className="text-sm font-medium text-neutral-600">Em Andamento</p>
          <p className="mt-2 text-2xl font-bold text-blue-700">
            {inspections.filter((i) => i.status === 'in_progress').length}
          </p>
        </Card>
        <Card className="p-4">
          <p className="text-sm font-medium text-neutral-600">Concluídas</p>
          <p className="mt-2 text-2xl font-bold text-green-700">
            {inspections.filter((i) => i.status === 'completed').length}
          </p>
        </Card>
        <Card className="p-4">
          <p className="text-sm font-medium text-neutral-600">Assinadas</p>
          <p className="mt-2 text-2xl font-bold text-purple-700">
            {inspections.filter((i) => i.status === 'signed').length}
          </p>
        </Card>
      </div>

      {/* Loading State */}
      {isLoading && (
        <div className="text-center py-12">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-primary-600 border-r-transparent"></div>
          <p className="mt-4 text-neutral-600">Carregando vistorias...</p>
        </div>
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
      {!isLoading && !error && inspections.length === 0 && (
        <Card className="p-12 text-center">
          <div className="inline-flex h-16 w-16 items-center justify-center rounded-full bg-neutral-100 mb-4">
            <Plus className="h-8 w-8 text-neutral-400" />
          </div>
          <h3 className="text-xl font-semibold text-neutral-900 mb-2">
            Nenhuma vistoria cadastrada
          </h3>
          <p className="text-neutral-600 mb-6">
            Comece criando a primeira vistoria para este imóvel
          </p>
          <Button asChild>
            <Link href={`/dashboard/inspections/new?propertyId=${id}`}>
              <Plus className="mr-2 h-4 w-4" />
              Criar Primeira Vistoria
            </Link>
          </Button>
        </Card>
      )}

      {/* Inspections List */}
      {!isLoading && !error && inspections.length > 0 && (
        <Card className="overflow-hidden">
          {/* Table Header - Desktop */}
          <div className="hidden border-b border-neutral-200 bg-neutral-50 px-6 py-3 md:grid md:grid-cols-12 md:gap-4">
            <div className="col-span-3 text-xs font-semibold uppercase tracking-wide text-neutral-700">
              Tipo
            </div>
            <div className="col-span-2 text-xs font-semibold uppercase tracking-wide text-neutral-700">
              Status
            </div>
            <div className="col-span-2 text-xs font-semibold uppercase tracking-wide text-neutral-700">
              Inspetor
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
            {inspections.map((inspection) => {
              const typeInfo = INSPECTION_TYPES[inspection.type]
              const canContinue =
                inspection.status === 'draft' || inspection.status === 'in_progress'
              const canDownload =
                inspection.status === 'completed' || inspection.status === 'signed'

              return (
                <div
                  key={inspection.id}
                  className="grid gap-4 px-6 py-4 md:grid-cols-12 hover:bg-neutral-50 transition-colors"
                >
                  {/* Type */}
                  <div className="col-span-12 md:col-span-3">
                    <div className="flex items-center gap-2">
                      <span className="text-lg">{typeInfo.icon}</span>
                      <div>
                        <p className="font-medium text-neutral-900">{typeInfo.label}</p>
                        <p className="text-xs text-neutral-500">
                          {inspection.tenant_name || 'Sem inquilino'}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Status */}
                  <div className="col-span-6 md:col-span-2">
                    <InspectionBadge status={inspection.status} />
                  </div>

                  {/* Inspector */}
                  <div className="col-span-6 md:col-span-2">
                    <p className="text-sm text-neutral-900">
                      {inspection.inspector_name || 'Não definido'}
                    </p>
                  </div>

                  {/* Problems */}
                  <div className="col-span-6 md:col-span-2">
                    {inspection.total_problems > 0 ? (
                      <div className="flex flex-wrap gap-2">
                        {inspection.urgent_problems > 0 && (
                          <Badge variant="danger" className="text-xs">
                            {inspection.urgent_problems} urgente
                            {inspection.urgent_problems > 1 ? 's' : ''}
                          </Badge>
                        )}
                        {inspection.high_problems > 0 && (
                          <Badge variant="warning" className="text-xs">
                            {inspection.high_problems} alto{inspection.high_problems > 1 ? 's' : ''}
                          </Badge>
                        )}
                        {!inspection.urgent_problems && !inspection.high_problems && (
                          <Badge variant="default" className="text-xs">
                            {inspection.total_problems} problema
                            {inspection.total_problems > 1 ? 's' : ''}
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
                      <Link href={`/dashboard/inspections/${inspection.id}`}>Ver</Link>
                    </Button>
                  </div>
                </div>
              )
            })}
          </div>
        </Card>
      )}
    </div>
  )
}

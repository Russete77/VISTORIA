'use client'

import { use, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  ArrowLeft,
  Edit,
  Trash2,
  MapPin,
  Home,
  Bed,
  Bath,
  Square,
  Car,
  Building2,
  FileText,
  ClipboardCheck,
  Loader2,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Breadcrumbs } from '@/components/ui/breadcrumbs'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import type { Property } from '@/types/database'

/**
 * Property Detail Page - VistorIA Pro
 * View property details, edit, delete, and create inspection
 */

interface PropertyDetailPageProps {
  params: Promise<{ id: string }>
}

const propertyTypeLabels = {
  apartment: 'Apartamento',
  house: 'Casa',
  commercial: 'Comercial',
  land: 'Terreno',
  other: 'Outro',
}

const statusLabels: Record<string, string> = {
  active: 'Ativo',
  inactive: 'Inativo',
  pending: 'Pendente',
  archived: 'Arquivado',
}

const statusColors: Record<string, string> = {
  active: 'bg-success-100 text-success-700',
  inactive: 'bg-neutral-100 text-neutral-700',
  pending: 'bg-warning-100 text-warning-700',
  archived: 'bg-neutral-200 text-neutral-600',
}

export default function PropertyDetailPage({ params }: PropertyDetailPageProps) {
  const { id } = use(params)
  const router = useRouter()
  const [property, setProperty] = useState<Property | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)

  useEffect(() => {
    async function fetchProperty() {
      try {
        const response = await fetch(`/api/properties/${id}`, {
          credentials: 'include',
        })
        if (!response.ok) {
          throw new Error('Failed to fetch property')
        }
        const data = await response.json()
        setProperty(data.property)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred')
      } finally {
        setIsLoading(false)
      }
    }

    fetchProperty()
  }, [id])

  const handleDelete = async () => {
    setIsDeleting(true)
    try {
      const response = await fetch(`/api/properties/${id}`, {
        method: 'DELETE',
        credentials: 'include',
      })

      if (!response.ok) {
        throw new Error('Failed to delete property')
      }

      router.push('/dashboard/properties')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
      setIsDeleting(false)
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-primary-600" />
          <p className="text-neutral-600">Carregando imóvel...</p>
        </div>
      </div>
    )
  }

  if (error || !property) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/dashboard/properties">
              <ArrowLeft className="h-5 w-5" />
            </Link>
          </Button>
          <h1 className="text-3xl font-bold text-neutral-900">Erro</h1>
        </div>
        <div className="p-4 bg-danger-50 border border-danger-200 rounded-lg text-danger-700">
          <p className="font-semibold">Não foi possível carregar o imóvel</p>
          <p className="text-sm mt-1">{error || 'Imóvel não encontrado'}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6 px-4 sm:px-0">
      {/* Breadcrumbs */}
      <Breadcrumbs
        items={[
          { label: 'Imóveis', href: '/dashboard/properties', icon: <Building2 className="h-3.5 w-3.5" /> },
          { label: property.name },
        ]}
      />

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-neutral-900">{property.name}</h1>
          <p className="text-sm sm:text-base text-neutral-600 mt-1 flex items-center gap-2">
            <MapPin className="h-4 w-4" />
            {property.address}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="outline" asChild size="sm" className="sm:size-default">
            <Link href={`/dashboard/properties/${id}/edit`}>
              <Edit className="mr-2 h-4 w-4" />
              Editar
            </Link>
          </Button>

          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="outline" size="sm" className="sm:size-default text-danger-600 hover:bg-danger-50">
                <Trash2 className="mr-2 h-4 w-4" />
                Excluir
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Tem certeza?</AlertDialogTitle>
                <AlertDialogDescription>
                  Esta ação não pode ser desfeita. O imóvel será removido permanentemente.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                <AlertDialogAction
                  onClick={handleDelete}
                  disabled={isDeleting}
                  className="bg-danger-600 hover:bg-danger-700"
                >
                  {isDeleting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Excluir
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Property Info */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Informações do Imóvel</CardTitle>
                <Badge className={statusColors[property.status]}>
                  {statusLabels[property.status]}
                </Badge>
              </div>
              <CardDescription>Dados cadastrados do imóvel</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium text-neutral-600">Tipo</p>
                  <p className="text-base text-neutral-900">
                    {propertyTypeLabels[property.type]}
                  </p>
                </div>
                {property.area && (
                  <div>
                    <p className="text-sm font-medium text-neutral-600">Área</p>
                    <p className="text-base text-neutral-900 flex items-center gap-1">
                      <Square className="h-4 w-4" />
                      {property.area} m²
                    </p>
                  </div>
                )}
                {property.bedrooms !== null && property.bedrooms !== undefined && (
                  <div>
                    <p className="text-sm font-medium text-neutral-600">Quartos</p>
                    <p className="text-base text-neutral-900 flex items-center gap-1">
                      <Bed className="h-4 w-4" />
                      {property.bedrooms}
                    </p>
                  </div>
                )}
                {property.bathrooms !== null && property.bathrooms !== undefined && (
                  <div>
                    <p className="text-sm font-medium text-neutral-600">Banheiros</p>
                    <p className="text-base text-neutral-900 flex items-center gap-1">
                      <Bath className="h-4 w-4" />
                      {property.bathrooms}
                    </p>
                  </div>
                )}
                {property.parking_spaces !== null && property.parking_spaces !== undefined && (
                  <div>
                    <p className="text-sm font-medium text-neutral-600">Vagas</p>
                    <p className="text-base text-neutral-900 flex items-center gap-1">
                      <Car className="h-4 w-4" />
                      {property.parking_spaces}
                    </p>
                  </div>
                )}
                {property.floor !== null && property.floor !== undefined && (
                  <div>
                    <p className="text-sm font-medium text-neutral-600">Andar</p>
                    <p className="text-base text-neutral-900 flex items-center gap-1">
                      <Building2 className="h-4 w-4" />
                      {property.floor}º
                    </p>
                  </div>
                )}
              </div>

              {(property.has_elevator || property.is_furnished) && (
                <div className="pt-4 border-t">
                  <p className="text-sm font-medium text-neutral-600 mb-2">Características</p>
                  <div className="flex gap-2">
                    {property.has_elevator && (
                      <Badge variant="outline">Elevador</Badge>
                    )}
                    {property.is_furnished && (
                      <Badge variant="outline">Mobiliado</Badge>
                    )}
                  </div>
                </div>
              )}

              {property.notes && (
                <div className="pt-4 border-t">
                  <p className="text-sm font-medium text-neutral-600 mb-1">Observações</p>
                  <p className="text-sm text-neutral-700">{property.notes}</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Address */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MapPin className="h-5 w-5" />
                Endereço
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-base text-neutral-900">{property.address}</p>
              {(property.city || property.state || property.zip_code) && (
                <p className="text-sm text-neutral-600 mt-1">
                  {[property.city, property.state, property.zip_code]
                    .filter(Boolean)
                    .join(', ')}
                </p>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle>Ações Rápidas</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button className="w-full" asChild>
                <Link href={`/dashboard/inspections/new?property=${id}`}>
                  <ClipboardCheck className="mr-2 h-4 w-4" />
                  Nova Vistoria
                </Link>
              </Button>
              <Button variant="outline" className="w-full" asChild>
                <Link href={`/dashboard/properties/${id}/inspections`}>
                  <FileText className="mr-2 h-4 w-4" />
                  Ver Vistorias
                </Link>
              </Button>
            </CardContent>
          </Card>

          {/* Stats */}
          <Card>
            <CardHeader>
              <CardTitle>Estatísticas</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-sm font-medium text-neutral-600 mb-2">Total de Vistorias</p>
                <p className="text-2xl font-bold text-neutral-900">{(property as any).total_inspections || 0}</p>
              </div>

              {(property as any).total_inspections > 0 && (
                <div className="pt-3 border-t space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-success-500"></div>
                      <span className="text-neutral-600">Entrada</span>
                    </div>
                    <span className="font-semibold text-neutral-900">{(property as any).move_in_count || 0}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-danger-500"></div>
                      <span className="text-neutral-600">Saída</span>
                    </div>
                    <span className="font-semibold text-neutral-900">{(property as any).move_out_count || 0}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-primary-500"></div>
                      <span className="text-neutral-600">Periódica</span>
                    </div>
                    <span className="font-semibold text-neutral-900">{(property as any).periodic_count || 0}</span>
                  </div>
                </div>
              )}

              <div className="pt-3 border-t">
                <p className="text-sm font-medium text-neutral-600 mb-1">Última Vistoria</p>
                <p className="text-base text-neutral-700">
                  {(property as any).last_inspection_at
                    ? new Date((property as any).last_inspection_at).toLocaleDateString('pt-BR')
                    : 'Nenhuma vistoria'}
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}

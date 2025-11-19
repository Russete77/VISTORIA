'use client'

import { use, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { PropertyForm } from '@/components/vistoria/PropertyForm'
import { Building2, Loader2 } from 'lucide-react'
import { Breadcrumbs } from '@/components/ui/breadcrumbs'
import type { Property } from '@/types/database'

/**
 * Edit Property Page - VistorIA Pro
 * Edit an existing property
 */

interface EditPropertyPageProps {
  params: Promise<{ id: string }>
}

export default function EditPropertyPage({ params }: EditPropertyPageProps) {
  const { id } = use(params)
  const router = useRouter()
  const [property, setProperty] = useState<Property | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

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
      <div className="space-y-6 px-4 sm:px-0">
        <h1 className="text-2xl sm:text-3xl font-bold text-neutral-900">Erro</h1>
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
          { label: property.name, href: `/dashboard/properties/${id}` },
          { label: 'Editar' },
        ]}
      />

      {/* Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-neutral-900">Editar Imóvel</h1>
        <p className="text-sm sm:text-base text-neutral-600 mt-1">{property.name}</p>
      </div>

      {/* Form */}
      <PropertyForm
        property={property}
        onSuccess={() => router.push(`/dashboard/properties/${id}`)}
      />
    </div>
  )
}

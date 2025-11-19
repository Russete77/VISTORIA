'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Plus, Search } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { PropertyCard } from '@/components/vistoria/PropertyCard'
import { PropertyCardSkeleton } from '@/components/vistoria/PropertyCardSkeleton'
import { useProperties } from '@/hooks/use-properties'

/**
 * Properties Page - VistorIA Pro
 * Lists all properties with search and filters
 */

export default function PropertiesPage() {
  const { properties, isLoading, error, fetchProperties } = useProperties()
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [typeFilter, setTypeFilter] = useState('all')

  // Filter properties
  const filteredProperties = properties.filter((property) => {
    const matchesSearch =
      search === '' ||
      property.name.toLowerCase().includes(search.toLowerCase()) ||
      property.address.toLowerCase().includes(search.toLowerCase())

    const matchesStatus = statusFilter === 'all' || property.status === statusFilter
    const matchesType = typeFilter === 'all' || property.type === typeFilter

    return matchesSearch && matchesStatus && matchesType
  })

  return (
    <div className="space-y-6 sm:space-y-8">
      {/* Page Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between px-4 sm:px-0">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-neutral-900 mb-2">Imóveis</h1>
          <p className="text-sm sm:text-base text-neutral-600">
            Gerencie todos os seus imóveis cadastrados
          </p>
        </div>
        <Button asChild size="lg" className="w-full sm:w-auto">
          <Link href="/dashboard/properties/new">
            <Plus className="mr-2 h-5 w-5" />
            Novo Imóvel
          </Link>
        </Button>
      </div>

      {/* Filters Bar */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center px-4 sm:px-0">
        {/* Search */}
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-500" />
          <Input
            type="search"
            placeholder="Buscar por nome ou endereço..."
            className="pl-10"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        {/* Status Filter */}
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-full sm:w-[180px]">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos os Status</SelectItem>
            <SelectItem value="active">Ativos</SelectItem>
            <SelectItem value="inactive">Inativos</SelectItem>
            <SelectItem value="pending">Pendentes</SelectItem>
          </SelectContent>
        </Select>

        {/* Type Filter */}
        <Select value={typeFilter} onValueChange={setTypeFilter}>
          <SelectTrigger className="w-full sm:w-[180px]">
            <SelectValue placeholder="Tipo" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos os Tipos</SelectItem>
            <SelectItem value="apartment">Apartamento</SelectItem>
            <SelectItem value="house">Casa</SelectItem>
            <SelectItem value="commercial">Comercial</SelectItem>
            <SelectItem value="land">Terreno</SelectItem>
            <SelectItem value="other">Outro</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Loading State */}
      {isLoading && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 px-4 sm:px-0">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <PropertyCardSkeleton key={i} />
          ))}
        </div>
      )}

      {/* Error State */}
      {error && (
        <div className="p-4 bg-danger-50 border border-danger-200 rounded-lg text-danger-700 mx-4 sm:mx-0">
          <p className="font-semibold text-sm sm:text-base">Erro ao carregar imóveis</p>
          <p className="text-xs sm:text-sm mt-1">{error}</p>
          <Button
            variant="outline"
            size="sm"
            className="mt-3"
            onClick={() => fetchProperties()}
          >
            Tentar novamente
          </Button>
        </div>
      )}

      {/* Empty State */}
      {!isLoading && !error && filteredProperties.length === 0 && (
        <div className="text-center py-12 px-4">
          <div className="inline-flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-primary-50 to-primary-100 mb-4">
            <Plus className="h-10 w-10 text-primary-600" />
          </div>
          <h3 className="text-xl font-semibold text-neutral-900 mb-2">
            {properties.length === 0
              ? 'Nenhum imóvel cadastrado'
              : 'Nenhum imóvel encontrado'}
          </h3>
          <p className="text-neutral-600 mb-6 max-w-md mx-auto">
            {properties.length === 0
              ? 'Comece cadastrando seu primeiro imóvel para iniciar as vistorias inteligentes com IA'
              : 'Tente ajustar os filtros de busca para encontrar o imóvel desejado'}
          </p>
          {properties.length === 0 && (
            <Button asChild className="w-full sm:w-auto">
              <Link href="/dashboard/properties/new">
                <Plus className="mr-2 h-4 w-4" />
                Cadastrar Primeiro Imóvel
              </Link>
            </Button>
          )}
        </div>
      )}

      {/* Properties Grid */}
      {!isLoading && !error && filteredProperties.length > 0 && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 px-4 sm:px-0">
            {filteredProperties.map((property: any) => (
              <PropertyCard
                key={property.id}
                id={property.id}
                name={property.name}
                address={property.address}
                thumbnail={property.thumbnail_url}
                bedrooms={property.bedrooms}
                bathrooms={property.bathrooms}
                area={property.area}
                lastInspection={
                  property.last_inspection_at
                    ? new Date(property.last_inspection_at)
                    : undefined
                }
                status={property.status}
                searchQuery={search}
                moveInCount={property.move_in_count}
                moveOutCount={property.move_out_count}
                totalInspections={property.total_inspections}
              />
            ))}
          </div>

          {/* Results Count */}
          <div className="text-center text-sm text-neutral-600">
            Mostrando {filteredProperties.length} de {properties.length} imóveis
          </div>
        </>
      )}
    </div>
  )
}

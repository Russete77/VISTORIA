'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Plus, Search, Calendar } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { BookingCard } from '@/components/bookings/BookingCard'
import { useBookings } from '@/hooks/use-bookings'
import { useProperties } from '@/hooks/use-properties'

/**
 * Bookings Page - VistorIA Pro
 * Lists all vacation rental bookings with search and filters
 */

export default function BookingsPage() {
  const { bookings, isLoading, error, fetchBookings } = useBookings()
  const { properties } = useProperties({ autoFetch: true })
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [sourceFilter, setSourceFilter] = useState('all')
  const [propertyFilter, setPropertyFilter] = useState('all')

  // Filter bookings
  const filteredBookings = bookings.filter((booking) => {
    const matchesSearch =
      search === '' ||
      booking.guest?.full_name.toLowerCase().includes(search.toLowerCase()) ||
      booking.property?.name.toLowerCase().includes(search.toLowerCase())

    const matchesStatus = statusFilter === 'all' || booking.status === statusFilter
    const matchesSource = sourceFilter === 'all' || booking.source === sourceFilter
    const matchesProperty = propertyFilter === 'all' || booking.property_id === propertyFilter

    return matchesSearch && matchesStatus && matchesSource && matchesProperty
  })

  return (
    <div className="space-y-6 sm:space-y-8">
      {/* Page Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between px-4 sm:px-0">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-neutral-900 mb-2">
            Reservas
          </h1>
          <p className="text-sm sm:text-base text-neutral-600">
            Gerencie todas as suas reservas de temporada
          </p>
        </div>
        <Button asChild size="lg" className="w-full sm:w-auto">
          <Link href="/dashboard/bookings/new">
            <Plus className="mr-2 h-5 w-5" />
            Nova Reserva
          </Link>
        </Button>
      </div>

      {/* Filters Bar */}
      <div className="flex flex-col gap-4 px-4 sm:px-0">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
          {/* Search */}
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-500" />
            <Input
              type="search"
              placeholder="Buscar por hóspede ou imóvel..."
              className="pl-10"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          {/* Property Filter */}
          <Select value={propertyFilter} onValueChange={setPropertyFilter}>
            <SelectTrigger className="w-full sm:w-[200px]">
              <SelectValue placeholder="Imóvel" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos os Imóveis</SelectItem>
              {properties.map((property) => (
                <SelectItem key={property.id} value={property.id}>
                  {property.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
          {/* Status Filter */}
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-full sm:w-[180px]">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos os Status</SelectItem>
              <SelectItem value="confirmed">Confirmada</SelectItem>
              <SelectItem value="cancelled">Cancelada</SelectItem>
              <SelectItem value="blocked">Bloqueada</SelectItem>
              <SelectItem value="completed">Concluída</SelectItem>
            </SelectContent>
          </Select>

          {/* Source Filter */}
          <Select value={sourceFilter} onValueChange={setSourceFilter}>
            <SelectTrigger className="w-full sm:w-[180px]">
              <SelectValue placeholder="Origem" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas as Origens</SelectItem>
              <SelectItem value="manual">Manual</SelectItem>
              <SelectItem value="airbnb">Airbnb</SelectItem>
              <SelectItem value="booking">Booking.com</SelectItem>
              <SelectItem value="vrbo">Vrbo</SelectItem>
              <SelectItem value="other">Outro</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Loading State */}
      {isLoading && (
        <div className="flex justify-center items-center py-12">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
            <p className="text-neutral-600">Carregando reservas...</p>
          </div>
        </div>
      )}

      {/* Error State */}
      {error && (
        <div className="p-4 bg-danger-50 border border-danger-200 rounded-lg text-danger-700 mx-4 sm:mx-0">
          <p className="font-semibold text-sm sm:text-base">Erro ao carregar reservas</p>
          <p className="text-xs sm:text-sm mt-1">{error}</p>
          <Button
            variant="outline"
            size="sm"
            className="mt-3"
            onClick={() => fetchBookings()}
          >
            Tentar novamente
          </Button>
        </div>
      )}

      {/* Empty State */}
      {!isLoading && !error && filteredBookings.length === 0 && (
        <div className="text-center py-12 px-4">
          <div className="inline-flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-primary-50 to-primary-100 mb-4">
            <Calendar className="h-10 w-10 text-primary-600" />
          </div>
          <h3 className="text-xl font-semibold text-neutral-900 mb-2">
            {bookings.length === 0
              ? 'Nenhuma reserva cadastrada'
              : 'Nenhuma reserva encontrada'}
          </h3>
          <p className="text-neutral-600 mb-6 max-w-md mx-auto">
            {bookings.length === 0
              ? 'Comece cadastrando sua primeira reserva ou configure a sincronização com Airbnb'
              : 'Tente ajustar os filtros de busca para encontrar a reserva desejada'}
          </p>
          {bookings.length === 0 && (
            <Button asChild className="w-full sm:w-auto">
              <Link href="/dashboard/bookings/new">
                <Plus className="mr-2 h-4 w-4" />
                Cadastrar Primeira Reserva
              </Link>
            </Button>
          )}
        </div>
      )}

      {/* Bookings Grid */}
      {!isLoading && !error && filteredBookings.length > 0 && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 px-4 sm:px-0">
            {filteredBookings.map((booking) => (
              <BookingCard key={booking.id} booking={booking} />
            ))}
          </div>

          {/* Results Count */}
          <div className="text-center text-sm text-neutral-600">
            Mostrando {filteredBookings.length} de {bookings.length} reservas
          </div>
        </>
      )}
    </div>
  )
}

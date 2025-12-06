'use client'

import { useEffect, useState, useCallback } from 'react'
import { toast } from 'sonner'
import type { Booking, CreateBookingInput, UpdateBookingInput } from '@/lib/validations/bookings'

interface UseBookingsOptions {
  autoFetch?: boolean
  propertyId?: string
  status?: string
  source?: string
  fromDate?: string
  toDate?: string
}

interface FetchBookingsFilters {
  propertyId?: string
  status?: string
  source?: string
  fromDate?: string
  toDate?: string
  limit?: number
  offset?: number
}

export function useBookings(options: UseBookingsOptions = {}) {
  const { autoFetch = true, propertyId, status, source, fromDate, toDate } = options
  const [bookings, setBookings] = useState<Booking[]>([])
  const [isLoading, setIsLoading] = useState(autoFetch)
  const [error, setError] = useState<string | null>(null)
  const [count, setCount] = useState<number>(0)

  const fetchBookings = useCallback(async (filters?: FetchBookingsFilters) => {
    setIsLoading(true)
    setError(null)

    try {
      const params = new URLSearchParams()

      const effectiveFilters = {
        propertyId: filters?.propertyId || propertyId,
        status: filters?.status || status,
        source: filters?.source || source,
        fromDate: filters?.fromDate || fromDate,
        toDate: filters?.toDate || toDate,
        limit: filters?.limit,
        offset: filters?.offset,
      }

      if (effectiveFilters.propertyId) params.append('property_id', effectiveFilters.propertyId)
      if (effectiveFilters.status) params.append('status', effectiveFilters.status)
      if (effectiveFilters.source) params.append('source', effectiveFilters.source)
      if (effectiveFilters.fromDate) params.append('from_date', effectiveFilters.fromDate)
      if (effectiveFilters.toDate) params.append('to_date', effectiveFilters.toDate)
      if (effectiveFilters.limit) params.append('limit', effectiveFilters.limit.toString())
      if (effectiveFilters.offset) params.append('offset', effectiveFilters.offset.toString())

      const queryString = params.toString()
      const url = `/api/bookings${queryString ? `?${queryString}` : ''}`

      const response = await fetch(url, {
        credentials: 'include',
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Failed to fetch bookings' }))
        throw new Error(errorData.error || 'Failed to fetch bookings')
      }

      const data = await response.json()
      setBookings(data.data)
      setCount(data.count || 0)
    } catch (err) {
      const message = err instanceof Error ? err.message : 'An error occurred'
      setError(message)
      console.error('Error fetching bookings:', err)
    } finally {
      setIsLoading(false)
    }
  }, [propertyId, status, source, fromDate, toDate])

  const createBooking = useCallback(async (bookingData: CreateBookingInput) => {
    setIsLoading(true)
    setError(null)

    try {
      const response = await fetch('/api/bookings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(bookingData),
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Failed to create booking' }))
        throw new Error(errorData.error || 'Failed to create booking')
      }

      const data = await response.json()
      setBookings((prev) => [...prev, data.data])
      toast.success('Reserva criada com sucesso!')
      return data.data
    } catch (err) {
      const message = err instanceof Error ? err.message : 'An error occurred'
      setError(message)
      toast.error('Erro ao criar reserva', {
        description: message
      })
      console.error('Error creating booking:', err)
      throw err
    } finally {
      setIsLoading(false)
    }
  }, [])

  const updateBooking = useCallback(async (id: string, bookingData: UpdateBookingInput) => {
    setIsLoading(true)
    setError(null)

    try {
      const response = await fetch(`/api/bookings/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(bookingData),
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Failed to update booking' }))
        throw new Error(errorData.error || 'Failed to update booking')
      }

      const data = await response.json()
      setBookings((prev) =>
        prev.map((b) => (b.id === id ? data.data : b))
      )
      toast.success('Reserva atualizada com sucesso!')
      return data.data
    } catch (err) {
      const message = err instanceof Error ? err.message : 'An error occurred'
      setError(message)
      toast.error('Erro ao atualizar reserva', {
        description: message
      })
      console.error('Error updating booking:', err)
      throw err
    } finally {
      setIsLoading(false)
    }
  }, [])

  const deleteBooking = useCallback(async (id: string) => {
    setIsLoading(true)
    setError(null)

    try {
      const response = await fetch(`/api/bookings/${id}`, {
        method: 'DELETE',
        credentials: 'include',
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Failed to delete booking' }))
        throw new Error(errorData.error || 'Failed to delete booking')
      }

      setBookings((prev) => prev.filter((b) => b.id !== id))
      toast.success('Reserva removida com sucesso!')
    } catch (err) {
      const message = err instanceof Error ? err.message : 'An error occurred'
      setError(message)
      toast.error('Erro ao remover reserva', {
        description: message
      })
      console.error('Error deleting booking:', err)
      throw err
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    if (autoFetch) {
      fetchBookings()
    }
  }, [autoFetch, fetchBookings])

  return {
    bookings,
    count,
    isLoading,
    error,
    fetchBookings,
    createBooking,
    updateBooking,
    deleteBooking,
  }
}

'use client'

import { useEffect, useState, useCallback, useRef, useMemo } from 'react'
import { toast } from 'sonner'
import type {
  CalendarItem,
  CreateCalendarEventInput,
  UpdateCalendarEventInput,
} from '@/lib/validations/calendar'

interface UseCalendarOptions {
  autoFetch?: boolean
  fromDate?: string
  toDate?: string
  propertyId?: string
  types?: ('booking' | 'inspection' | 'event')[]
}

interface FetchCalendarFilters {
  fromDate?: string
  toDate?: string
  propertyId?: string
  types?: ('booking' | 'inspection' | 'event')[]
}

const DEFAULT_TYPES: ('booking' | 'inspection' | 'event')[] = ['booking', 'inspection', 'event']

export function useCalendar(options: UseCalendarOptions = {}) {
  const {
    autoFetch = true,
    fromDate,
    toDate,
    propertyId,
    types,
  } = options

  // Memoize types to prevent infinite re-renders
  const memoizedTypes = useMemo(() => types ?? DEFAULT_TYPES, [types])
  
  // Track if initial fetch has been done
  const hasFetchedRef = useRef(false)

  const [items, setItems] = useState<CalendarItem[]>([])
  const [isLoading, setIsLoading] = useState(autoFetch)
  const [error, setError] = useState<string | null>(null)

  const fetchCalendar = useCallback(async (filters?: FetchCalendarFilters) => {
    setIsLoading(true)
    setError(null)

    try {
      const params = new URLSearchParams()

      const effectiveFilters = {
        fromDate: filters?.fromDate || fromDate,
        toDate: filters?.toDate || toDate,
        propertyId: filters?.propertyId || propertyId,
        types: filters?.types || memoizedTypes,
      }

      if (effectiveFilters.fromDate) params.append('from_date', effectiveFilters.fromDate)
      if (effectiveFilters.toDate) params.append('to_date', effectiveFilters.toDate)
      if (effectiveFilters.propertyId) params.append('property_id', effectiveFilters.propertyId)
      if (effectiveFilters.types) params.append('types', effectiveFilters.types.join(','))

      const queryString = params.toString()
      const url = `/api/calendar${queryString ? `?${queryString}` : ''}`

      const response = await fetch(url, {
        credentials: 'include',
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Failed to fetch calendar' }))
        throw new Error(errorData.error || 'Failed to fetch calendar')
      }

      const data = await response.json()
      setItems(data.data)
    } catch (err) {
      const message = err instanceof Error ? err.message : 'An error occurred'
      setError(message)
      console.error('Error fetching calendar:', err)
    } finally {
      setIsLoading(false)
    }
  }, [fromDate, toDate, propertyId, memoizedTypes])

  const createEvent = useCallback(async (eventData: CreateCalendarEventInput) => {
    setIsLoading(true)
    setError(null)

    try {
      const response = await fetch('/api/calendar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(eventData),
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Failed to create event' }))
        throw new Error(errorData.error || 'Failed to create event')
      }

      const data = await response.json()
      setItems((prev) => [...prev, data.data].sort((a, b) => 
        new Date(a.startDate).getTime() - new Date(b.startDate).getTime()
      ))
      toast.success('Compromisso criado com sucesso!')
      return data.data
    } catch (err) {
      const message = err instanceof Error ? err.message : 'An error occurred'
      setError(message)
      toast.error('Erro ao criar compromisso', { description: message })
      console.error('Error creating event:', err)
      throw err
    } finally {
      setIsLoading(false)
    }
  }, [])

  const updateEvent = useCallback(async (id: string, eventData: UpdateCalendarEventInput) => {
    setIsLoading(true)
    setError(null)

    try {
      const response = await fetch(`/api/calendar/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(eventData),
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Failed to update event' }))
        throw new Error(errorData.error || 'Failed to update event')
      }

      const data = await response.json()
      setItems((prev) =>
        prev.map((item) => (item.id === id && item.type === 'event' ? data.data : item))
      )
      toast.success('Compromisso atualizado com sucesso!')
      return data.data
    } catch (err) {
      const message = err instanceof Error ? err.message : 'An error occurred'
      setError(message)
      toast.error('Erro ao atualizar compromisso', { description: message })
      console.error('Error updating event:', err)
      throw err
    } finally {
      setIsLoading(false)
    }
  }, [])

  const deleteEvent = useCallback(async (id: string) => {
    setIsLoading(true)
    setError(null)

    try {
      const response = await fetch(`/api/calendar/${id}`, {
        method: 'DELETE',
        credentials: 'include',
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Failed to delete event' }))
        throw new Error(errorData.error || 'Failed to delete event')
      }

      setItems((prev) => prev.filter((item) => !(item.id === id && item.type === 'event')))
      toast.success('Compromisso removido com sucesso!')
    } catch (err) {
      const message = err instanceof Error ? err.message : 'An error occurred'
      setError(message)
      toast.error('Erro ao remover compromisso', { description: message })
      console.error('Error deleting event:', err)
      throw err
    } finally {
      setIsLoading(false)
    }
  }, [])

  // Group items by date for calendar view
  const itemsByDate = useCallback((itemsList: CalendarItem[]) => {
    const grouped: Record<string, CalendarItem[]> = {}
    
    for (const item of itemsList) {
      // For multi-day events, add to each day
      const start = new Date(item.startDate + 'T00:00:00')
      const end = new Date(item.endDate + 'T00:00:00')
      
      const current = new Date(start)
      while (current <= end) {
        const dateKey = current.toISOString().split('T')[0]
        if (!grouped[dateKey]) {
          grouped[dateKey] = []
        }
        grouped[dateKey].push(item)
        current.setDate(current.getDate() + 1)
      }
    }
    
    return grouped
  }, [])

  useEffect(() => {
    if (autoFetch && !hasFetchedRef.current) {
      hasFetchedRef.current = true
      fetchCalendar()
    }
  }, [autoFetch]) // eslint-disable-line react-hooks/exhaustive-deps

  return {
    items,
    itemsByDate: itemsByDate(items),
    isLoading,
    error,
    fetchCalendar,
    createEvent,
    updateEvent,
    deleteEvent,
  }
}

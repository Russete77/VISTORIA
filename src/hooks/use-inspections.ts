'use client'

import { useEffect, useState, useCallback } from 'react'
import { toast } from 'sonner'
import type { Inspection, InspectionWithPhotos } from '@/types/database'

interface UseInspectionsOptions {
  autoFetch?: boolean
  propertyId?: string
}

export function useInspections(options: UseInspectionsOptions = {}) {
  const { autoFetch = true, propertyId } = options
  const [inspections, setInspections] = useState<Inspection[]>([])
  const [isLoading, setIsLoading] = useState(autoFetch)
  const [error, setError] = useState<string | null>(null)

  const fetchInspections = useCallback(async () => {
    setIsLoading(true)
    setError(null)

    try {
      const url = propertyId
        ? `/api/inspections?propertyId=${propertyId}`
        : '/api/inspections'

      const response = await fetch(url, {
        credentials: 'include',
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Failed to fetch inspections' }))
        throw new Error(errorData.error || 'Failed to fetch inspections')
      }

      const data = await response.json()
      setInspections(data.inspections)
    } catch (err) {
      const message = err instanceof Error ? err.message : 'An error occurred'
      setError(message)
      console.error('Error fetching inspections:', err)
    } finally {
      setIsLoading(false)
    }
  }, [propertyId])

  const getInspection = useCallback(async (id: string): Promise<InspectionWithPhotos | null> => {
    try {
      const response = await fetch(`/api/inspections/${id}`, {
        credentials: 'include',
      })
      if (!response.ok) {
        throw new Error('Failed to fetch inspection')
      }

      const data = await response.json()
      return data.inspection
    } catch (err) {
      console.error('Error fetching inspection:', err)
      return null
    }
  }, [])

  const createInspection = useCallback(async (inspectionData: Partial<Inspection>) => {
    setIsLoading(true)
    setError(null)

    try {
      const response = await fetch('/api/inspections', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(inspectionData),
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Failed to create inspection' }))
        throw new Error(errorData.error || 'Failed to create inspection')
      }

      const data = await response.json()
      setInspections((prev) => [...prev, data.inspection])
      toast.success('Vistoria criada com sucesso!')
      return data.inspection
    } catch (err) {
      const message = err instanceof Error ? err.message : 'An error occurred'
      setError(message)
      toast.error('Erro ao criar vistoria', {
        description: message
      })
      console.error('Error creating inspection:', err)
      throw err
    } finally {
      setIsLoading(false)
    }
  }, [])

  const updateInspection = useCallback(async (id: string, inspectionData: Partial<Inspection>) => {
    setIsLoading(true)
    setError(null)

    try {
      const response = await fetch(`/api/inspections/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(inspectionData),
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Failed to update inspection' }))
        throw new Error(errorData.error || 'Failed to update inspection')
      }

      const data = await response.json()
      setInspections((prev) =>
        prev.map((i) => (i.id === id ? data.inspection : i))
      )
      toast.success('Vistoria atualizada com sucesso!')
      return data.inspection
    } catch (err) {
      const message = err instanceof Error ? err.message : 'An error occurred'
      setError(message)
      toast.error('Erro ao atualizar vistoria', {
        description: message
      })
      console.error('Error updating inspection:', err)
      throw err
    } finally {
      setIsLoading(false)
    }
  }, [])

  const deleteInspection = useCallback(async (id: string) => {
    setIsLoading(true)
    setError(null)

    try {
      const response = await fetch(`/api/inspections/${id}`, {
        method: 'DELETE',
        credentials: 'include',
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Failed to delete inspection' }))
        throw new Error(errorData.error || 'Failed to delete inspection')
      }

      setInspections((prev) => prev.filter((i) => i.id !== id))
      toast.success('Vistoria deletada com sucesso!')
    } catch (err) {
      const message = err instanceof Error ? err.message : 'An error occurred'
      setError(message)
      toast.error('Erro ao deletar vistoria', {
        description: message
      })
      console.error('Error deleting inspection:', err)
      throw err
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    if (autoFetch) {
      fetchInspections()
    }
  }, [autoFetch, fetchInspections])

  return {
    inspections,
    isLoading,
    error,
    fetchInspections,
    getInspection,
    createInspection,
    updateInspection,
    deleteInspection,
  }
}

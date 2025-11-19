'use client'

import { useEffect, useState, useCallback } from 'react'
import { toast } from 'sonner'
import type { Property } from '@/types/database'

interface UsePropertiesOptions {
  autoFetch?: boolean
}

export function useProperties(options: UsePropertiesOptions = {}) {
  const { autoFetch = true } = options
  const [properties, setProperties] = useState<Property[]>([])
  const [isLoading, setIsLoading] = useState(autoFetch)
  const [error, setError] = useState<string | null>(null)

  const fetchProperties = useCallback(async () => {
    setIsLoading(true)
    setError(null)

    try {
      const response = await fetch('/api/properties', {
        credentials: 'include',
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Failed to fetch properties' }))
        throw new Error(errorData.error || 'Failed to fetch properties')
      }

      const data = await response.json()
      setProperties(data.properties)
    } catch (err) {
      const message = err instanceof Error ? err.message : 'An error occurred'
      setError(message)
      console.error('Error fetching properties:', err)
    } finally {
      setIsLoading(false)
    }
  }, [])

  const createProperty = useCallback(async (propertyData: Partial<Property>) => {
    setIsLoading(true)
    setError(null)

    try {
      const response = await fetch('/api/properties', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(propertyData),
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Failed to create property' }))
        throw new Error(errorData.error || 'Failed to create property')
      }

      const data = await response.json()
      setProperties((prev) => [...prev, data.property])
      toast.success('Imóvel criado com sucesso!')
      return data.property
    } catch (err) {
      const message = err instanceof Error ? err.message : 'An error occurred'
      setError(message)
      toast.error('Erro ao criar imóvel', {
        description: message
      })
      console.error('Error creating property:', err)
      throw err
    } finally {
      setIsLoading(false)
    }
  }, [])

  const updateProperty = useCallback(async (id: string, propertyData: Partial<Property>) => {
    setIsLoading(true)
    setError(null)

    try {
      const response = await fetch(`/api/properties/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(propertyData),
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Failed to update property' }))
        throw new Error(errorData.error || 'Failed to update property')
      }

      const data = await response.json()
      setProperties((prev) =>
        prev.map((p) => (p.id === id ? data.property : p))
      )
      toast.success('Imóvel atualizado com sucesso!')
      return data.property
    } catch (err) {
      const message = err instanceof Error ? err.message : 'An error occurred'
      setError(message)
      toast.error('Erro ao atualizar imóvel', {
        description: message
      })
      console.error('Error updating property:', err)
      throw err
    } finally {
      setIsLoading(false)
    }
  }, [])

  const deleteProperty = useCallback(async (id: string) => {
    setIsLoading(true)
    setError(null)

    try {
      const response = await fetch(`/api/properties/${id}`, {
        method: 'DELETE',
        credentials: 'include',
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Failed to delete property' }))
        throw new Error(errorData.error || 'Failed to delete property')
      }

      setProperties((prev) => prev.filter((p) => p.id !== id))
      toast.success('Imóvel deletado com sucesso!')
    } catch (err) {
      const message = err instanceof Error ? err.message : 'An error occurred'
      setError(message)
      toast.error('Erro ao deletar imóvel', {
        description: message
      })
      console.error('Error deleting property:', err)
      throw err
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    if (autoFetch) {
      fetchProperties()
    }
  }, [autoFetch, fetchProperties])

  return {
    properties,
    isLoading,
    error,
    fetchProperties,
    createProperty,
    updateProperty,
    deleteProperty,
  }
}

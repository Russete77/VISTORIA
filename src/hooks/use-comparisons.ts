'use client'

import { useEffect, useState, useCallback } from 'react'
import { toast } from 'sonner'
import type { Comparison, ComparisonWithDetails, CreateComparisonInput } from '@/types/database'

interface UseComparisonsOptions {
  autoFetch?: boolean
  propertyId?: string
}

export function useComparisons(options: UseComparisonsOptions = {}) {
  const { autoFetch = true, propertyId } = options
  const [comparisons, setComparisons] = useState<Comparison[]>([])
  const [isLoading, setIsLoading] = useState(autoFetch)
  const [error, setError] = useState<string | null>(null)

  const fetchComparisons = useCallback(async () => {
    setIsLoading(true)
    setError(null)

    try {
      const url = propertyId
        ? `/api/comparisons?property_id=${propertyId}`
        : '/api/comparisons'

      const response = await fetch(url, {
        credentials: 'include',
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Failed to fetch comparisons' }))
        throw new Error(errorData.error || 'Failed to fetch comparisons')
      }

      const data = await response.json()
      setComparisons(data.comparisons)
    } catch (err) {
      const message = err instanceof Error ? err.message : 'An error occurred'
      setError(message)
      console.error('Error fetching comparisons:', err)
    } finally {
      setIsLoading(false)
    }
  }, [propertyId])

  const getComparison = useCallback(async (id: string): Promise<ComparisonWithDetails | null> => {
    try {
      const response = await fetch(`/api/comparisons/${id}`, {
        credentials: 'include',
      })
      if (!response.ok) {
        throw new Error('Failed to fetch comparison')
      }

      const data = await response.json()
      return data.comparison
    } catch (err) {
      console.error('Error fetching comparison:', err)
      return null
    }
  }, [])

  const createComparison = useCallback(async (comparisonData: CreateComparisonInput) => {
    setIsLoading(true)
    setError(null)

    try {
      const response = await fetch('/api/comparisons', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(comparisonData),
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Failed to create comparison' }))
        throw new Error(errorData.error || 'Failed to create comparison')
      }

      const data = await response.json()
      setComparisons((prev) => [data.comparison, ...prev])
      toast.success('Comparação criada com sucesso!', {
        description: 'O processamento está em andamento. Você será notificado quando concluir.',
      })
      return data.comparison
    } catch (err) {
      const message = err instanceof Error ? err.message : 'An error occurred'
      setError(message)
      toast.error('Erro ao criar comparação', {
        description: message
      })
      console.error('Error creating comparison:', err)
      throw err
    } finally {
      setIsLoading(false)
    }
  }, [])

  const deleteComparison = useCallback(async (id: string) => {
    setIsLoading(true)
    setError(null)

    try {
      const response = await fetch(`/api/comparisons/${id}`, {
        method: 'DELETE',
        credentials: 'include',
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Failed to delete comparison' }))
        throw new Error(errorData.error || 'Failed to delete comparison')
      }

      setComparisons((prev) => prev.filter((c) => c.id !== id))
      toast.success('Comparação deletada com sucesso!')
    } catch (err) {
      const message = err instanceof Error ? err.message : 'An error occurred'
      setError(message)
      toast.error('Erro ao deletar comparação', {
        description: message
      })
      console.error('Error deleting comparison:', err)
      throw err
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    if (autoFetch) {
      fetchComparisons()
    }
  }, [autoFetch, fetchComparisons])

  return {
    comparisons,
    isLoading,
    error,
    fetchComparisons,
    getComparison,
    createComparison,
    deleteComparison,
  }
}

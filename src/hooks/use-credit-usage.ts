'use client'

import { useEffect, useState, useCallback } from 'react'
import type { CreditUsage } from '@/types/database'

interface UseCreditUsageOptions {
  autoFetch?: boolean
  limit?: number
}

export function useCreditUsage(options: UseCreditUsageOptions = {}) {
  const { autoFetch = true, limit } = options
  const [creditUsage, setCreditUsage] = useState<CreditUsage[]>([])
  const [isLoading, setIsLoading] = useState(autoFetch)
  const [error, setError] = useState<string | null>(null)

  const fetchCreditUsage = useCallback(async () => {
    setIsLoading(true)
    setError(null)

    try {
      const params = new URLSearchParams()
      if (limit) params.append('limit', limit.toString())

      const url = `/api/credit-usage${params.toString() ? `?${params}` : ''}`
      const response = await fetch(url)

      if (!response.ok) {
        throw new Error('Failed to fetch credit usage')
      }

      const data = await response.json()
      setCreditUsage(data.creditUsage)
    } catch (err) {
      const message = err instanceof Error ? err.message : 'An error occurred'
      setError(message)
      console.error('Error fetching credit usage:', err)
    } finally {
      setIsLoading(false)
    }
  }, [limit])

  useEffect(() => {
    if (autoFetch) {
      fetchCreditUsage()
    }
  }, [autoFetch, fetchCreditUsage])

  return {
    creditUsage,
    isLoading,
    error,
    fetchCreditUsage,
  }
}

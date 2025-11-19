'use client'

import { useEffect, useState, useCallback } from 'react'
import type { Transaction } from '@/types/database'

interface UseTransactionsOptions {
  autoFetch?: boolean
  type?: string
  status?: string
  limit?: number
}

export function useTransactions(options: UseTransactionsOptions = {}) {
  const { autoFetch = true, type, status, limit } = options
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [isLoading, setIsLoading] = useState(autoFetch)
  const [error, setError] = useState<string | null>(null)

  const fetchTransactions = useCallback(async () => {
    setIsLoading(true)
    setError(null)

    try {
      const params = new URLSearchParams()
      if (type) params.append('type', type)
      if (status) params.append('status', status)
      if (limit) params.append('limit', limit.toString())

      const url = `/api/transactions${params.toString() ? `?${params}` : ''}`
      const response = await fetch(url)

      if (!response.ok) {
        throw new Error('Failed to fetch transactions')
      }

      const data = await response.json()
      setTransactions(data.transactions)
    } catch (err) {
      const message = err instanceof Error ? err.message : 'An error occurred'
      setError(message)
      console.error('Error fetching transactions:', err)
    } finally {
      setIsLoading(false)
    }
  }, [type, status, limit])

  useEffect(() => {
    if (autoFetch) {
      fetchTransactions()
    }
  }, [autoFetch, fetchTransactions])

  return {
    transactions,
    isLoading,
    error,
    fetchTransactions,
  }
}

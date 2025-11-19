'use client'

import { useEffect, useState, useCallback } from 'react'
import type { User } from '@/types/database'

interface UseUserOptions {
  autoFetch?: boolean
}

export function useUser(options: UseUserOptions = {}) {
  const { autoFetch = true } = options
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(autoFetch)
  const [error, setError] = useState<string | null>(null)

  const fetchUser = useCallback(async () => {
    setIsLoading(true)
    setError(null)

    try {
      const response = await fetch('/api/user')
      if (!response.ok) {
        throw new Error('Failed to fetch user')
      }

      const data = await response.json()
      setUser(data.user)
    } catch (err) {
      const message = err instanceof Error ? err.message : 'An error occurred'
      setError(message)
      console.error('Error fetching user:', err)
    } finally {
      setIsLoading(false)
    }
  }, [])

  const updateUser = useCallback(async (userData: Partial<User>) => {
    setIsLoading(true)
    setError(null)

    try {
      const response = await fetch('/api/user', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(userData),
      })

      if (!response.ok) {
        throw new Error('Failed to update user')
      }

      const data = await response.json()
      setUser(data.user)
      return data.user
    } catch (err) {
      const message = err instanceof Error ? err.message : 'An error occurred'
      setError(message)
      console.error('Error updating user:', err)
      throw err
    } finally {
      setIsLoading(false)
    }
  }, [])

  const syncUser = useCallback(async () => {
    setIsLoading(true)
    setError(null)

    try {
      const response = await fetch('/api/user', {
        method: 'POST',
      })

      if (!response.ok) {
        throw new Error('Failed to sync user')
      }

      const data = await response.json()
      setUser(data.user)
      return data
    } catch (err) {
      const message = err instanceof Error ? err.message : 'An error occurred'
      setError(message)
      console.error('Error syncing user:', err)
      throw err
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    if (autoFetch) {
      fetchUser()
    }
  }, [autoFetch, fetchUser])

  return {
    user,
    isLoading,
    error,
    fetchUser,
    updateUser,
    syncUser,
  }
}

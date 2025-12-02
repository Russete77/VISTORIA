import { useUser as useClerkUser } from '@clerk/nextjs'
import { useEffect, useState } from 'react'
import type { User } from '@/types/database'
import { isDeveloper, getEffectiveCredits } from '@/lib/auth/dev-access'

export function useAuth() {
  const { user: clerkUser, isLoaded, isSignedIn } = useClerkUser()
  const [dbUser, setDbUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  const fetchUser = async () => {
    if (!isLoaded || !isSignedIn || !clerkUser) {
      setIsLoading(false)
      return
    }

    try {
      const response = await fetch('/api/user')
      if (!response.ok) throw new Error('Failed to fetch user')

      const data = await response.json()
      setDbUser(data.user)
    } catch (error) {
      console.error('Error fetching user:', error)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchUser()
  }, [clerkUser, isLoaded, isSignedIn])

  const refreshUser = async () => {
    try {
      const response = await fetch('/api/user')
      if (!response.ok) throw new Error('Failed to fetch user')

      const data = await response.json()
      setDbUser(data.user)
    } catch (error) {
      console.error('Error refreshing user:', error)
      throw error
    }
  }

  const effectiveCredits = getEffectiveCredits(dbUser?.credits ?? 0, dbUser?.email)
  const isDevUser = isDeveloper(dbUser?.email)

  return {
    user: dbUser,
    clerkUser,
    isLoading,
    isSignedIn,
    hasCredits: effectiveCredits > 0,
    tier: dbUser?.tier ?? 'free',
    isDeveloper: isDevUser,
    effectiveCredits,
    refreshUser,
  }
}

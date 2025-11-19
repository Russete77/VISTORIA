import { useUser as useClerkUser } from '@clerk/nextjs'
import { useEffect, useState } from 'react'
import type { User } from '@/types/database'

export function useAuth() {
  const { user: clerkUser, isLoaded, isSignedIn } = useClerkUser()
  const [dbUser, setDbUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    async function fetchUser() {
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

    fetchUser()
  }, [clerkUser, isLoaded, isSignedIn])

  return {
    user: dbUser,
    clerkUser,
    isLoading,
    isSignedIn,
    hasCredits: (dbUser?.credits ?? 0) > 0,
    tier: dbUser?.tier ?? 'free',
  }
}

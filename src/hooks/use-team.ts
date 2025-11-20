'use client'

import { useEffect, useState, useCallback } from 'react'
import { toast } from 'sonner'
import type { TeamMemberWithStats, TeamActivityWithMember, TeamRole } from '@/types/database'

interface UseTeamOptions {
  autoFetch?: boolean
}

interface TeamStats {
  total: number
  active: number
  pending: number
  totalInspections: number
  totalReports: number
}

interface TeamLimits {
  current: number
  max: number
  canAddMore: boolean
}

interface TeamData {
  members: TeamMemberWithStats[]
  stats: TeamStats
  limits: TeamLimits
}

interface ActivityData {
  activities: TeamActivityWithMember[]
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
    hasNextPage: boolean
    hasPrevPage: boolean
  }
}

export function useTeam(options: UseTeamOptions = {}) {
  const { autoFetch = true } = options
  const [teamData, setTeamData] = useState<TeamData | null>(null)
  const [isLoading, setIsLoading] = useState(autoFetch)
  const [error, setError] = useState<string | null>(null)

  const fetchTeam = useCallback(async (filters?: {
    role?: string
    status?: string
    search?: string
  }) => {
    setIsLoading(true)
    setError(null)

    try {
      const params = new URLSearchParams()
      if (filters?.role) params.append('role', filters.role)
      if (filters?.status) params.append('status', filters.status)
      if (filters?.search) params.append('search', filters.search)

      const response = await fetch(`/api/team/members?${params.toString()}`, {
        credentials: 'include',
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Failed to fetch team' }))
        throw new Error(errorData.error || 'Failed to fetch team')
      }

      const data = await response.json()
      setTeamData(data)
    } catch (err) {
      const message = err instanceof Error ? err.message : 'An error occurred'
      setError(message)
      console.error('Error fetching team:', err)
    } finally {
      setIsLoading(false)
    }
  }, [])

  const inviteMember = useCallback(async (email: string, role: TeamRole) => {
    setIsLoading(true)
    setError(null)

    try {
      const response = await fetch('/api/team/invite', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ email, role }),
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Failed to invite member' }))
        throw new Error(errorData.error || 'Failed to invite member')
      }

      const data = await response.json()
      toast.success(data.message || 'Convite enviado com sucesso')

      // Refresh team data
      await fetchTeam()

      return data
    } catch (err) {
      const message = err instanceof Error ? err.message : 'An error occurred'
      setError(message)
      toast.error(message)
      throw err
    } finally {
      setIsLoading(false)
    }
  }, [fetchTeam])

  const removeMember = useCallback(async (memberId: string) => {
    setIsLoading(true)
    setError(null)

    try {
      const response = await fetch(`/api/team/members/${memberId}`, {
        method: 'DELETE',
        credentials: 'include',
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Failed to remove member' }))
        throw new Error(errorData.error || 'Failed to remove member')
      }

      const data = await response.json()
      toast.success(data.message || 'Membro removido com sucesso')

      // Refresh team data
      await fetchTeam()

      return data
    } catch (err) {
      const message = err instanceof Error ? err.message : 'An error occurred'
      setError(message)
      toast.error(message)
      throw err
    } finally {
      setIsLoading(false)
    }
  }, [fetchTeam])

  const updateMemberRole = useCallback(async (memberId: string, role: TeamRole) => {
    setIsLoading(true)
    setError(null)

    try {
      const response = await fetch(`/api/team/members/${memberId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ role }),
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Failed to update role' }))
        throw new Error(errorData.error || 'Failed to update role')
      }

      const data = await response.json()
      toast.success(data.message || 'Função atualizada com sucesso')

      // Refresh team data
      await fetchTeam()

      return data
    } catch (err) {
      const message = err instanceof Error ? err.message : 'An error occurred'
      setError(message)
      toast.error(message)
      throw err
    } finally {
      setIsLoading(false)
    }
  }, [fetchTeam])

  useEffect(() => {
    if (autoFetch) {
      fetchTeam()
    }
  }, [autoFetch, fetchTeam])

  return {
    // Data
    members: teamData?.members || [],
    stats: teamData?.stats || {
      total: 0,
      active: 0,
      pending: 0,
      totalInspections: 0,
      totalReports: 0,
    },
    limits: teamData?.limits || {
      current: 0,
      max: 1,
      canAddMore: false,
    },

    // State
    isLoading,
    error,

    // Actions
    fetchTeam,
    inviteMember,
    removeMember,
    updateMemberRole,

    // Utilities
    canAddMore: teamData?.limits.canAddMore || false,
    isAtLimit: teamData?.limits.current === teamData?.limits.max,
  }
}

interface UseTeamActivityOptions {
  autoFetch?: boolean
  page?: number
  limit?: number
  memberId?: string
  action?: string
  entityType?: string
}

export function useTeamActivity(options: UseTeamActivityOptions = {}) {
  const {
    autoFetch = true,
    page = 1,
    limit = 20,
    memberId,
    action,
    entityType,
  } = options

  const [activityData, setActivityData] = useState<ActivityData | null>(null)
  const [isLoading, setIsLoading] = useState(autoFetch)
  const [error, setError] = useState<string | null>(null)

  const fetchActivity = useCallback(async (customFilters?: {
    page?: number
    limit?: number
    memberId?: string
    action?: string
    entityType?: string
  }) => {
    setIsLoading(true)
    setError(null)

    try {
      const filters = customFilters || { page, limit, memberId, action, entityType }
      const params = new URLSearchParams()

      if (filters.page) params.append('page', filters.page.toString())
      if (filters.limit) params.append('limit', filters.limit.toString())
      if (filters.memberId) params.append('member_id', filters.memberId)
      if (filters.action) params.append('action', filters.action)
      if (filters.entityType) params.append('entity_type', filters.entityType)

      const response = await fetch(`/api/team/activity?${params.toString()}`, {
        credentials: 'include',
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Failed to fetch activity' }))
        throw new Error(errorData.error || 'Failed to fetch activity')
      }

      const data = await response.json()
      setActivityData(data)
    } catch (err) {
      const message = err instanceof Error ? err.message : 'An error occurred'
      setError(message)
      console.error('Error fetching team activity:', err)
    } finally {
      setIsLoading(false)
    }
  }, [page, limit, memberId, action, entityType])

  const logActivity = useCallback(async (
    activityAction: string,
    entityTypeParam?: string,
    entityId?: string,
    metadata?: Record<string, unknown>
  ) => {
    try {
      const response = await fetch('/api/team/activity', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          action: activityAction,
          entity_type: entityTypeParam,
          entity_id: entityId,
          metadata,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Failed to log activity' }))
        throw new Error(errorData.error || 'Failed to log activity')
      }

      return await response.json()
    } catch (err) {
      console.error('Error logging activity:', err)
      throw err
    }
  }, [])

  useEffect(() => {
    if (autoFetch) {
      fetchActivity()
    }
  }, [autoFetch, fetchActivity])

  return {
    // Data
    activities: activityData?.activities || [],
    pagination: activityData?.pagination || {
      page: 1,
      limit: 20,
      total: 0,
      totalPages: 0,
      hasNextPage: false,
      hasPrevPage: false,
    },

    // State
    isLoading,
    error,

    // Actions
    fetchActivity,
    logActivity,
  }
}

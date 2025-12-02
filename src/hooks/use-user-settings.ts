/**
 * useUserSettings Hook - VistorIA Pro
 * Manages user settings (disputes toggle, AI strictness)
 * Fetches and updates user_settings table
 */

import { useState, useEffect, useCallback } from 'react'
import { toast } from 'sonner'
import type { UserSettings, AIStrictnessLevel } from '@/types/database'

interface UseUserSettingsReturn {
  settings: UserSettings | null
  loading: boolean
  error: Error | null
  updateSettings: (updates: Partial<UserSettings>) => Promise<void>
  refreshSettings: () => Promise<void>
}

export function useUserSettings(): UseUserSettingsReturn {
  const [settings, setSettings] = useState<UserSettings | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  /**
   * Fetch user settings from API
   * Creates default settings if they don't exist
   */
  const fetchSettings = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)

      const response = await fetch('/api/user/settings', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to fetch settings')
      }

      const data = await response.json()
      setSettings(data.settings)
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Unknown error')
      setError(error)
      console.error('Error fetching user settings:', error)
      toast.error('Erro ao carregar configurações')
    } finally {
      setLoading(false)
    }
  }, [])

  /**
   * Update user settings
   */
  const updateSettings = useCallback(async (updates: Partial<UserSettings>) => {
    try {
      setError(null)

      // Optimistic update
      if (settings) {
        setSettings({ ...settings, ...updates })
      }

      const response = await fetch('/api/user/settings', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updates),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to update settings')
      }

      const data = await response.json()
      setSettings(data.settings)
      toast.success('Configurações atualizadas com sucesso')
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Unknown error')
      setError(error)
      console.error('Error updating user settings:', error)
      toast.error('Erro ao atualizar configurações')

      // Revert optimistic update on error
      await fetchSettings()
    }
  }, [settings, fetchSettings])

  /**
   * Refresh settings from server
   */
  const refreshSettings = useCallback(async () => {
    await fetchSettings()
  }, [fetchSettings])

  // Fetch settings on mount
  useEffect(() => {
    fetchSettings()
  }, [fetchSettings])

  return {
    settings,
    loading,
    error,
    updateSettings,
    refreshSettings,
  }
}

/**
 * Helper function to get strictness display info
 */
export function getStrictnessInfo(level: AIStrictnessLevel): {
  emoji: string
  label: string
  description: string
} {
  switch (level) {
    case 'standard':
      return {
        emoji: '⚖️',
        label: 'Padrão',
        description: 'Análise equilibrada. Detecta problemas evidentes.',
      }
    case 'strict':
      return {
        emoji: '🔍',
        label: 'Rigoroso',
        description: 'Mais crítico. Detecta problemas menores.',
      }
    case 'very_strict':
      return {
        emoji: '🔬',
        label: 'Muito Rigoroso',
        description: 'Hiper-crítico. Detecta micro-detalhes.',
      }
  }
}

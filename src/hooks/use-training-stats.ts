'use client'

import { useState, useEffect } from 'react'
import useSWR from 'swr'

interface TrainingStats {
  totalInspections: number
  totalTrainingPhotos: number
  targetMilestone: number
  progressPercentage: number
  daysToMilestone: number | null
  isBetaPhase: boolean
}

const fetcher = (url: string) => fetch(url).then((res) => res.json())

/**
 * Hook to get global AI training statistics
 * Tracks progress toward 3,000 inspections milestone
 */
export function useTrainingStats() {
  const { data, error, isLoading, mutate } = useSWR<{
    totalInspections: number
    totalTrainingPhotos: number
    inspectionsThisWeek: number
    avgInspectionsPerDay: number
  }>('/api/training-stats', fetcher, {
    refreshInterval: 60000, // Refresh every minute
    revalidateOnFocus: true,
  })

  const [stats, setStats] = useState<TrainingStats>({
    totalInspections: 0,
    totalTrainingPhotos: 0,
    targetMilestone: 3000,
    progressPercentage: 0,
    daysToMilestone: null,
    isBetaPhase: true,
  })

  useEffect(() => {
    if (data) {
      const totalInspections = data.totalInspections || 0
      const targetMilestone = 3000
      const progressPercentage = Math.min(
        Math.round((totalInspections / targetMilestone) * 100),
        100
      )

      // Calculate estimated days to milestone
      let daysToMilestone: number | null = null
      if (data.avgInspectionsPerDay > 0) {
        const remaining = targetMilestone - totalInspections
        daysToMilestone = Math.ceil(remaining / data.avgInspectionsPerDay)
      }

      setStats({
        totalInspections,
        totalTrainingPhotos: data.totalTrainingPhotos || 0,
        targetMilestone,
        progressPercentage,
        daysToMilestone,
        isBetaPhase: totalInspections < targetMilestone,
      })
    }
  }, [data])

  return {
    ...stats,
    isLoading,
    error,
    refresh: mutate,
  }
}

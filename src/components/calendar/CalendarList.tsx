'use client'

import { useMemo } from 'react'
import { Calendar } from 'lucide-react'
import { CalendarEventCard } from './CalendarEventBadge'
import type { CalendarItem } from '@/lib/validations/calendar'

interface CalendarListProps {
  items: CalendarItem[]
  isLoading: boolean
  onEventClick: (event: CalendarItem) => void
}

export function CalendarList({ items, isLoading, onEventClick }: CalendarListProps) {
  // Group items by date
  const groupedItems = useMemo(() => {
    const groups: { date: string; label: string; items: CalendarItem[] }[] = []
    const itemsByDate: Record<string, CalendarItem[]> = {}
    
    // Group by start date
    for (const item of items) {
      const dateKey = item.startDate
      if (!itemsByDate[dateKey]) {
        itemsByDate[dateKey] = []
      }
      itemsByDate[dateKey].push(item)
    }
    
    // Sort dates and create groups
    const sortedDates = Object.keys(itemsByDate).sort()
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    
    for (const dateKey of sortedDates) {
      const date = new Date(dateKey + 'T00:00:00')
      let label: string
      
      const diffDays = Math.floor((date.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
      
      if (diffDays === 0) {
        label = 'Hoje'
      } else if (diffDays === 1) {
        label = 'Amanhã'
      } else if (diffDays === -1) {
        label = 'Ontem'
      } else {
        label = date.toLocaleDateString('pt-BR', {
          weekday: 'long',
          day: 'numeric',
          month: 'long',
        })
        // Capitalize first letter
        label = label.charAt(0).toUpperCase() + label.slice(1)
      }
      
      groups.push({
        date: dateKey,
        label,
        items: itemsByDate[dateKey],
      })
    }
    
    return groups
  }, [items])

  if (isLoading) {
    return (
      <div className="p-6 space-y-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="animate-pulse">
            <div className="h-4 w-32 bg-neutral-200 rounded mb-3" />
            <div className="h-20 bg-neutral-100 rounded-lg" />
          </div>
        ))}
      </div>
    )
  }

  if (items.length === 0) {
    return (
      <div className="p-12 text-center">
        <div className="inline-flex h-16 w-16 items-center justify-center rounded-full bg-neutral-100 mb-4">
          <Calendar className="h-8 w-8 text-neutral-400" />
        </div>
        <h3 className="text-lg font-semibold text-neutral-900 mb-2">
          Nenhum evento neste período
        </h3>
        <p className="text-neutral-600 text-sm">
          Crie um novo compromisso ou aguarde novas reservas e vistorias
        </p>
      </div>
    )
  }

  return (
    <div className="p-4 sm:p-6 space-y-6 max-h-[600px] overflow-y-auto">
      {groupedItems.map((group) => (
        <div key={group.date}>
          <h3 className="text-sm font-semibold text-neutral-500 uppercase tracking-wide mb-3">
            {group.label}
          </h3>
          <div className="space-y-2">
            {group.items.map((item) => (
              <CalendarEventCard
                key={`${item.type}-${item.id}`}
                event={item}
                onClick={() => onEventClick(item)}
              />
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}

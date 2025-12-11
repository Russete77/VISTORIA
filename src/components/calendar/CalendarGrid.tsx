'use client'

import { useMemo } from 'react'
import { cn } from '@/lib/utils'
import { CalendarEventBadge } from './CalendarEventBadge'
import type { CalendarItem } from '@/lib/validations/calendar'

interface CalendarGridProps {
  currentDate: Date
  itemsByDate: Record<string, CalendarItem[]>
  isLoading: boolean
  onDateClick: (date: Date) => void
  onEventClick: (event: CalendarItem) => void
}

export function CalendarGrid({
  currentDate,
  itemsByDate,
  isLoading,
  onDateClick,
  onEventClick,
}: CalendarGridProps) {
  // Generate calendar days
  const calendarDays = useMemo(() => {
    const year = currentDate.getFullYear()
    const month = currentDate.getMonth()
    
    const firstDay = new Date(year, month, 1)
    const lastDay = new Date(year, month + 1, 0)
    
    // Start from Sunday of the first week
    const startDayOfWeek = firstDay.getDay()
    const days: Date[] = []
    
    // Add days from previous month
    for (let i = startDayOfWeek - 1; i >= 0; i--) {
      days.push(new Date(year, month, -i))
    }
    
    // Add days of current month
    for (let day = 1; day <= lastDay.getDate(); day++) {
      days.push(new Date(year, month, day))
    }
    
    // Add days from next month to complete the grid (6 rows)
    const endDayOfWeek = lastDay.getDay()
    const daysToAdd = 6 - endDayOfWeek
    for (let i = 1; i <= daysToAdd; i++) {
      days.push(new Date(year, month + 1, i))
    }
    
    // Ensure we have 6 complete rows (42 days)
    while (days.length < 42) {
      const lastDate = days[days.length - 1]
      days.push(new Date(lastDate.getFullYear(), lastDate.getMonth(), lastDate.getDate() + 1))
    }
    
    return days
  }, [currentDate])

  const today = new Date()
  const isToday = (date: Date) => {
    return (
      date.getDate() === today.getDate() &&
      date.getMonth() === today.getMonth() &&
      date.getFullYear() === today.getFullYear()
    )
  }

  const isCurrentMonth = (date: Date) => {
    return date.getMonth() === currentDate.getMonth()
  }

  const getDateKey = (date: Date) => {
    return date.toISOString().split('T')[0]
  }

  return (
    <div className="grid grid-cols-7 divide-x divide-neutral-200">
      {calendarDays.map((day, index) => {
        const dateKey = getDateKey(day)
        const dayEvents = itemsByDate[dateKey] || []
        const isTodayDate = isToday(day)
        const isInCurrentMonth = isCurrentMonth(day)
        const isWeekend = day.getDay() === 0 || day.getDay() === 6
        
        // Split events by row (for visual display)
        const isFirstRow = index < 7
        
        return (
          <div
            key={dateKey}
            className={cn(
              'min-h-[80px] sm:min-h-[120px] p-1 sm:p-2 border-b border-neutral-200 transition-colors',
              'hover:bg-neutral-50 cursor-pointer',
              !isInCurrentMonth && 'bg-neutral-50/50',
              isWeekend && isInCurrentMonth && 'bg-neutral-50/30',
              isFirstRow && index > 0 && 'border-l',
            )}
            onClick={() => onDateClick(day)}
          >
            {/* Day Number */}
            <div className="flex items-center justify-between mb-1">
              <span
                className={cn(
                  'inline-flex items-center justify-center w-6 h-6 sm:w-7 sm:h-7 text-xs sm:text-sm font-medium rounded-full transition-colors',
                  isTodayDate && 'bg-primary-600 text-white',
                  !isTodayDate && isInCurrentMonth && 'text-neutral-900',
                  !isTodayDate && !isInCurrentMonth && 'text-neutral-400',
                )}
              >
                {day.getDate()}
              </span>
            </div>

            {/* Events */}
            <div className="space-y-0.5 sm:space-y-1">
              {isLoading ? (
                <div className="h-4 bg-neutral-200 rounded animate-pulse" />
              ) : (
                <>
                  {/* Show first 2-3 events */}
                  {dayEvents.slice(0, 3).map((event) => (
                    <CalendarEventBadge
                      key={`${event.type}-${event.id}`}
                      event={event}
                      onClick={(e) => {
                        e.stopPropagation()
                        onEventClick(event)
                      }}
                    />
                  ))}
                  {/* Show "more" indicator */}
                  {dayEvents.length > 3 && (
                    <button
                      className="text-xs text-primary-600 hover:text-primary-800 font-medium pl-1"
                      onClick={(e) => {
                        e.stopPropagation()
                        onDateClick(day)
                      }}
                    >
                      +{dayEvents.length - 3} mais
                    </button>
                  )}
                </>
              )}
            </div>
          </div>
        )
      })}
    </div>
  )
}

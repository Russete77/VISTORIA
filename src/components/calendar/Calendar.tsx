'use client'

import { useState, useMemo, useEffect, useImperativeHandle, forwardRef } from 'react'
import { ChevronLeft, ChevronRight, List, LayoutGrid } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { CalendarGrid } from './CalendarGrid'
import { CalendarList } from './CalendarList'
import { CalendarEventModal } from './CalendarEventModal'
import { useCalendar } from '@/hooks/use-calendar'
import type { CalendarItem } from '@/lib/validations/calendar'
import type { Property } from '@/types/database'

interface CalendarProps {
  properties?: Property[]
  className?: string
  onNewEventRef?: React.MutableRefObject<(() => void) | null>
}

const WEEKDAYS = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb']
const MONTHS = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
]

export function Calendar({ properties = [], className, onNewEventRef }: CalendarProps) {
  const [currentDate, setCurrentDate] = useState(new Date())
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [selectedDate, setSelectedDate] = useState<Date | null>(null)
  const [isEventModalOpen, setIsEventModalOpen] = useState(false)
  const [selectedEvent, setSelectedEvent] = useState<CalendarItem | null>(null)

  // Calculate date range for fetching
  const dateRange = useMemo(() => {
    const year = currentDate.getFullYear()
    const month = currentDate.getMonth()
    
    // Get first day of month and find the start of that week
    const firstDay = new Date(year, month, 1)
    const startDayOfWeek = firstDay.getDay()
    const fromDate = new Date(year, month, 1 - startDayOfWeek)
    
    // Get last day of month and find the end of that week
    const lastDay = new Date(year, month + 1, 0)
    const endDayOfWeek = lastDay.getDay()
    const toDate = new Date(year, month + 1, 6 - endDayOfWeek)
    
    return {
      fromDate: fromDate.toISOString().split('T')[0],
      toDate: toDate.toISOString().split('T')[0],
    }
  }, [currentDate])

  const { items, itemsByDate, isLoading, fetchCalendar, createEvent, deleteEvent } = useCalendar({
    autoFetch: true,
    fromDate: dateRange.fromDate,
    toDate: dateRange.toDate,
  })

  // Navigate months
  const goToPreviousMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1))
  }

  const goToNextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1))
  }

  const goToToday = () => {
    setCurrentDate(new Date())
  }

  // Handle date click (for creating new event)
  const handleDateClick = (date: Date) => {
    setSelectedDate(date)
    setSelectedEvent(null)
    setIsEventModalOpen(true)
  }

  // Handle event click (for viewing/editing)
  const handleEventClick = (event: CalendarItem) => {
    setSelectedEvent(event)
    setIsEventModalOpen(true)
  }

  // Handle new event button
  const handleNewEvent = () => {
    setSelectedDate(new Date())
    setSelectedEvent(null)
    setIsEventModalOpen(true)
  }

  // Expose handleNewEvent to parent via ref
  useEffect(() => {
    if (onNewEventRef) {
      onNewEventRef.current = handleNewEvent
    }
    return () => {
      if (onNewEventRef) {
        onNewEventRef.current = null
      }
    }
  }, [onNewEventRef])

  // Handle modal close
  const handleModalClose = () => {
    setIsEventModalOpen(false)
    setSelectedDate(null)
    setSelectedEvent(null)
  }

  // Handle event created
  const handleEventCreated = async () => {
    handleModalClose()
    await fetchCalendar({ fromDate: dateRange.fromDate, toDate: dateRange.toDate })
  }

  return (
    <div className={cn('bg-white rounded-xl border border-neutral-200 overflow-hidden', className)}>
      {/* Calendar Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 sm:p-6 border-b border-neutral-200">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="icon"
              onClick={goToPreviousMonth}
              className="h-8 w-8"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              onClick={goToNextMonth}
              className="h-8 w-8"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
          <div>
            <h2 className="text-lg sm:text-xl font-bold text-neutral-900">
              {MONTHS[currentDate.getMonth()]} {currentDate.getFullYear()}
            </h2>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={goToToday}
            className="hidden sm:inline-flex text-primary-600 hover:text-primary-700"
          >
            Hoje
          </Button>
        </div>

        <div className="flex items-center gap-2">
          {/* View Toggle */}
          <div className="flex items-center rounded-lg border border-neutral-200 p-1">
            <Button
              variant={viewMode === 'grid' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('grid')}
              className="h-7 px-2"
            >
              <LayoutGrid className="h-4 w-4" />
            </Button>
            <Button
              variant={viewMode === 'list' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('list')}
              className="h-7 px-2"
            >
              <List className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Calendar Content */}
      {viewMode === 'grid' ? (
        <>
          {/* Weekday Headers */}
          <div className="grid grid-cols-7 border-b border-neutral-200">
            {WEEKDAYS.map((day) => (
              <div
                key={day}
                className="py-2 px-1 text-center text-xs sm:text-sm font-medium text-neutral-600 bg-neutral-50"
              >
                {day}
              </div>
            ))}
          </div>

          {/* Calendar Grid */}
          <CalendarGrid
            currentDate={currentDate}
            itemsByDate={itemsByDate}
            isLoading={isLoading}
            onDateClick={handleDateClick}
            onEventClick={handleEventClick}
          />
        </>
      ) : (
        <CalendarList
          items={items}
          isLoading={isLoading}
          onEventClick={handleEventClick}
        />
      )}

      {/* Legend */}
      <div className="flex flex-wrap items-center gap-4 p-4 border-t border-neutral-200 bg-neutral-50">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-green-500" />
          <span className="text-xs text-neutral-600">Reservas</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-purple-500" />
          <span className="text-xs text-neutral-600">Vistorias</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-blue-500" />
          <span className="text-xs text-neutral-600">Compromissos</span>
        </div>
      </div>

      {/* Event Modal */}
      <CalendarEventModal
        isOpen={isEventModalOpen}
        onClose={handleModalClose}
        selectedDate={selectedDate}
        selectedEvent={selectedEvent}
        properties={properties}
        onEventCreated={handleEventCreated}
        onEventDeleted={async (id) => {
          await deleteEvent(id)
          handleModalClose()
        }}
      />
    </div>
  )
}

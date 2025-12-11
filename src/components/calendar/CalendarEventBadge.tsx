'use client'

import { cn } from '@/lib/utils'
import { eventColors, type CalendarItem } from '@/lib/validations/calendar'
import { Calendar, Home, FileSearch, Tag } from 'lucide-react'

interface CalendarEventBadgeProps {
  event: CalendarItem
  onClick?: (e: React.MouseEvent) => void
  showDate?: boolean
  className?: string
}

const typeIcons = {
  booking: Home,
  inspection: FileSearch,
  event: Tag,
}

const typeLabels = {
  booking: 'Reserva',
  inspection: 'Vistoria',
  event: 'Compromisso',
}

export function CalendarEventBadge({
  event,
  onClick,
  showDate = false,
  className,
}: CalendarEventBadgeProps) {
  const Icon = typeIcons[event.type]
  const colorClasses = eventColors[event.color] || eventColors.blue
  
  return (
    <button
      className={cn(
        'w-full text-left rounded px-1.5 py-0.5 text-xs font-medium truncate transition-all',
        'hover:ring-1 hover:ring-offset-1',
        colorClasses.bg,
        colorClasses.text,
        `hover:ring-${event.color}-400`,
        className,
      )}
      onClick={onClick}
      title={`${typeLabels[event.type]}: ${event.title}`}
    >
      <span className="flex items-center gap-1 truncate">
        <Icon className="h-3 w-3 flex-shrink-0" />
        <span className="truncate">
          {showDate && (
            <span className="opacity-70 mr-1">
              {new Date(event.startDate + 'T00:00:00').toLocaleDateString('pt-BR', {
                day: '2-digit',
                month: 'short',
              })}
            </span>
          )}
          {event.title}
        </span>
      </span>
    </button>
  )
}

interface CalendarEventCardProps {
  event: CalendarItem
  onClick?: () => void
  className?: string
}

export function CalendarEventCard({ event, onClick, className }: CalendarEventCardProps) {
  const Icon = typeIcons[event.type]
  const colorClasses = eventColors[event.color] || eventColors.blue
  
  const startDate = new Date(event.startDate + 'T00:00:00')
  const endDate = new Date(event.endDate + 'T00:00:00')
  const isMultiDay = event.startDate !== event.endDate
  
  const formatDate = (date: Date) => {
    return date.toLocaleDateString('pt-BR', {
      weekday: 'short',
      day: '2-digit',
      month: 'short',
    })
  }
  
  return (
    <button
      className={cn(
        'w-full text-left rounded-lg p-3 border transition-all',
        'hover:shadow-md',
        colorClasses.bg,
        colorClasses.border,
        className,
      )}
      onClick={onClick}
    >
      <div className="flex items-start gap-3">
        <div className={cn('p-2 rounded-lg', colorClasses.bg)}>
          <Icon className={cn('h-5 w-5', colorClasses.text)} />
        </div>
        
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className={cn(
              'inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium',
              colorClasses.bg,
              colorClasses.text,
            )}>
              {typeLabels[event.type]}
            </span>
            {event.status === 'completed' && (
              <span className="text-xs text-green-600 font-medium">✓ Concluído</span>
            )}
          </div>
          
          <h4 className={cn('font-semibold mt-1 truncate', colorClasses.text)}>
            {event.title}
          </h4>
          
          {event.description && (
            <p className="text-sm text-neutral-600 mt-0.5 truncate">
              {event.description}
            </p>
          )}
          
          <div className="flex items-center gap-1 mt-2 text-xs text-neutral-500">
            <Calendar className="h-3 w-3" />
            {isMultiDay ? (
              <span>{formatDate(startDate)} - {formatDate(endDate)}</span>
            ) : (
              <span>{formatDate(startDate)}</span>
            )}
            {event.startTime && !event.allDay && (
              <span className="ml-1">às {event.startTime}</span>
            )}
          </div>
          
          {event.propertyName && (
            <div className="flex items-center gap-1 mt-1 text-xs text-neutral-500">
              <Home className="h-3 w-3" />
              <span className="truncate">{event.propertyName}</span>
            </div>
          )}
          
          {event.guestName && (
            <div className="text-xs text-neutral-500 mt-1">
              Hóspede: {event.guestName}
            </div>
          )}
        </div>
      </div>
    </button>
  )
}

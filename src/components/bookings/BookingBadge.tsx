import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import type { BookingStatus, BookingSource } from '@/lib/validations/bookings'

interface BookingStatusBadgeProps {
  type: 'status'
  value: BookingStatus
  className?: string
}

interface BookingSourceBadgeProps {
  type: 'source'
  value: BookingSource
  className?: string
}

type BookingBadgeProps = BookingStatusBadgeProps | BookingSourceBadgeProps

const statusConfig: Record<BookingStatus, { label: string; variant: 'default' | 'info' | 'success' | 'primary' | 'warning'; dotColor: string }> = {
  confirmed: {
    label: 'Confirmada',
    variant: 'success',
    dotColor: 'bg-success-500',
  },
  cancelled: {
    label: 'Cancelada',
    variant: 'default',
    dotColor: 'bg-neutral-400',
  },
  blocked: {
    label: 'Bloqueada',
    variant: 'warning',
    dotColor: 'bg-warning-500',
  },
  completed: {
    label: 'Concluída',
    variant: 'primary',
    dotColor: 'bg-primary-500',
  },
}

const sourceConfig: Record<BookingSource, { label: string; variant: 'default' | 'info' | 'success' | 'primary'; dotColor: string }> = {
  manual: {
    label: 'Manual',
    variant: 'default',
    dotColor: 'bg-neutral-400',
  },
  airbnb: {
    label: 'Airbnb',
    variant: 'info',
    dotColor: 'bg-[#FF5A5F]',
  },
  booking: {
    label: 'Booking.com',
    variant: 'info',
    dotColor: 'bg-[#003580]',
  },
  vrbo: {
    label: 'Vrbo',
    variant: 'info',
    dotColor: 'bg-[#0051A5]',
  },
  other: {
    label: 'Outro',
    variant: 'default',
    dotColor: 'bg-neutral-400',
  },
}

export function BookingBadge(props: BookingBadgeProps) {
  const { type, value, className } = props

  const config = type === 'status'
    ? statusConfig[value as BookingStatus]
    : sourceConfig[value as BookingSource]

  return (
    <Badge variant={config.variant} className={cn('gap-1.5', className)}>
      <span
        className={cn(
          'h-1.5 w-1.5 rounded-full',
          config.dotColor
        )}
        aria-hidden="true"
      />
      {config.label}
    </Badge>
  )
}

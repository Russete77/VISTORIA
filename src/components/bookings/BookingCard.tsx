import Link from 'next/link'
import { Calendar, User, Home, CheckCircle2, XCircle } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { cn } from '@/lib/utils'
import { BookingBadge } from './BookingBadge'
import type { Booking } from '@/lib/validations/bookings'

interface BookingCardProps {
  booking: Booking
  className?: string
  showProperty?: boolean
}

export function BookingCard({ booking, className, showProperty = true }: BookingCardProps) {
  const checkInDate = new Date(booking.check_in_date + 'T00:00:00')
  const checkOutDate = new Date(booking.check_out_date + 'T00:00:00')

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    })
  }

  const hasInspections = booking.checkin_inspection || booking.checkout_inspection
  const hasComparison = booking.comparison

  return (
    <Link href={`/dashboard/bookings/${booking.id}`}>
      <Card
        className={cn(
          'group relative overflow-hidden border-neutral-200 bg-white transition-all duration-200',
          'hover:shadow-lg hover:-translate-y-1 cursor-pointer',
          className
        )}
      >
        {/* Header com datas */}
        <div className="relative bg-gradient-to-br from-primary-500 to-primary-600 p-6 text-white">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <Calendar className="h-4 w-4" />
                <span className="text-sm font-medium opacity-90">
                  {formatDate(checkInDate)} - {formatDate(checkOutDate)}
                </span>
              </div>
              <div className="text-2xl font-bold">
                {booking.nights_count} {booking.nights_count === 1 ? 'noite' : 'noites'}
              </div>
            </div>
            <div className="flex flex-col gap-2">
              <BookingBadge type="status" value={booking.status} />
              <BookingBadge type="source" value={booking.source} />
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4">
          {/* Guest */}
          {booking.guest && (
            <div className="flex items-center gap-2">
              <User className="h-4 w-4 text-neutral-500" />
              <div className="flex-1">
                <p className="text-sm font-medium text-neutral-900">{booking.guest.full_name}</p>
                {booking.guest.email && (
                  <p className="text-xs text-neutral-600">{booking.guest.email}</p>
                )}
              </div>
            </div>
          )}

          {/* Property */}
          {showProperty && booking.property && (
            <div className="flex items-center gap-2">
              <Home className="h-4 w-4 text-neutral-500" />
              <div className="flex-1">
                <p className="text-sm font-medium text-neutral-900">{booking.property.name}</p>
                <p className="text-xs text-neutral-600">
                  {booking.property.city}, {booking.property.state}
                </p>
              </div>
            </div>
          )}

          {/* Amount */}
          {booking.total_amount && (
            <div className="pt-3 border-t border-neutral-200">
              <div className="flex items-center justify-between">
                <span className="text-sm text-neutral-600">Valor total</span>
                <span className="text-lg font-semibold text-neutral-900">
                  {new Intl.NumberFormat('pt-BR', {
                    style: 'currency',
                    currency: booking.currency || 'BRL',
                  }).format(booking.total_amount)}
                </span>
              </div>
            </div>
          )}

          {/* Inspections Status */}
          {hasInspections && (
            <div className="pt-3 border-t border-neutral-200">
              <div className="flex items-center gap-4 text-xs">
                <div className="flex items-center gap-1.5">
                  {booking.checkin_inspection?.status === 'completed' ? (
                    <CheckCircle2 className="h-4 w-4 text-success-500" />
                  ) : (
                    <XCircle className="h-4 w-4 text-neutral-400" />
                  )}
                  <span className="text-neutral-600">Entrada</span>
                </div>
                <div className="flex items-center gap-1.5">
                  {booking.checkout_inspection?.status === 'completed' ? (
                    <CheckCircle2 className="h-4 w-4 text-success-500" />
                  ) : (
                    <XCircle className="h-4 w-4 text-neutral-400" />
                  )}
                  <span className="text-neutral-600">Saída</span>
                </div>
                {hasComparison && (
                  <div className="flex items-center gap-1.5">
                    <CheckCircle2 className="h-4 w-4 text-primary-500" />
                    <span className="text-neutral-600">Comparação</span>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </Card>
    </Link>
  )
}

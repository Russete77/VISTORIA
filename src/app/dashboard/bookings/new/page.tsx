import { BookingForm } from '@/components/bookings/BookingForm'
import { Calendar } from 'lucide-react'
import { Breadcrumbs } from '@/components/ui/breadcrumbs'

/**
 * New Booking Page - VistorIA Pro
 * Create a new vacation rental booking
 */

export default function NewBookingPage() {
  return (
    <div className="space-y-6 px-4 sm:px-0">
      {/* Breadcrumbs */}
      <Breadcrumbs
        items={[
          { label: 'Reservas', href: '/dashboard/bookings', icon: <Calendar className="h-3.5 w-3.5" /> },
          { label: 'Nova Reserva' },
        ]}
      />

      {/* Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-neutral-900">
          Nova Reserva
        </h1>
        <p className="text-neutral-600 mt-1 text-sm sm:text-base">
          Cadastre uma nova reserva manualmente
        </p>
      </div>

      {/* Form */}
      <BookingForm />
    </div>
  )
}

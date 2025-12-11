'use client'

import { use, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Calendar, User, Home, ArrowLeft, Edit, Trash2, CheckCircle2, XCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { BookingBadge } from '@/components/bookings/BookingBadge'
import { Breadcrumbs } from '@/components/ui/breadcrumbs'
import type { Booking } from '@/lib/validations/bookings'
import Link from 'next/link'

interface PageProps {
  params: Promise<{ id: string }>
}

export default function BookingDetailsPage({ params }: PageProps) {
  const router = useRouter()
  const { id } = use(params)
  const [booking, setBooking] = useState<Booking | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchBooking() {
      try {
        const response = await fetch(`/api/bookings/${id}`, {
          credentials: 'include',
        })

        if (!response.ok) {
          throw new Error('Failed to fetch booking')
        }

        const data = await response.json()
        setBooking(data.data)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred')
      } finally {
        setIsLoading(false)
      }
    }

    fetchBooking()
  }, [id])

  const handleDelete = async () => {
    if (!confirm('Tem certeza que deseja excluir esta reserva?')) return

    try {
      const response = await fetch(`/api/bookings/${id}`, {
        method: 'DELETE',
        credentials: 'include',
      })

      if (!response.ok) throw new Error('Failed to delete')

      router.push('/dashboard/bookings')
    } catch (err) {
      alert('Erro ao excluir reserva')
    }
  }

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    )
  }

  if (error || !booking) {
    return (
      <div className="space-y-6 px-4 sm:px-0">
        <div className="p-4 bg-danger-50 border border-danger-200 rounded-lg text-danger-700">
          <p className="font-semibold">Erro ao carregar reserva</p>
          <p className="text-sm mt-1">{error || 'Reserva não encontrada'}</p>
        </div>
        <Button variant="outline" onClick={() => router.back()}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Voltar
        </Button>
      </div>
    )
  }

  const checkInDate = new Date(booking.check_in_date + 'T00:00:00')
  const checkOutDate = new Date(booking.check_out_date + 'T00:00:00')

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
    })
  }

  return (
    <div className="space-y-6 px-4 sm:px-0">
      {/* Breadcrumbs */}
      <Breadcrumbs
        items={[
          { label: 'Agenda', href: '/dashboard/bookings', icon: <Calendar className="h-3.5 w-3.5" /> },
          { label: `Reserva #${booking.id.slice(0, 8)}` },
        ]}
      />

      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-neutral-900">
            Detalhes da Reserva
          </h1>
          <p className="text-neutral-600 mt-1">
            {booking.nights_count} {booking.nights_count === 1 ? 'noite' : 'noites'}
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" asChild>
            <Link href={`/dashboard/bookings/${id}/edit`}>
              <Edit className="mr-2 h-4 w-4" />
              Editar
            </Link>
          </Button>
          <Button variant="outline" size="sm" onClick={handleDelete}>
            <Trash2 className="mr-2 h-4 w-4" />
            Excluir
          </Button>
        </div>
      </div>

      {/* Status Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Período
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-sm text-neutral-600">Check-in</p>
              <p className="text-lg font-semibold">{formatDate(checkInDate)}</p>
            </div>
            <div>
              <p className="text-sm text-neutral-600">Check-out</p>
              <p className="text-lg font-semibold">{formatDate(checkOutDate)}</p>
            </div>
            <div className="flex gap-2 pt-2">
              <BookingBadge type="status" value={booking.status} />
              <BookingBadge type="source" value={booking.source} />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Hóspede
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {booking.guest ? (
              <>
                <div>
                  <p className="text-sm text-neutral-600">Nome</p>
                  <p className="text-lg font-semibold">{booking.guest.full_name}</p>
                </div>
                {booking.guest.email && (
                  <div>
                    <p className="text-sm text-neutral-600">Email</p>
                    <p className="text-sm">{booking.guest.email}</p>
                  </div>
                )}
                {booking.guest.phone && (
                  <div>
                    <p className="text-sm text-neutral-600">Telefone</p>
                    <p className="text-sm">{booking.guest.phone}</p>
                  </div>
                )}
              </>
            ) : (
              <p className="text-sm text-neutral-500">Sem informações do hóspede</p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Property */}
      {booking.property && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Home className="h-5 w-5" />
              Imóvel
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-lg font-semibold">{booking.property.name}</p>
            <p className="text-sm text-neutral-600 mt-1">
              {booking.property.address}
            </p>
            <p className="text-sm text-neutral-600">
              {booking.property.city}, {booking.property.state}
            </p>
          </CardContent>
        </Card>
      )}

      {/* Amount */}
      {booking.total_amount && (
        <Card>
          <CardHeader>
            <CardTitle>Valor</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-primary-600">
              {new Intl.NumberFormat('pt-BR', {
                style: 'currency',
                currency: booking.currency || 'BRL',
              }).format(booking.total_amount)}
            </p>
          </CardContent>
        </Card>
      )}

      {/* Inspections */}
      <Card>
        <CardHeader>
          <CardTitle>Vistorias</CardTitle>
          <CardDescription>
            Vistorias de entrada e saída vinculadas a esta reserva
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-center gap-3 p-4 border rounded-lg">
              {booking.checkin_inspection ? (
                <>
                  <CheckCircle2 className="h-5 w-5 text-success-500" />
                  <div>
                    <p className="font-medium">Vistoria de Entrada</p>
                    <p className="text-sm text-neutral-600">
                      {booking.checkin_inspection.status === 'completed' ? 'Concluída' : 'Pendente'}
                    </p>
                  </div>
                </>
              ) : (
                <>
                  <XCircle className="h-5 w-5 text-neutral-400" />
                  <div>
                    <p className="font-medium text-neutral-600">Vistoria de Entrada</p>
                    <p className="text-sm text-neutral-500">Não vinculada</p>
                  </div>
                </>
              )}
            </div>

            <div className="flex items-center gap-3 p-4 border rounded-lg">
              {booking.checkout_inspection ? (
                <>
                  <CheckCircle2 className="h-5 w-5 text-success-500" />
                  <div>
                    <p className="font-medium">Vistoria de Saída</p>
                    <p className="text-sm text-neutral-600">
                      {booking.checkout_inspection.status === 'completed' ? 'Concluída' : 'Pendente'}
                    </p>
                  </div>
                </>
              ) : (
                <>
                  <XCircle className="h-5 w-5 text-neutral-400" />
                  <div>
                    <p className="font-medium text-neutral-600">Vistoria de Saída</p>
                    <p className="text-sm text-neutral-500">Não vinculada</p>
                  </div>
                </>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Comparison */}
      {booking.comparison && (
        <Card>
          <CardHeader>
            <CardTitle>Comparação</CardTitle>
            <CardDescription>
              Comparação automática entre vistorias
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-3 p-4 border rounded-lg">
              <CheckCircle2 className="h-5 w-5 text-primary-500" />
              <div className="flex-1">
                <p className="font-medium">Comparação Gerada</p>
                <p className="text-sm text-neutral-600">
                  {booking.comparison.differences_detected || 0} diferenças detectadas
                </p>
              </div>
              <Button variant="outline" size="sm" asChild>
                <Link href={`/dashboard/comparisons/${booking.comparison.id}`}>
                  Ver Detalhes
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Notes */}
      {booking.notes && (
        <Card>
          <CardHeader>
            <CardTitle>Observações</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-neutral-700 whitespace-pre-wrap">{booking.notes}</p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

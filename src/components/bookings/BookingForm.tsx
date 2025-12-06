'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Calendar, User, Home, DollarSign, FileText, Loader2 } from 'lucide-react'
import { createBookingSchema, type CreateBookingInput } from '@/lib/validations/bookings'
import { useProperties } from '@/hooks/use-properties'
import { useBookings } from '@/hooks/use-bookings'

interface BookingFormProps {
  onSuccess?: () => void
}

export function BookingForm({ onSuccess }: BookingFormProps) {
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const { properties } = useProperties({ autoFetch: true })
  const { createBooking } = useBookings({ autoFetch: false })

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
  } = useForm<CreateBookingInput>({
    resolver: zodResolver(createBookingSchema),
    defaultValues: {
      currency: 'BRL',
    },
  })

  const selectedPropertyId = watch('property_id')

  const onSubmit = async (data: CreateBookingInput) => {
    setIsSubmitting(true)
    setError(null)

    try {
      await createBooking(data)

      if (onSuccess) {
        onSuccess()
      } else {
        router.push('/dashboard/bookings')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao criar reserva')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {/* Error Message */}
      {error && (
        <div className="p-4 bg-danger-50 border border-danger-200 rounded-lg text-danger-700 text-sm">
          {error}
        </div>
      )}

      {/* Property Selection */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Home className="h-5 w-5" />
            Imóvel
          </CardTitle>
          <CardDescription>
            Selecione o imóvel para a reserva
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div>
            <Label htmlFor="property_id">Imóvel *</Label>
            <Select
              value={selectedPropertyId}
              onValueChange={(value) => setValue('property_id', value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecione um imóvel" />
              </SelectTrigger>
              <SelectContent>
                {properties.map((property) => (
                  <SelectItem key={property.id} value={property.id}>
                    {property.name} - {property.city}, {property.state}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.property_id && (
              <p className="text-sm text-danger-600 mt-1">{errors.property_id.message}</p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Guest Information */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            Hóspede
          </CardTitle>
          <CardDescription>
            Informações do hóspede
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="guest_name">Nome Completo *</Label>
            <Input
              id="guest_name"
              {...register('guest_name')}
              placeholder="João Silva"
            />
            {errors.guest_name && (
              <p className="text-sm text-danger-600 mt-1">{errors.guest_name.message}</p>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="guest_email">Email</Label>
              <Input
                id="guest_email"
                type="email"
                {...register('guest_email')}
                placeholder="joao@email.com"
              />
              {errors.guest_email && (
                <p className="text-sm text-danger-600 mt-1">{errors.guest_email.message}</p>
              )}
            </div>

            <div>
              <Label htmlFor="guest_phone">Telefone</Label>
              <Input
                id="guest_phone"
                {...register('guest_phone')}
                placeholder="(11) 99999-9999"
                maxLength={20}
              />
              {errors.guest_phone && (
                <p className="text-sm text-danger-600 mt-1">{errors.guest_phone.message}</p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Booking Dates */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Período da Reserva
          </CardTitle>
          <CardDescription>
            Datas de check-in e check-out
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="check_in_date">Check-in *</Label>
              <Input
                id="check_in_date"
                type="date"
                {...register('check_in_date')}
              />
              {errors.check_in_date && (
                <p className="text-sm text-danger-600 mt-1">{errors.check_in_date.message}</p>
              )}
            </div>

            <div>
              <Label htmlFor="check_out_date">Check-out *</Label>
              <Input
                id="check_out_date"
                type="date"
                {...register('check_out_date')}
              />
              {errors.check_out_date && (
                <p className="text-sm text-danger-600 mt-1">{errors.check_out_date.message}</p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Payment Information */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <DollarSign className="h-5 w-5" />
            Valor (Opcional)
          </CardTitle>
          <CardDescription>
            Informações de pagamento
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="md:col-span-2">
              <Label htmlFor="total_amount">Valor Total</Label>
              <Input
                id="total_amount"
                type="number"
                step="0.01"
                min="0"
                {...register('total_amount', {
                  setValueAs: (v) => (v === '' || v === null ? undefined : parseFloat(v)),
                })}
                placeholder="0.00"
              />
              {errors.total_amount && (
                <p className="text-sm text-danger-600 mt-1">{errors.total_amount.message}</p>
              )}
            </div>

            <div>
              <Label htmlFor="currency">Moeda</Label>
              <Select
                value={watch('currency') || 'BRL'}
                onValueChange={(value) => setValue('currency', value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="BRL">BRL (R$)</SelectItem>
                  <SelectItem value="USD">USD ($)</SelectItem>
                  <SelectItem value="EUR">EUR (€)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Additional Notes */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Observações
          </CardTitle>
          <CardDescription>
            Informações adicionais (opcional)
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Textarea
            {...register('notes')}
            placeholder="Digite observações sobre a reserva..."
            rows={4}
          />
          {errors.notes && (
            <p className="text-sm text-danger-600 mt-1">{errors.notes.message}</p>
          )}
        </CardContent>
      </Card>

      {/* Actions */}
      <div className="flex gap-4 justify-end">
        <Button
          type="button"
          variant="outline"
          onClick={() => router.back()}
          disabled={isSubmitting}
        >
          Cancelar
        </Button>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Criar Reserva
        </Button>
      </div>
    </form>
  )
}

'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { createDisputeSchema, type CreateDisputeSchema } from '@/lib/validations/disputes'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Loader2, AlertCircle, CheckCircle } from 'lucide-react'
import { DISPUTE_CATEGORIES, PROBLEM_SEVERITY } from '@/lib/constants'
import type { DisputeCategory, ProblemSeverity } from '@/types/database'

interface DisputeFormProps {
  inspectionId: string
  onSuccess?: (disputeId: string, protocol: string) => void
  onCancel?: () => void
}

export function DisputeForm({ inspectionId, onSuccess, onCancel }: DisputeFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [successData, setSuccessData] = useState<{ protocol: string; disputeId: string } | null>(null)

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
  } = useForm<CreateDisputeSchema>({
    resolver: zodResolver(createDisputeSchema),
    defaultValues: {
      inspection_id: inspectionId,
      category: 'damage_assessment',
      severity: 'medium',
    },
  })

  const selectedCategory = watch('category')
  const selectedSeverity = watch('severity')

  const onSubmit = async (data: CreateDisputeSchema) => {
    setIsSubmitting(true)
    setError(null)

    try {
      const response = await fetch(`/api/inspections/${inspectionId}/disputes`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Erro ao criar contestação')
      }

      setSuccessData({
        protocol: result.dispute.protocol,
        disputeId: result.dispute.id,
      })

      if (onSuccess) {
        onSuccess(result.dispute.id, result.dispute.protocol)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro desconhecido')
    } finally {
      setIsSubmitting(false)
    }
  }

  if (successData) {
    return (
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2 text-success-600">
            <CheckCircle className="h-6 w-6" />
            <CardTitle>Contestação Criada com Sucesso!</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="p-4 bg-success-50 border border-success-200 rounded-lg">
            <p className="text-sm text-success-800 mb-2">
              <strong>Protocolo:</strong> {successData.protocol}
            </p>
            <p className="text-sm text-success-700">
              Um email foi enviado ao inquilino com o link de acesso à contestação.
            </p>
          </div>

          <Button
            onClick={() => window.location.reload()}
            className="w-full"
          >
            Criar Nova Contestação
          </Button>
        </CardContent>
      </Card>
    )
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <Card>
        <CardHeader>
          <CardTitle>Nova Contestação</CardTitle>
          <CardDescription>
            Registre uma contestação do inquilino sobre itens da vistoria
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-6">
          {error && (
            <div className="flex items-start gap-2 p-4 bg-destructive-50 border border-destructive-200 rounded-lg">
              <AlertCircle className="h-5 w-5 text-destructive-600 shrink-0 mt-0.5" />
              <p className="text-sm text-destructive-700">{error}</p>
            </div>
          )}

          {/* Tenant Information */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-neutral-900">
              Dados do Inquilino
            </h3>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="tenant_name">
                  Nome Completo <span className="text-destructive-500">*</span>
                </Label>
                <Input
                  id="tenant_name"
                  {...register('tenant_name')}
                  placeholder="João Silva"
                  aria-invalid={!!errors.tenant_name}
                  aria-describedby={errors.tenant_name ? 'tenant_name-error' : undefined}
                />
                {errors.tenant_name && (
                  <p id="tenant_name-error" className="text-sm text-destructive-600">
                    {errors.tenant_name.message}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="tenant_email">
                  Email <span className="text-destructive-500">*</span>
                </Label>
                <Input
                  id="tenant_email"
                  type="email"
                  {...register('tenant_email')}
                  placeholder="joao@example.com"
                  aria-invalid={!!errors.tenant_email}
                  aria-describedby={errors.tenant_email ? 'tenant_email-error' : undefined}
                />
                {errors.tenant_email && (
                  <p id="tenant_email-error" className="text-sm text-destructive-600">
                    {errors.tenant_email.message}
                  </p>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="tenant_phone">Telefone (opcional)</Label>
              <Input
                id="tenant_phone"
                {...register('tenant_phone')}
                placeholder="(11) 99999-9999"
              />
              {errors.tenant_phone && (
                <p className="text-sm text-destructive-600">
                  {errors.tenant_phone.message}
                </p>
              )}
            </div>
          </div>

          {/* Dispute Details */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-neutral-900">
              Detalhes da Contestação
            </h3>

            <div className="space-y-2">
              <Label htmlFor="item_description">
                Item Contestado <span className="text-destructive-500">*</span>
              </Label>
              <Input
                id="item_description"
                {...register('item_description')}
                placeholder="Ex: Parede da sala com mancha"
                aria-invalid={!!errors.item_description}
                aria-describedby={errors.item_description ? 'item_description-error' : undefined}
              />
              {errors.item_description && (
                <p id="item_description-error" className="text-sm text-destructive-600">
                  {errors.item_description.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="item_location">Local (opcional)</Label>
              <Input
                id="item_location"
                {...register('item_location')}
                placeholder="Ex: Sala de estar, parede norte"
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="category">
                  Categoria <span className="text-destructive-500">*</span>
                </Label>
                <Select
                  value={selectedCategory}
                  onValueChange={(value) => setValue('category', value as DisputeCategory)}
                >
                  <SelectTrigger id="category">
                    <SelectValue placeholder="Selecione a categoria" />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(DISPUTE_CATEGORIES).map(([key, info]) => (
                      <SelectItem key={key} value={key}>
                        <span className="flex items-center gap-2">
                          <span>{info.icon}</span>
                          <span>{info.label}</span>
                        </span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="severity">
                  Gravidade <span className="text-destructive-500">*</span>
                </Label>
                <Select
                  value={selectedSeverity}
                  onValueChange={(value) => setValue('severity', value as ProblemSeverity)}
                >
                  <SelectTrigger id="severity">
                    <SelectValue placeholder="Selecione a gravidade" />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(PROBLEM_SEVERITY).map(([key, info]) => (
                      <SelectItem key={key} value={key}>
                        {info.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">
                Descrição da Contestação <span className="text-destructive-500">*</span>
              </Label>
              <Textarea
                id="description"
                {...register('description')}
                placeholder="Descreva detalhadamente o motivo da contestação..."
                rows={5}
                aria-invalid={!!errors.description}
                aria-describedby={errors.description ? 'description-error' : undefined}
              />
              {errors.description && (
                <p id="description-error" className="text-sm text-destructive-600">
                  {errors.description.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="tenant_notes">Observações Adicionais (opcional)</Label>
              <Textarea
                id="tenant_notes"
                {...register('tenant_notes')}
                placeholder="Informações complementares..."
                rows={3}
              />
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-4">
            {onCancel && (
              <Button
                type="button"
                variant="outline"
                onClick={onCancel}
                disabled={isSubmitting}
                className="flex-1"
              >
                Cancelar
              </Button>
            )}
            <Button
              type="submit"
              disabled={isSubmitting}
              className="flex-1"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Criando...
                </>
              ) : (
                'Criar Contestação'
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    </form>
  )
}

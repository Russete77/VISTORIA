'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { DisputeStatusBadge } from '@/components/disputes/DisputeStatusBadge'
import { DisputeTimeline } from '@/components/disputes/DisputeTimeline'
import { Loader2, AlertCircle, Building2, MapPin, ArrowLeft, Calendar, User } from 'lucide-react'
import { DISPUTE_CATEGORIES, PROBLEM_SEVERITY, INSPECTION_TYPES } from '@/lib/constants'
import type { DisputeWithDetails } from '@/types/database'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'

export default function LandlordDisputeDetailPage() {
  const params = useParams()
  const router = useRouter()
  const token = params.token as string
  const disputeId = params.disputeId as string

  const [dispute, setDispute] = useState<DisputeWithDetails | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchDispute() {
      try {
        const response = await fetch(`/api/disputes/landlord/${token}/${disputeId}`)
        const data = await response.json()

        if (!response.ok) {
          throw new Error(data.error || 'Erro ao carregar contestação')
        }

        setDispute(data.dispute)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Erro desconhecido')
      } finally {
        setLoading(false)
      }
    }

    fetchDispute()
  }, [token, disputeId])

  if (loading) {
    return (
      <div className="min-h-screen bg-neutral-50 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary-600" />
      </div>
    )
  }

  if (error || !dispute) {
    return (
      <div className="min-h-screen bg-neutral-50 flex items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <CardContent className="pt-6">
            <div className="text-center">
              <AlertCircle className="h-12 w-12 text-destructive-500 mx-auto mb-4" />
              <h2 className="text-xl font-semibold text-neutral-900 mb-2">
                Acesso Negado
              </h2>
              <p className="text-neutral-600">
                {error || 'Contestação não encontrada'}
              </p>
              <Button
                onClick={() => router.back()}
                variant="outline"
                className="mt-4"
              >
                <ArrowLeft className="mr-2 h-4 w-4" />
                Voltar
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  const categoryInfo = DISPUTE_CATEGORIES[dispute.category]
  const severityInfo = PROBLEM_SEVERITY[dispute.severity]
  const inspectionTypeInfo = INSPECTION_TYPES[dispute.inspection.type]

  return (
    <div className="min-h-screen bg-neutral-50 py-8">
      <div className="container max-w-4xl mx-auto px-4">
        {/* Back Button */}
        <Button
          onClick={() => router.back()}
          variant="ghost"
          className="mb-4"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Voltar para Contestações
        </Button>

        {/* Header Card */}
        <Card className="mb-6">
          <CardHeader>
            <div className="flex items-start justify-between gap-4 flex-wrap">
              <div>
                <div className="flex items-center gap-2 mb-2 flex-wrap">
                  <span className="text-sm font-medium text-neutral-500">
                    Protocolo: {dispute.protocol}
                  </span>
                  <DisputeStatusBadge status={dispute.status} />
                </div>
                <CardTitle className="text-2xl">{dispute.item_description}</CardTitle>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Property Information */}
            <div className="pb-4 border-b">
              <h3 className="font-semibold text-neutral-900 mb-3">Informações do Imóvel</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-start gap-2">
                  <Building2 className="h-5 w-5 text-neutral-400 mt-0.5" />
                  <div>
                    <p className="font-medium text-neutral-900">
                      {dispute.inspection.property?.name ?? 'N/A'}
                    </p>
                    <p className="text-sm text-neutral-600">
                      {dispute.inspection.property?.address ?? 'N/A'}
                    </p>
                    {dispute.inspection.property?.city && (
                      <p className="text-sm text-neutral-600">
                        {dispute.inspection.property.city} - {dispute.inspection.property.state}
                      </p>
                    )}
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <Calendar className="h-5 w-5 text-neutral-400 mt-0.5" />
                  <div>
                    <p className="text-sm text-neutral-500">Tipo de Vistoria</p>
                    <p className="font-medium text-neutral-900">
                      {inspectionTypeInfo.icon} {inspectionTypeInfo.label}
                    </p>
                    {dispute.inspection.scheduled_date && (
                      <p className="text-sm text-neutral-600">
                        {format(new Date(dispute.inspection.scheduled_date), "dd/MM/yyyy", { locale: ptBR })}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Tenant Information */}
            <div className="pb-4 border-b">
              <h3 className="font-semibold text-neutral-900 mb-3">Informações do Locatário</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-start gap-2">
                  <User className="h-5 w-5 text-neutral-400 mt-0.5" />
                  <div>
                    <p className="font-medium text-neutral-900">{dispute.tenant_name}</p>
                    <p className="text-sm text-neutral-600">{dispute.tenant_email}</p>
                    {dispute.tenant_phone && (
                      <p className="text-sm text-neutral-600">{dispute.tenant_phone}</p>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Dispute Details */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pb-4 border-b">
              <div>
                <p className="text-sm text-neutral-500 mb-1">Categoria</p>
                <div className="flex items-center gap-2">
                  <span>{categoryInfo.icon}</span>
                  <span className="font-medium">{categoryInfo.label}</span>
                </div>
              </div>
              <div>
                <p className="text-sm text-neutral-500 mb-1">Gravidade</p>
                <span className={`inline-flex items-center px-2.5 py-1 rounded text-sm font-medium ${severityInfo.bgColor} ${severityInfo.color}`}>
                  {severityInfo.label}
                </span>
              </div>
            </div>

            {dispute.item_location && (
              <div className="pb-4 border-b">
                <p className="text-sm text-neutral-500 mb-1">Localização do Item</p>
                <div className="flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-neutral-400" />
                  <p className="text-neutral-900">{dispute.item_location}</p>
                </div>
              </div>
            )}

            <div className="pb-4 border-b">
              <p className="text-sm text-neutral-500 mb-2">Descrição da Contestação</p>
              <p className="text-neutral-900">{dispute.description}</p>
            </div>

            {dispute.tenant_notes && (
              <div className="pb-4 border-b">
                <p className="text-sm text-neutral-500 mb-2">Observações do Locatário</p>
                <p className="text-neutral-900">{dispute.tenant_notes}</p>
              </div>
            )}

            {dispute.resolution_notes && (
              <div className="bg-blue-50 -mx-6 -mb-6 px-6 py-4 rounded-b-lg">
                <p className="text-sm font-medium text-blue-900 mb-1">
                  Resolução
                </p>
                <p className="text-sm text-blue-800">{dispute.resolution_notes}</p>
                {dispute.resolved_at && (
                  <p className="text-xs text-blue-600 mt-2">
                    Resolvida em {format(new Date(dispute.resolved_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                  </p>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Messages Timeline */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Histórico de Mensagens</CardTitle>
          </CardHeader>
          <CardContent>
            {dispute.messages && dispute.messages.length > 0 ? (
              <DisputeTimeline messages={dispute.messages} />
            ) : (
              <p className="text-neutral-600 text-center py-8">
                Nenhuma mensagem ainda
              </p>
            )}
          </CardContent>
        </Card>

        {/* Read-Only Notice */}
        <Card className="bg-blue-50 border-blue-200">
          <CardContent className="pt-6">
            <div className="flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
              <div>
                <p className="font-medium text-blue-900 mb-1">
                  Modo Somente Leitura
                </p>
                <p className="text-sm text-blue-800">
                  Você está visualizando esta contestação como proprietário.
                  Para responder ou alterar o status, entre em contato com a imobiliária responsável.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

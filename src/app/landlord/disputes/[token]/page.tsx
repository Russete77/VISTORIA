'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { DisputeStatusBadge } from '@/components/disputes/DisputeStatusBadge'
import { Loader2, AlertCircle, Building2, MapPin, Calendar, Eye } from 'lucide-react'
import { DISPUTE_CATEGORIES, PROBLEM_SEVERITY } from '@/lib/constants'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import type { DisputeWithInspection } from '@/types/database'

interface LandlordDisputesResponse {
  disputes: DisputeWithInspection[]
  landlordEmail: string
  totalDisputes: number
}

export default function LandlordDisputesListPage() {
  const params = useParams()
  const token = params.token as string

  const [data, setData] = useState<LandlordDisputesResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [filter, setFilter] = useState<'all' | 'pending' | 'under_review' | 'resolved'>('all')

  useEffect(() => {
    async function fetchDisputes() {
      try {
        const response = await fetch(`/api/disputes/landlord/${token}`)
        const responseData = await response.json()

        if (!response.ok) {
          throw new Error(responseData.error || 'Erro ao carregar contestações')
        }

        setData(responseData)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Erro desconhecido')
      } finally {
        setLoading(false)
      }
    }

    fetchDisputes()
  }, [token])

  if (loading) {
    return (
      <div className="min-h-screen bg-neutral-50 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary-600" />
      </div>
    )
  }

  if (error || !data) {
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
                {error || 'Link inválido ou expirado'}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  const filteredDisputes = data.disputes.filter((dispute) => {
    if (filter === 'all') return true
    if (filter === 'resolved') {
      return dispute.status === 'resolved' || dispute.status === 'accepted' || dispute.status === 'rejected'
    }
    return dispute.status === filter
  })

  const statusCounts = {
    all: data.disputes.length,
    pending: data.disputes.filter((d) => d.status === 'pending').length,
    under_review: data.disputes.filter((d) => d.status === 'under_review').length,
    resolved: data.disputes.filter(
      (d) => d.status === 'resolved' || d.status === 'accepted' || d.status === 'rejected'
    ).length,
  }

  return (
    <div className="min-h-screen bg-neutral-50 py-8">
      <div className="container max-w-6xl mx-auto px-4">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-neutral-900 mb-2">
            Contestações dos Seus Imóveis
          </h1>
          <p className="text-neutral-600">
            Acompanhe todas as contestações relacionadas aos seus imóveis
          </p>
          <p className="text-sm text-neutral-500 mt-2">
            Email: {data.landlordEmail}
          </p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <Card className={filter === 'all' ? 'ring-2 ring-primary-500' : ''}>
            <CardContent className="pt-6">
              <button
                onClick={() => setFilter('all')}
                className="w-full text-left"
                aria-label="Filtrar por todas"
              >
                <p className="text-2xl font-bold text-neutral-900">{statusCounts.all}</p>
                <p className="text-sm text-neutral-600">Todas</p>
              </button>
            </CardContent>
          </Card>

          <Card className={filter === 'pending' ? 'ring-2 ring-primary-500' : ''}>
            <CardContent className="pt-6">
              <button
                onClick={() => setFilter('pending')}
                className="w-full text-left"
                aria-label="Filtrar por pendentes"
              >
                <p className="text-2xl font-bold text-gray-700">{statusCounts.pending}</p>
                <p className="text-sm text-neutral-600">Pendentes</p>
              </button>
            </CardContent>
          </Card>

          <Card className={filter === 'under_review' ? 'ring-2 ring-primary-500' : ''}>
            <CardContent className="pt-6">
              <button
                onClick={() => setFilter('under_review')}
                className="w-full text-left"
                aria-label="Filtrar por em análise"
              >
                <p className="text-2xl font-bold text-blue-700">{statusCounts.under_review}</p>
                <p className="text-sm text-neutral-600">Em Análise</p>
              </button>
            </CardContent>
          </Card>

          <Card className={filter === 'resolved' ? 'ring-2 ring-primary-500' : ''}>
            <CardContent className="pt-6">
              <button
                onClick={() => setFilter('resolved')}
                className="w-full text-left"
                aria-label="Filtrar por resolvidas"
              >
                <p className="text-2xl font-bold text-green-700">{statusCounts.resolved}</p>
                <p className="text-sm text-neutral-600">Resolvidas</p>
              </button>
            </CardContent>
          </Card>
        </div>

        {/* Disputes List */}
        {filteredDisputes.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <p className="text-neutral-600">Nenhuma contestação encontrada</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {filteredDisputes.map((dispute) => {
              const categoryInfo = DISPUTE_CATEGORIES[dispute.category]
              const severityInfo = PROBLEM_SEVERITY[dispute.severity]

              return (
                <Card key={dispute.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between gap-4 mb-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2 flex-wrap">
                          <span className="text-sm font-medium text-neutral-500">
                            Protocolo: {dispute.protocol}
                          </span>
                          <DisputeStatusBadge status={dispute.status} />
                          <span className={`text-xs font-medium px-2 py-1 rounded ${severityInfo.bgColor} ${severityInfo.color}`}>
                            {severityInfo.label}
                          </span>
                        </div>
                        <h3 className="text-lg font-semibold text-neutral-900 mb-2">
                          {dispute.item_description}
                        </h3>
                        <p className="text-neutral-600 text-sm mb-3 line-clamp-2">
                          {dispute.description}
                        </p>
                      </div>
                    </div>

                    <div className="space-y-2 mb-4">
                      <div className="flex items-center gap-2 text-sm text-neutral-600">
                        <Building2 className="h-4 w-4" />
                        <span className="font-medium">{dispute.inspection?.property?.name}</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-neutral-600">
                        <MapPin className="h-4 w-4" />
                        <span>{dispute.inspection?.property?.address}</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-neutral-600">
                        <span>{categoryInfo.icon}</span>
                        <span>{categoryInfo.label}</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-neutral-600">
                        <Calendar className="h-4 w-4" />
                        <span>
                          Criada em {format(new Date(dispute.created_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                        </span>
                      </div>
                    </div>

                    <Link
                      href={`/landlord/disputes/${token}/${dispute.id}`}
                      className="inline-flex items-center gap-2 text-sm font-medium text-primary-600 hover:text-primary-700 transition-colors"
                    >
                      <Eye className="h-4 w-4" />
                      Ver Detalhes
                    </Link>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}

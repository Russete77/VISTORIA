'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { DisputeStatusBadge } from '@/components/disputes/DisputeStatusBadge'
import { DisputeTimeline } from '@/components/disputes/DisputeTimeline'
import { Loader2, AlertCircle, Send, MapPin, Building2 } from 'lucide-react'
import { DISPUTE_CATEGORIES, PROBLEM_SEVERITY } from '@/lib/constants'
import type { DisputeWithDetails } from '@/types/database'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'

export default function PublicDisputePage() {
  const params = useParams()
  const token = params.token as string

  const [dispute, setDispute] = useState<DisputeWithDetails | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [newMessage, setNewMessage] = useState('')
  const [sending, setSending] = useState(false)

  useEffect(() => {
    async function fetchDispute() {
      try {
        const response = await fetch(`/api/disputes/${token}?token=${token}`)
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
  }, [token])

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !dispute) return

    setSending(true)
    try {
      const response = await fetch(`/api/disputes/${dispute.id}/messages?token=${token}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: newMessage }),
      })

      if (!response.ok) {
        throw new Error('Erro ao enviar mensagem')
      }

      const { message } = await response.json()
      setDispute((prev) =>
        prev ? { ...prev, messages: [...prev.messages, message] } : null
      )
      setNewMessage('')
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Erro ao enviar mensagem')
    } finally {
      setSending(false)
    }
  }

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
                {error || 'Link inválido ou expirado'}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  const categoryInfo = DISPUTE_CATEGORIES[dispute.category]
  const severityInfo = PROBLEM_SEVERITY[dispute.severity]

  return (
    <div className="min-h-screen bg-neutral-50 py-8">
      <div className="container max-w-4xl mx-auto px-4">
        {/* Header */}
        <Card className="mb-6">
          <CardHeader>
            <div className="flex items-start justify-between gap-4 flex-wrap">
              <div>
                <div className="flex items-center gap-2 mb-2">
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
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-neutral-500 mb-1">Categoria</p>
                <div className="flex items-center gap-2">
                  <span>{categoryInfo.icon}</span>
                  <span className="font-medium">{categoryInfo.label}</span>
                </div>
              </div>
              <div>
                <p className="text-sm text-neutral-500 mb-1">Gravidade</p>
                <span className={`font-medium ${severityInfo.color}`}>
                  {severityInfo.label}
                </span>
              </div>
            </div>

            {dispute.inspection?.property && (
              <div className="pt-4 border-t">
                <div className="flex items-start gap-2">
                  <Building2 className="h-5 w-5 text-neutral-400 mt-0.5" />
                  <div>
                    <p className="font-medium">{dispute.inspection.property.name}</p>
                    <p className="text-sm text-neutral-600">
                      {dispute.inspection.property.address}
                    </p>
                  </div>
                </div>
              </div>
            )}

            <div className="pt-4 border-t">
              <p className="text-sm text-neutral-500 mb-2">Descrição</p>
              <p className="text-neutral-900">{dispute.description}</p>
            </div>

            {dispute.resolution_notes && (
              <div className="pt-4 border-t bg-blue-50 -mx-6 -mb-6 px-6 py-4 rounded-b-lg">
                <p className="text-sm font-medium text-blue-900 mb-1">
                  Resolução
                </p>
                <p className="text-sm text-blue-800">{dispute.resolution_notes}</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Messages */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Histórico de Mensagens</CardTitle>
          </CardHeader>
          <CardContent>
            <DisputeTimeline messages={dispute.messages || []} />
          </CardContent>
        </Card>

        {/* Send Message (if not resolved) */}
        {dispute.status !== 'resolved' && dispute.status !== 'rejected' && (
          <Card>
            <CardHeader>
              <CardTitle>Enviar Mensagem</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <Textarea
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  placeholder="Digite sua mensagem..."
                  rows={4}
                  disabled={sending}
                />
                <Button
                  onClick={handleSendMessage}
                  disabled={sending || !newMessage.trim()}
                  className="w-full"
                >
                  {sending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Enviando...
                    </>
                  ) : (
                    <>
                      <Send className="mr-2 h-4 w-4" />
                      Enviar Mensagem
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}

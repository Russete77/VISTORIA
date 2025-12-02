/**
 * Comparison Detail Page - VistorIA Pro
 * Visualização detalhada de uma comparação com todas as diferenças
 */

'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { use } from 'react'
import { ArrowLeft, Download, Mail, Loader2, AlertCircle, CheckCircle2, Send } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Breadcrumbs } from '@/components/ui/breadcrumbs'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { ComparisonStats } from '@/components/comparison/ComparisonStats'
import { DifferenceCard } from '@/components/comparison/DifferenceCard'
import { useComparisons } from '@/hooks/use-comparisons'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import { toast } from 'sonner'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import type { ComparisonWithDetails } from '@/types/database'

export default function ComparisonDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const resolvedParams = use(params)
  const { getComparison } = useComparisons({ autoFetch: false })
  const [comparison, setComparison] = useState<ComparisonWithDetails | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // PDF & Email states
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false)
  const [isSendingEmail, setIsSendingEmail] = useState(false)
  const [emailDialogOpen, setEmailDialogOpen] = useState(false)
  const [emailRecipient, setEmailRecipient] = useState('')
  const [includeLandlord, setIncludeLandlord] = useState(false)
  const [includeTenant, setIncludeTenant] = useState(false)

  // Generate PDF handler
  const handleGeneratePDF = async () => {
    if (!comparison) return

    try {
      setIsGeneratingPDF(true)
      toast.info('Gerando PDF...')

      const response = await fetch(`/api/comparisons/${comparison.id}/generate-pdf`, {
        method: 'POST',
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Erro ao gerar PDF')
      }

      // Download the PDF
      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `comparacao-${comparison.id.slice(0, 8)}.pdf`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)

      toast.success('PDF gerado com sucesso!')
    } catch (err) {
      console.error('Error generating PDF:', err)
      toast.error(err instanceof Error ? err.message : 'Erro ao gerar PDF')
    } finally {
      setIsGeneratingPDF(false)
    }
  }

  // Send Email handler
  const handleSendEmail = async () => {
    if (!comparison) return

    const recipients: string[] = []
    if (emailRecipient.trim()) {
      recipients.push(emailRecipient.trim())
    }

    if (recipients.length === 0 && !includeLandlord && !includeTenant) {
      toast.error('Adicione pelo menos um destinatário')
      return
    }

    try {
      setIsSendingEmail(true)
      toast.info('Enviando email...')

      const response = await fetch(`/api/comparisons/${comparison.id}/send-email`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          recipients,
          includePropertyOwner: includeLandlord,
          includeTenant,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Erro ao enviar email')
      }

      toast.success(data.message || 'Email enviado com sucesso!')
      setEmailDialogOpen(false)
      setEmailRecipient('')
      setIncludeLandlord(false)
      setIncludeTenant(false)
    } catch (err) {
      console.error('Error sending email:', err)
      toast.error(err instanceof Error ? err.message : 'Erro ao enviar email')
    } finally {
      setIsSendingEmail(false)
    }
  }

  useEffect(() => {
    async function fetchComparison() {
      try {
        setIsLoading(true)
        const data = await getComparison(resolvedParams.id)
        setComparison(data)
      } catch (err) {
        setError('Erro ao carregar comparação')
        console.error(err)
      } finally {
        setIsLoading(false)
      }
    }

    fetchComparison()
  }, [resolvedParams.id, getComparison])

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-64" />
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-32" />
          ))}
        </div>
        <Skeleton className="h-96" />
      </div>
    )
  }

  if (error || !comparison) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <AlertCircle className="w-16 h-16 text-red-500 mb-4" />
        <h2 className="text-2xl font-bold mb-2">Comparação não encontrada</h2>
        <p className="text-muted-foreground mb-4">
          {error || 'A comparação solicitada não existe ou foi removida.'}
        </p>
        <Button asChild>
          <Link href="/dashboard/comparisons">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Voltar para Comparações
          </Link>
        </Button>
      </div>
    )
  }

  const statusConfig = {
    pending: { label: 'Pendente', color: 'bg-gray-100 text-gray-700' },
    processing: { label: 'Processando', color: 'bg-blue-100 text-blue-700' },
    completed: { label: 'Concluída', color: 'bg-green-100 text-green-700' },
    failed: { label: 'Falhou', color: 'bg-red-100 text-red-700' },
  }

  const status = statusConfig[comparison.status]

  // Agrupar diferenças por cômodo
  const differencesByRoom = comparison.differences?.reduce((acc, diff) => {
    const room = diff.room_name
    if (!acc[room]) {
      acc[room] = []
    }
    acc[room].push(diff)
    return acc
  }, {} as Record<string, typeof comparison.differences>)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <Breadcrumbs
          items={[
            { label: 'Dashboard', href: '/dashboard' },
            { label: 'Comparações', href: '/dashboard/comparisons' },
            { label: comparison.property.name },
          ]}
        />

        <div className="flex items-center justify-between mt-4">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-3xl font-bold tracking-tight">
                {comparison.property.name}
              </h1>
              <Badge className={status.color} variant="default">
                {status.label}
              </Badge>
            </div>
            <p className="text-muted-foreground mt-1">
              {comparison.property.address}
            </p>
            <p className="text-sm text-muted-foreground mt-1">
              Criada em {format(new Date(comparison.created_at), "dd 'de' MMMM 'de' yyyy 'às' HH:mm", { locale: ptBR })}
            </p>
          </div>

          <div className="flex gap-2">
            {/* Email Dialog */}
            <Dialog open={emailDialogOpen} onOpenChange={setEmailDialogOpen}>
              <DialogTrigger asChild>
                <Button
                  variant="outline"
                  disabled={comparison.status !== 'completed'}
                >
                  <Mail className="w-4 h-4 mr-2" />
                  Enviar Email
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                  <DialogTitle>Enviar Relatório por Email</DialogTitle>
                  <DialogDescription>
                    Envie o relatório de comparação para os interessados.
                  </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="grid gap-2">
                    <Label htmlFor="email">Email adicional</Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="email@exemplo.com"
                      value={emailRecipient}
                      onChange={(e) => setEmailRecipient(e.target.value)}
                    />
                  </div>

                  {comparison.move_out_inspection.landlord_email && (
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="landlord"
                        checked={includeLandlord}
                        onCheckedChange={(checked) => setIncludeLandlord(checked as boolean)}
                      />
                      <Label htmlFor="landlord" className="text-sm">
                        Incluir proprietário ({comparison.move_out_inspection.landlord_email})
                      </Label>
                    </div>
                  )}

                  {comparison.move_out_inspection.tenant_email && (
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="tenant"
                        checked={includeTenant}
                        onCheckedChange={(checked) => setIncludeTenant(checked as boolean)}
                      />
                      <Label htmlFor="tenant" className="text-sm">
                        Incluir inquilino ({comparison.move_out_inspection.tenant_email})
                      </Label>
                    </div>
                  )}
                </div>
                <DialogFooter>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setEmailDialogOpen(false)}
                  >
                    Cancelar
                  </Button>
                  <Button
                    type="button"
                    onClick={handleSendEmail}
                    disabled={isSendingEmail}
                  >
                    {isSendingEmail ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Enviando...
                      </>
                    ) : (
                      <>
                        <Send className="w-4 h-4 mr-2" />
                        Enviar
                      </>
                    )}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>

            {/* Generate PDF Button */}
            <Button
              variant="outline"
              onClick={handleGeneratePDF}
              disabled={isGeneratingPDF || comparison.status !== 'completed'}
            >
              {isGeneratingPDF ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Gerando...
                </>
              ) : (
                <>
                  <Download className="w-4 h-4 mr-2" />
                  Gerar PDF
                </>
              )}
            </Button>
          </div>
        </div>
      </div>

      {/* Status-specific content */}
      {comparison.status === 'processing' && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Loader2 className="w-16 h-16 animate-spin text-primary mb-4" />
            <h3 className="text-xl font-semibold mb-2">Processando Comparação</h3>
            <p className="text-muted-foreground text-center max-w-md">
              Nossa IA está analisando as fotos e detectando diferenças. Este processo pode levar alguns minutos.
              Você será notificado quando concluir.
            </p>
          </CardContent>
        </Card>
      )}

      {comparison.status === 'failed' && (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <AlertCircle className="w-16 h-16 text-red-500 mb-4" />
            <h3 className="text-xl font-semibold text-red-900 mb-2">Erro no Processamento</h3>
            <p className="text-red-700 text-center max-w-md mb-4">
              Ocorreu um erro ao processar esta comparação. Por favor, tente criar uma nova comparação.
            </p>
            <Button asChild variant="outline">
              <Link href="/dashboard/comparisons/new">
                Criar Nova Comparação
              </Link>
            </Button>
          </CardContent>
        </Card>
      )}

      {comparison.status === 'completed' && (
        <>
          {/* Statistics */}
          <ComparisonStats comparison={comparison} />

          {/* Inspection Details */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-green-500"></span>
                  Vistoria de Entrada
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 text-sm">
                  <div>
                    <span className="text-muted-foreground">Data:</span>{' '}
                    <span className="font-medium">
                      {format(new Date(comparison.move_in_inspection.created_at), "dd/MM/yyyy", { locale: ptBR })}
                    </span>
                  </div>
                  {comparison.move_in_inspection.inspector_name && (
                    <div>
                      <span className="text-muted-foreground">Vistoriador:</span>{' '}
                      <span className="font-medium">{comparison.move_in_inspection.inspector_name}</span>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-orange-500"></span>
                  Vistoria de Saída
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 text-sm">
                  <div>
                    <span className="text-muted-foreground">Data:</span>{' '}
                    <span className="font-medium">
                      {format(new Date(comparison.move_out_inspection.created_at), "dd/MM/yyyy", { locale: ptBR })}
                    </span>
                  </div>
                  {comparison.move_out_inspection.inspector_name && (
                    <div>
                      <span className="text-muted-foreground">Vistoriador:</span>{' '}
                      <span className="font-medium">{comparison.move_out_inspection.inspector_name}</span>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Differences by Room */}
          {comparison.differences && comparison.differences.length > 0 ? (
            <div className="space-y-6">
              <div>
                <h2 className="text-2xl font-bold">Diferenças Detectadas</h2>
                <p className="text-muted-foreground">
                  {comparison.differences.length} diferença(s) encontrada(s) em {Object.keys(differencesByRoom || {}).length} cômodo(s)
                </p>
              </div>

              {Object.entries(differencesByRoom || {}).map(([roomName, diffs]) => (
                <div key={roomName}>
                  <h3 className="text-xl font-semibold mb-3">{roomName}</h3>
                  <div className="space-y-4">
                    {diffs.map((diff) => (
                      <DifferenceCard key={diff.id} difference={diff as any} />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <CheckCircle2 className="w-16 h-16 text-green-500 mb-4" />
                <h3 className="text-xl font-semibold mb-2">Nenhuma Diferença Detectada</h3>
                <p className="text-muted-foreground text-center max-w-md">
                  Excelente! O imóvel está em ótimas condições. Não foram encontradas diferenças significativas
                  entre a vistoria de entrada e saída.
                </p>
              </CardContent>
            </Card>
          )}
        </>
      )}

      {/* Back Button */}
      <div className="pt-6 border-t">
        <Button variant="outline" asChild>
          <Link href="/dashboard/comparisons">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Voltar para Comparações
          </Link>
        </Button>
      </div>
    </div>
  )
}

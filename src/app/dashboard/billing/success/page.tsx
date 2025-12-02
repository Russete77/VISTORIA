'use client'

import { Suspense, useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { CheckCircle2, CreditCard, ArrowRight, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

/**
 * Payment Success Page - VistorIA Pro
 * Shows payment confirmation and updated credit balance
 */

function SuccessContent() {
  const searchParams = useSearchParams()
  const [isLoading, setIsLoading] = useState(true)
  const [credits, setCredits] = useState(0)
  const sessionId = searchParams.get('session_id')

  useEffect(() => {
    // Give the webhook time to process
    setTimeout(() => {
      fetchUserCredits()
    }, 2000)
  }, [])

  const fetchUserCredits = async () => {
    try {
      const response = await fetch('/api/user', {
        credentials: 'include',
      })

      if (response.ok) {
        const data = await response.json()
        setCredits(data.user.credits || 0)
      }
    } catch (error) {
      console.error('Failed to fetch credits:', error)
    } finally {
      setIsLoading(false)
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin mx-auto mb-4 text-primary-600" />
          <p className="text-neutral-600">Processando seu pagamento...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto space-y-8 py-8">
      {/* Success Icon */}
      <div className="text-center">
        <div className="inline-flex h-20 w-20 items-center justify-center rounded-full bg-green-100 mb-4">
          <CheckCircle2 className="h-12 w-12 text-green-600" />
        </div>
        <h1 className="text-3xl font-bold text-neutral-900 mb-2">
          Pagamento Confirmado!
        </h1>
        <p className="text-lg text-neutral-600">
          Seus créditos foram adicionados com sucesso
        </p>
      </div>

      {/* Credits Balance */}
      <Card className="border-green-200 bg-green-50">
        <CardContent className="p-8 text-center">
          <p className="text-sm text-neutral-600 mb-2">Seu novo saldo</p>
          <p className="text-5xl font-bold text-green-600 mb-2">
            {credits}
          </p>
          <p className="text-neutral-600">
            {credits === 1 ? 'crédito disponível' : 'créditos disponíveis'}
          </p>
        </CardContent>
      </Card>

      {/* Transaction Details */}
      {sessionId && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Detalhes da Transação</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between py-2 border-b">
              <span className="text-neutral-600">ID da Sessão:</span>
              <span className="text-sm font-mono text-neutral-900">
                {sessionId.substring(0, 20)}...
              </span>
            </div>
            <div className="flex items-center justify-between py-2 border-b">
              <span className="text-neutral-600">Status:</span>
              <span className="text-green-600 font-semibold flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4" />
                Confirmado
              </span>
            </div>
            <div className="flex items-center justify-between py-2">
              <span className="text-neutral-600">Processador:</span>
              <span className="text-neutral-900 font-medium">Stripe</span>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Next Steps */}
      <Card>
        <CardHeader>
          <CardTitle>Próximos Passos</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-start gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary-100 text-primary-600 font-semibold flex-shrink-0">
              1
            </div>
            <div>
              <h4 className="font-semibold text-neutral-900 mb-1">
                Crie uma Vistoria
              </h4>
              <p className="text-sm text-neutral-600">
                Use seus créditos para criar vistorias inteligentes com análise de IA
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary-100 text-primary-600 font-semibold flex-shrink-0">
              2
            </div>
            <div>
              <h4 className="font-semibold text-neutral-900 mb-1">
                Tire Fotos dos Cômodos
              </h4>
              <p className="text-sm text-neutral-600">
                Nossa IA analisa automaticamente cada foto e detecta problemas
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary-100 text-primary-600 font-semibold flex-shrink-0">
              3
            </div>
            <div>
              <h4 className="font-semibold text-neutral-900 mb-1">
                Gere seu Laudo PDF
              </h4>
              <p className="text-sm text-neutral-600">
                Laudo profissional pronto em minutos, no formato Satélit
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Action Buttons */}
      <div className="flex flex-col sm:flex-row gap-4">
        <Button asChild size="lg" className="flex-1">
          <Link href="/dashboard/inspections/new">
            <CreditCard className="mr-2 h-5 w-5" />
            Criar Nova Vistoria
          </Link>
        </Button>
        <Button asChild variant="outline" size="lg" className="flex-1">
          <Link href="/dashboard/billing">
            Ver Histórico de Transações
            <ArrowRight className="ml-2 h-5 w-5" />
          </Link>
        </Button>
      </div>

      {/* Support Info */}
      <Card className="border-neutral-200 bg-neutral-50">
        <CardContent className="p-6">
          <p className="text-sm text-neutral-600 text-center">
            Recebeu um email de confirmação do Stripe. Se tiver alguma dúvida sobre o pagamento,
            entre em contato com nosso suporte.
          </p>
        </CardContent>
      </Card>
    </div>
  )
}

export default function PaymentSuccessPage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin mx-auto mb-4 text-primary-600" />
          <p className="text-neutral-600">Carregando...</p>
        </div>
      </div>
    }>
      <SuccessContent />
    </Suspense>
  )
}

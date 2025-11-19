'use client'

import { useState, useEffect } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, CreditCard, Check, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { PRICING } from '@/lib/constants'
import { toast } from 'sonner'

/**
 * Purchase Credits Page - VistorIA Pro
 * Allows users to purchase credit packs
 */

export default function PurchasePage() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const [selectedPack, setSelectedPack] = useState<string | null>(
    searchParams.get('pack') || null
  )
  const [isProcessing, setIsProcessing] = useState(false)

  const packs = [
    {
      id: 'starter',
      name: PRICING.PACKS.STARTER.NAME,
      price: PRICING.PACKS.STARTER.PRICE,
      credits: PRICING.PACKS.STARTER.CREDITS,
      comparisons: PRICING.PACKS.STARTER.COMPARISONS,
      validity: PRICING.PACKS.STARTER.VALIDITY_MONTHS,
      discount: PRICING.PACKS.STARTER.DISCOUNT,
      popular: false,
    },
    {
      id: 'pro',
      name: PRICING.PACKS.PRO.NAME,
      price: PRICING.PACKS.PRO.PRICE,
      credits: PRICING.PACKS.PRO.CREDITS,
      comparisons: PRICING.PACKS.PRO.COMPARISONS,
      googleVision: PRICING.PACKS.PRO.GOOGLE_VISION,
      validity: PRICING.PACKS.PRO.VALIDITY_MONTHS,
      discount: PRICING.PACKS.PRO.DISCOUNT,
      popular: true,
    },
    {
      id: 'business',
      name: PRICING.PACKS.BUSINESS.NAME,
      price: PRICING.PACKS.BUSINESS.PRICE,
      credits: PRICING.PACKS.BUSINESS.CREDITS,
      googleVision: PRICING.PACKS.BUSINESS.GOOGLE_VISION,
      storage: PRICING.PACKS.BUSINESS.STORAGE_GB,
      validity: PRICING.PACKS.BUSINESS.VALIDITY_MONTHS,
      discount: PRICING.PACKS.BUSINESS.DISCOUNT,
      popular: false,
    },
  ]

  const handlePurchase = async () => {
    if (!selectedPack) {
      toast.error('Selecione um pacote de créditos')
      return
    }

    setIsProcessing(true)

    try {
      // TODO: Integrar com Stripe/Payment Gateway
      toast.info('Funcionalidade de pagamento em desenvolvimento')

      // Simulação de delay
      await new Promise(resolve => setTimeout(resolve, 1500))

      toast.success('Em breve você poderá comprar créditos diretamente!')

    } catch (error) {
      toast.error('Erro ao processar pagamento')
    } finally {
      setIsProcessing(false)
    }
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/dashboard/billing">
            <ArrowLeft className="h-5 w-5" />
          </Link>
        </Button>
        <div>
          <h1 className="text-3xl font-bold text-neutral-900">Comprar Créditos</h1>
          <p className="text-neutral-600 mt-1">
            Escolha um pacote e faça mais vistorias
          </p>
        </div>
      </div>

      {/* Payment Methods */}
      <Card className="border-primary-200 bg-primary-50/30">
        <CardContent className="p-6">
          <div className="flex flex-wrap items-center gap-4">
            <CreditCard className="h-8 w-8 text-primary-600" />
            <div className="flex-1">
              <h3 className="font-semibold text-neutral-900">Formas de Pagamento</h3>
              <p className="text-sm text-neutral-600">
                Aceitamos cartão de crédito, PIX e boleto bancário
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Badge variant="outline">💳 Cartão</Badge>
              <Badge variant="outline">⚡ PIX</Badge>
              <Badge variant="outline">🧾 Boleto</Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Credit Packs */}
      <div className="grid gap-6 md:grid-cols-3">
        {packs.map((pack) => (
          <Card
            key={pack.id}
            className={`cursor-pointer transition-all ${
              selectedPack === pack.id
                ? 'border-2 border-primary-500 shadow-lg'
                : 'border-neutral-200 hover:border-primary-300'
            } ${pack.popular ? 'relative' : ''}`}
            onClick={() => setSelectedPack(pack.id)}
          >
            {pack.popular && (
              <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                <Badge className="bg-primary-600 text-white px-4">
                  Mais Popular
                </Badge>
              </div>
            )}

            <CardHeader className="pb-4">
              <CardTitle className="text-xl">{pack.name}</CardTitle>
              <div className="flex items-baseline gap-1">
                <span className="text-3xl font-bold text-primary-600">
                  R$ {pack.price.toFixed(2)}
                </span>
              </div>
              <p className="text-sm text-neutral-600">
                R$ {(pack.price / pack.credits).toFixed(2)} por crédito
              </p>
            </CardHeader>

            <CardContent className="space-y-4">
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-green-600" />
                  <span className="text-sm">{pack.credits} créditos</span>
                </div>
                <div className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-green-600" />
                  <span className="text-sm">
                    {pack.comparisons === 'unlimited'
                      ? 'Comparações ilimitadas'
                      : `${pack.comparisons} comparações`}
                  </span>
                </div>
                {pack.googleVision && (
                  <div className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-green-600" />
                    <span className="text-sm">
                      {pack.googleVision} análises Google Vision
                    </span>
                  </div>
                )}
                {pack.storage && (
                  <div className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-green-600" />
                    <span className="text-sm">{pack.storage}GB de armazenamento</span>
                  </div>
                )}
                <div className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-green-600" />
                  <span className="text-sm">Validade: {pack.validity} meses</span>
                </div>
              </div>

              <div className="pt-3 border-t">
                <Badge className="bg-green-100 text-green-700">
                  Economize {pack.discount}
                </Badge>
              </div>

              {selectedPack === pack.id && (
                <div className="flex items-center gap-2 text-primary-600 font-medium">
                  <Check className="h-5 w-5" />
                  <span className="text-sm">Selecionado</span>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Purchase Button */}
      <Card>
        <CardHeader>
          <CardTitle>Resumo da Compra</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {selectedPack ? (
            <>
              <div className="flex items-center justify-between py-3 border-b">
                <span className="text-neutral-600">Pacote selecionado:</span>
                <span className="font-semibold text-neutral-900">
                  {packs.find(p => p.id === selectedPack)?.name}
                </span>
              </div>
              <div className="flex items-center justify-between py-3 border-b">
                <span className="text-neutral-600">Créditos:</span>
                <span className="font-semibold text-neutral-900">
                  +{packs.find(p => p.id === selectedPack)?.credits}
                </span>
              </div>
              <div className="flex items-center justify-between py-3">
                <span className="text-lg font-semibold text-neutral-900">Total:</span>
                <span className="text-2xl font-bold text-primary-600">
                  R$ {packs.find(p => p.id === selectedPack)?.price.toFixed(2)}
                </span>
              </div>
              <Button
                onClick={handlePurchase}
                disabled={isProcessing}
                size="lg"
                className="w-full"
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                    Processando...
                  </>
                ) : (
                  <>
                    <CreditCard className="mr-2 h-5 w-5" />
                    Finalizar Compra
                  </>
                )}
              </Button>
            </>
          ) : (
            <div className="text-center py-8 text-neutral-500">
              Selecione um pacote acima para continuar
            </div>
          )}
        </CardContent>
      </Card>

      {/* Security Info */}
      <Card className="border-neutral-200 bg-neutral-50">
        <CardContent className="p-6">
          <div className="flex items-start gap-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-green-100">
              <Check className="h-5 w-5 text-green-600" />
            </div>
            <div className="flex-1">
              <h4 className="font-semibold text-neutral-900 mb-2">
                Pagamento 100% Seguro
              </h4>
              <p className="text-sm text-neutral-600">
                Seus dados estão protegidos com criptografia SSL. Não armazenamos
                informações de cartão de crédito. Processamento via Stripe.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

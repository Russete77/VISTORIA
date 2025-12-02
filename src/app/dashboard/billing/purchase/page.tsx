'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
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
  const router = useRouter()
  const [credits, setCredits] = useState(10)
  const [isProcessing, setIsProcessing] = useState(false)
  const [showCustomInput, setShowCustomInput] = useState(false)

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

  // Calculate price with discount
  const PRICE_PER_CREDIT = 9.90
  let discount = 0

  if (credits >= 100) {
    discount = 0.30 // 30% off
  } else if (credits >= 50) {
    discount = 0.20 // 20% off
  } else if (credits >= 25) {
    discount = 0.15 // 15% off
  } else if (credits >= 10) {
    discount = 0.10 // 10% off
  }

  const basePrice = credits * PRICE_PER_CREDIT
  const finalPrice = basePrice * (1 - discount)

  const handlePurchase = async () => {
    if (credits < 1) {
      toast.error('Selecione pelo menos 1 crédito')
      return
    }

    if (credits > 1000) {
      toast.error('Máximo de 1000 créditos por compra')
      return
    }

    setIsProcessing(true)

    try {
      const response = await fetch('/api/billing/create-checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ credits }),
      })

      if (!response.ok) {
        throw new Error('Falha ao criar checkout')
      }

      const { url } = await response.json()

      // Redirect to Stripe checkout
      window.location.href = url

    } catch (error) {
      console.error('Purchase error:', error)
      toast.error('Erro ao processar pagamento')
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

      {/* Custom Credit Selector */}
      <Card>
        <CardHeader>
          <CardTitle>Escolha a Quantidade de Créditos</CardTitle>
          <CardDescription>
            Quanto mais créditos, maior o desconto
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Quick Select Buttons */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
            {[10, 25, 50, 100, 250].map((amount) => (
              <Button
                key={amount}
                variant={credits === amount ? 'default' : 'outline'}
                onClick={() => {
                  setCredits(amount)
                  setShowCustomInput(false)
                }}
                className="h-auto flex-col py-3"
              >
                <span className="text-2xl font-bold">{amount}</span>
                <span className="text-xs opacity-75">créditos</span>
              </Button>
            ))}
          </div>

          {/* Custom Amount Toggle */}
          <div className="flex items-center justify-center">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowCustomInput(!showCustomInput)}
            >
              {showCustomInput ? 'Ocultar' : 'Quantidade personalizada'}
            </Button>
          </div>

          {/* Custom Input */}
          {showCustomInput && (
            <div className="space-y-2">
              <label className="text-sm font-medium text-neutral-700">
                Quantidade de créditos (1 - 1000)
              </label>
              <input
                type="number"
                min="1"
                max="1000"
                value={credits}
                onChange={(e) => setCredits(parseInt(e.target.value) || 1)}
                className="w-full px-4 py-2 border border-neutral-300 rounded-md focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
            </div>
          )}

          {/* Discount Tiers */}
          <div className="grid gap-2">
            <div className={`p-3 rounded-lg border-2 ${credits >= 100 ? 'border-green-500 bg-green-50' : 'border-neutral-200'}`}>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">100+ créditos</span>
                <Badge className="bg-green-600 text-white">30% OFF</Badge>
              </div>
            </div>
            <div className={`p-3 rounded-lg border ${credits >= 50 && credits < 100 ? 'border-green-500 bg-green-50' : 'border-neutral-200'}`}>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">50-99 créditos</span>
                <Badge variant="outline" className="border-green-600 text-green-700">20% OFF</Badge>
              </div>
            </div>
            <div className={`p-3 rounded-lg border ${credits >= 25 && credits < 50 ? 'border-primary-500 bg-primary-50' : 'border-neutral-200'}`}>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">25-49 créditos</span>
                <Badge variant="outline" className="border-primary-600 text-primary-700">15% OFF</Badge>
              </div>
            </div>
            <div className={`p-3 rounded-lg border ${credits >= 10 && credits < 25 ? 'border-primary-500 bg-primary-50' : 'border-neutral-200'}`}>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">10-24 créditos</span>
                <Badge variant="outline" className="border-primary-600 text-primary-700">10% OFF</Badge>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Purchase Summary */}
      <Card>
        <CardHeader>
          <CardTitle>Resumo da Compra</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between py-3 border-b">
            <span className="text-neutral-600">Créditos:</span>
            <span className="font-semibold text-neutral-900">
              {credits} {credits === 1 ? 'crédito' : 'créditos'}
            </span>
          </div>

          <div className="flex items-center justify-between py-3 border-b">
            <span className="text-neutral-600">Preço base:</span>
            <span className="text-neutral-600">
              R$ {basePrice.toFixed(2)}
            </span>
          </div>

          {discount > 0 && (
            <>
              <div className="flex items-center justify-between py-3 border-b">
                <span className="text-neutral-600">Desconto:</span>
                <span className="text-green-600 font-semibold">
                  -{(discount * 100).toFixed(0)}% (R$ {(basePrice - finalPrice).toFixed(2)})
                </span>
              </div>
              <div className="flex items-center justify-between py-3 border-b">
                <span className="text-neutral-600">Preço por crédito:</span>
                <span className="text-neutral-900 font-medium">
                  R$ {(finalPrice / credits).toFixed(2)}
                </span>
              </div>
            </>
          )}

          <div className="flex items-center justify-between py-3">
            <span className="text-lg font-semibold text-neutral-900">Total:</span>
            <span className="text-2xl font-bold text-primary-600">
              R$ {finalPrice.toFixed(2)}
            </span>
          </div>

          <Button
            onClick={handlePurchase}
            disabled={isProcessing || credits < 1}
            size="lg"
            className="w-full"
          >
            {isProcessing ? (
              <>
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                Redirecionando para pagamento...
              </>
            ) : (
              <>
                <CreditCard className="mr-2 h-5 w-5" />
                Ir para Pagamento
              </>
            )}
          </Button>

          <p className="text-xs text-neutral-500 text-center">
            Você será redirecionado para o Stripe para concluir o pagamento
          </p>
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

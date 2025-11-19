'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { CreditCard, TrendingUp, Package, Receipt, Plus, Download } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { USER_TIERS, PRICING } from '@/lib/constants'
import type { UserTier, TransactionType, TransactionStatus } from '@/types/database'

/**
 * Billing Page - VistorIA Pro
 * Shows user tier, credits, transaction history, and credit usage
 */

interface BillingData {
  user: {
    tier: UserTier
    credits: number
    total_inspections: number
    this_month_inspections: number
    avg_per_month: number
  }
  transactions: any[]
  creditUsage: any[]
}

const statusBadgeConfig: Record<TransactionStatus, { label: string; variant: 'success' | 'warning' | 'danger' | 'default' }> = {
  succeeded: { label: 'Sucesso', variant: 'success' },
  pending: { label: 'Pendente', variant: 'warning' },
  failed: { label: 'Falhou', variant: 'danger' },
  refunded: { label: 'Reembolsado', variant: 'default' },
}

const typeLabels: Record<TransactionType, string> = {
  credit_purchase: 'Compra de Créditos',
  subscription: 'Assinatura',
  add_on: 'Adicional',
}

export default function BillingPage() {
  const [data, setData] = useState<BillingData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchBillingData()
  }, [])

  const fetchBillingData = async () => {
    try {
      const response = await fetch('/api/billing', {
        credentials: 'include',
      })
      if (!response.ok) throw new Error('Failed to fetch billing data')
      const billingData = await response.json()
      setData(billingData)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setIsLoading(false)
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-neutral-600">Carregando dados financeiros...</p>
        </div>
      </div>
    )
  }

  if (error || !data) {
    return (
      <div className="p-4 bg-danger-50 border border-danger-200 rounded-lg text-danger-700">
        <p className="font-semibold">Erro ao carregar dados</p>
        <p className="text-sm mt-1">{error}</p>
      </div>
    )
  }

  const tierInfo = USER_TIERS[data.user.tier]

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-neutral-900 mb-2">
            Financeiro
          </h1>
          <p className="text-neutral-600">
            Gerencie seus créditos, planos e pagamentos
          </p>
        </div>
        <Button asChild size="lg">
          <Link href="/dashboard/billing/purchase">
            <Plus className="mr-2 h-5 w-5" />
            Comprar Créditos
          </Link>
        </Button>
      </div>

      {/* Current Plan & Credits Overview */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {/* Current Tier */}
        <Card className="border-neutral-200 bg-white">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base font-semibold">Plano Atual</CardTitle>
              <Package className="h-5 w-5 text-primary-600" />
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <Badge className={`${tierInfo.color} bg-opacity-10 text-base px-3 py-1`}>
                {tierInfo.label}
              </Badge>
            </div>
            <p className="text-sm text-neutral-600">
              {data.user.tier === 'free' && 'Upgrade para desbloquear mais recursos'}
              {data.user.tier === 'pay_per_use' && 'Pague apenas pelas vistorias que fizer'}
              {data.user.tier === 'professional' && '50 créditos/mês + recursos avançados'}
              {data.user.tier === 'business' && '150 créditos/mês + API + White Label'}
              {data.user.tier === 'enterprise' && 'Plano customizado para sua empresa'}
            </p>
            <Button asChild variant="outline" className="w-full mt-2">
              <Link href="/dashboard/billing/plans">
                Ver Planos
              </Link>
            </Button>
          </CardContent>
        </Card>

        {/* Credits Available */}
        <Card className="border-neutral-200 bg-white">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base font-semibold">Créditos Disponíveis</CardTitle>
              <CreditCard className="h-5 w-5 text-primary-600" />
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-4xl font-bold text-primary-600">{data.user.credits}</p>
            <p className="text-sm text-neutral-600">
              Cada vistoria consome 1 crédito
            </p>
            <Button asChild variant="outline" className="w-full mt-2">
              <Link href="/dashboard/billing/purchase">
                Comprar Mais
              </Link>
            </Button>
          </CardContent>
        </Card>

        {/* Usage Stats */}
        <Card className="border-neutral-200 bg-white">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base font-semibold">Estatísticas de Uso</CardTitle>
              <TrendingUp className="h-5 w-5 text-primary-600" />
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-sm text-neutral-600">Total de Vistorias</span>
                <span className="text-lg font-semibold text-neutral-900">{data.user.total_inspections}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-neutral-600">Este Mês</span>
                <span className="text-lg font-semibold text-neutral-900">{data.user.this_month_inspections}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-neutral-600">Média/Mês</span>
                <span className="text-lg font-semibold text-neutral-900">{data.user.avg_per_month}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Pricing Plans Quick Reference */}
      <Card className="border-neutral-200 bg-white">
        <CardHeader className="pb-4">
          <CardTitle className="text-lg font-semibold">Pacotes de Créditos Disponíveis</CardTitle>
          <div className="flex flex-wrap gap-2 mt-3">
            <Badge variant="outline" className="text-xs">💳 Cartão de Crédito</Badge>
            <Badge variant="outline" className="text-xs">⚡ PIX (Instantâneo)</Badge>
            <Badge variant="outline" className="text-xs">🧾 Boleto (3 dias)</Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {/* Starter Pack */}
            <div className="p-4 border border-neutral-200 rounded-lg hover:border-primary-300 transition-colors">
              <h3 className="font-semibold text-neutral-900 mb-1">{PRICING.PACKS.STARTER.NAME}</h3>
              <p className="text-2xl font-bold text-primary-600 mb-2">
                R$ {PRICING.PACKS.STARTER.PRICE.toFixed(2)}
              </p>
              <ul className="space-y-1 text-sm text-neutral-600 mb-4">
                <li>✓ {PRICING.PACKS.STARTER.CREDITS} créditos</li>
                <li>✓ {PRICING.PACKS.STARTER.COMPARISONS} comparações</li>
                <li>✓ Validade: {PRICING.PACKS.STARTER.VALIDITY_MONTHS} meses</li>
                <li className="text-green-600 font-medium">✓ Economize {PRICING.PACKS.STARTER.DISCOUNT}</li>
              </ul>
              <Button asChild variant="outline" size="sm" className="w-full">
                <Link href="/dashboard/billing/purchase?pack=starter">
                  Comprar
                </Link>
              </Button>
            </div>

            {/* Pro Pack */}
            <div className="p-4 border-2 border-primary-300 rounded-lg bg-primary-50/50 relative">
              <Badge className="absolute -top-2 right-4 bg-primary-600 text-white">Popular</Badge>
              <h3 className="font-semibold text-neutral-900 mb-1">{PRICING.PACKS.PRO.NAME}</h3>
              <p className="text-2xl font-bold text-primary-600 mb-2">
                R$ {PRICING.PACKS.PRO.PRICE.toFixed(2)}
              </p>
              <ul className="space-y-1 text-sm text-neutral-600 mb-4">
                <li>✓ {PRICING.PACKS.PRO.CREDITS} créditos</li>
                <li>✓ {PRICING.PACKS.PRO.COMPARISONS} comparações</li>
                <li>✓ {PRICING.PACKS.PRO.GOOGLE_VISION} análises Google Vision</li>
                <li>✓ Validade: {PRICING.PACKS.PRO.VALIDITY_MONTHS} meses</li>
                <li className="text-green-600 font-medium">✓ Economize {PRICING.PACKS.PRO.DISCOUNT}</li>
              </ul>
              <Button asChild size="sm" className="w-full">
                <Link href="/dashboard/billing/purchase?pack=pro">
                  Comprar
                </Link>
              </Button>
            </div>

            {/* Business Pack */}
            <div className="p-4 border border-neutral-200 rounded-lg hover:border-primary-300 transition-colors">
              <h3 className="font-semibold text-neutral-900 mb-1">{PRICING.PACKS.BUSINESS.NAME}</h3>
              <p className="text-2xl font-bold text-primary-600 mb-2">
                R$ {PRICING.PACKS.BUSINESS.PRICE.toFixed(2)}
              </p>
              <ul className="space-y-1 text-sm text-neutral-600 mb-4">
                <li>✓ {PRICING.PACKS.BUSINESS.CREDITS} créditos</li>
                <li>✓ Comparações ilimitadas</li>
                <li>✓ {PRICING.PACKS.BUSINESS.GOOGLE_VISION} análises Google Vision</li>
                <li>✓ {PRICING.PACKS.BUSINESS.STORAGE_GB}GB de armazenamento</li>
                <li className="text-green-600 font-medium">✓ Economize {PRICING.PACKS.BUSINESS.DISCOUNT}</li>
              </ul>
              <Button asChild variant="outline" size="sm" className="w-full">
                <Link href="/dashboard/billing/purchase?pack=business">
                  Comprar
                </Link>
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Transaction History */}
      <Card className="border-neutral-200 bg-white">
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg font-semibold">Histórico de Transações</CardTitle>
            <Receipt className="h-5 w-5 text-neutral-500" />
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Data</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead>Produto</TableHead>
                <TableHead>Créditos</TableHead>
                <TableHead>Valor</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Nota Fiscal</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.transactions.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center text-neutral-500 py-8">
                    Nenhuma transação registrada
                  </TableCell>
                </TableRow>
              ) : (
                data.transactions.map((transaction: any) => {
                  const statusConfig = statusBadgeConfig[transaction.status]
                  return (
                    <TableRow key={transaction.id}>
                      <TableCell className="font-medium">
                        {new Intl.DateTimeFormat('pt-BR', {
                          day: '2-digit',
                          month: 'short',
                          year: 'numeric',
                        }).format(new Date(transaction.created_at))}
                      </TableCell>
                      <TableCell>
                        <span className="text-sm text-neutral-600">
                          {typeLabels[transaction.type]}
                        </span>
                      </TableCell>
                      <TableCell>{transaction.product_name}</TableCell>
                      <TableCell>
                        {transaction.credits_purchased !== null ? (
                          <span className="text-green-600 font-medium">
                            +{transaction.credits_purchased}
                          </span>
                        ) : (
                          <span className="text-neutral-400">-</span>
                        )}
                      </TableCell>
                      <TableCell className="font-medium">
                        R$ {transaction.amount.toFixed(2)}
                      </TableCell>
                      <TableCell>
                        <Badge variant={statusConfig.variant}>
                          {statusConfig.label}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost" size="sm">
                          <Download className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  )
                })
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Credit Usage History */}
      <Card className="border-neutral-200 bg-white">
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg font-semibold">Histórico de Uso de Créditos</CardTitle>
            <TrendingUp className="h-5 w-5 text-neutral-500" />
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Data</TableHead>
                <TableHead>Descrição</TableHead>
                <TableHead>Créditos Usados</TableHead>
                <TableHead>Saldo Anterior</TableHead>
                <TableHead>Saldo Atual</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.creditUsage.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center text-neutral-500 py-8">
                    Nenhum uso de créditos registrado
                  </TableCell>
                </TableRow>
              ) : (
                data.creditUsage.map((usage: any) => (
                  <TableRow key={usage.id}>
                    <TableCell className="font-medium">
                      {new Intl.DateTimeFormat('pt-BR', {
                        day: '2-digit',
                        month: 'short',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      }).format(new Date(usage.created_at))}
                    </TableCell>
                    <TableCell>
                      {usage.inspection ? (
                        <Link
                          href={`/dashboard/inspections/${usage.inspection.id}`}
                          className="text-primary-600 hover:underline"
                        >
                          {usage.description || `Vistoria - ${usage.inspection.property?.name || 'Sem nome'}`}
                        </Link>
                      ) : (
                        usage.description || 'Uso de crédito'
                      )}
                    </TableCell>
                    <TableCell>
                      <span className="text-red-600 font-medium">
                        {usage.amount}
                      </span>
                    </TableCell>
                    <TableCell className="text-neutral-600">
                      -
                    </TableCell>
                    <TableCell className="font-medium text-neutral-900">
                      -
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}

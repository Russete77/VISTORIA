'use client'

import Link from 'next/link'
import { ArrowLeft, Check, Zap } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

/**
 * Billing Plans Page - VistorIA Pro
 * Shows all available subscription plans
 */

export default function BillingPlansPage() {
  const plans = [
    {
      id: 'free',
      name: 'Free',
      price: 0,
      period: 'para sempre',
      description: 'Teste o VistorIA Pro gratuitamente',
      features: [
        '3 créditos iniciais',
        '1 vistoria grátis',
        'Análise IA básica',
        'Armazenamento 1GB',
        'Suporte por email',
      ],
      limitations: [
        'Sem comparações',
        'Sem Google Vision',
        'Exportação limitada',
      ],
      cta: 'Plano Atual',
      disabled: true,
    },
    {
      id: 'pay_per_use',
      name: 'Pay Per Use',
      price: null,
      period: 'conforme usar',
      description: 'Pague apenas pelas vistorias que fizer',
      features: [
        'R$ 9,90 por vistoria',
        'Sem mensalidade',
        'Todos os recursos',
        'Comparações: R$ 5,00',
        'Google Vision: R$ 2,00',
        '10GB de armazenamento',
      ],
      cta: 'Selecionar',
      highlighted: false,
    },
    {
      id: 'professional',
      name: 'Professional',
      price: 299,
      period: '/mês',
      description: 'Para profissionais e pequenas imobiliárias',
      features: [
        '50 créditos/mês',
        '10 comparações/mês',
        '20 análises Google Vision/mês',
        '50GB de armazenamento',
        'Suporte prioritário',
        'API de integração',
      ],
      cta: 'Assinar Agora',
      highlighted: true,
    },
    {
      id: 'business',
      name: 'Business',
      price: 699,
      period: '/mês',
      description: 'Para equipes e imobiliárias médias',
      features: [
        '150 créditos/mês',
        'Comparações ilimitadas',
        'Google Vision ilimitado',
        '500GB de armazenamento',
        'Até 10 usuários',
        'White Label',
        'API completa',
        'Suporte 24/7',
      ],
      cta: 'Assinar Agora',
      highlighted: false,
    },
    {
      id: 'enterprise',
      name: 'Enterprise',
      price: null,
      period: 'customizado',
      description: 'Solução completa para grandes imobiliárias',
      features: [
        'Créditos ilimitados',
        'Usuários ilimitados',
        'Todos os recursos',
        'SLA garantido',
        'Implantação dedicada',
        'Treinamento incluído',
        'Integrações customizadas',
        'Account manager',
      ],
      cta: 'Falar com Vendas',
      highlighted: false,
    },
  ]

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
          <h1 className="text-3xl font-bold text-neutral-900">Planos e Preços</h1>
          <p className="text-neutral-600 mt-1">
            Escolha o melhor plano para suas necessidades
          </p>
        </div>
      </div>

      {/* Plans Grid */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {plans.map((plan) => (
          <Card
            key={plan.id}
            className={`relative ${
              plan.highlighted
                ? 'border-2 border-primary-500 shadow-lg'
                : 'border-neutral-200'
            }`}
          >
            {plan.highlighted && (
              <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                <Badge className="bg-primary-600 text-white px-4 py-1">
                  Mais Popular
                </Badge>
              </div>
            )}

            <CardHeader className="pb-4">
              <CardTitle className="text-xl">{plan.name}</CardTitle>
              <CardDescription>{plan.description}</CardDescription>
            </CardHeader>

            <CardContent className="space-y-6">
              {/* Price */}
              <div className="py-4">
                {plan.price !== null ? (
                  <>
                    <div className="flex items-baseline gap-1">
                      <span className="text-4xl font-bold text-neutral-900">
                        R$ {plan.price}
                      </span>
                      <span className="text-neutral-600">{plan.period}</span>
                    </div>
                    {plan.id === 'professional' && (
                      <p className="text-sm text-neutral-600 mt-1">
                        R$ 5,98 por vistoria
                      </p>
                    )}
                    {plan.id === 'business' && (
                      <p className="text-sm text-neutral-600 mt-1">
                        R$ 4,66 por vistoria
                      </p>
                    )}
                  </>
                ) : (
                  <div className="flex items-baseline gap-1">
                    <span className="text-2xl font-bold text-neutral-900">
                      {plan.id === 'free' ? 'Grátis' : 'Sob Consulta'}
                    </span>
                  </div>
                )}
              </div>

              {/* Features */}
              <div className="space-y-3">
                {plan.features.map((feature, idx) => (
                  <div key={idx} className="flex items-start gap-2">
                    <Check className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
                    <span className="text-sm text-neutral-700">{feature}</span>
                  </div>
                ))}
              </div>

              {/* Limitations */}
              {plan.limitations && (
                <div className="space-y-2 pt-3 border-t">
                  {plan.limitations.map((limitation, idx) => (
                    <div key={idx} className="flex items-start gap-2">
                      <span className="text-neutral-400">✕</span>
                      <span className="text-sm text-neutral-500">{limitation}</span>
                    </div>
                  ))}
                </div>
              )}

              {/* CTA */}
              <Button
                asChild={!plan.disabled}
                disabled={plan.disabled}
                className="w-full"
                variant={plan.highlighted ? 'default' : 'outline'}
              >
                {plan.id === 'enterprise' ? (
                  <Link href="/contact?plan=enterprise">{plan.cta}</Link>
                ) : plan.disabled ? (
                  <span>{plan.cta}</span>
                ) : (
                  <Link href={`/dashboard/billing/purchase?plan=${plan.id}`}>
                    {plan.cta}
                  </Link>
                )}
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* FAQ */}
      <Card>
        <CardHeader>
          <CardTitle>Perguntas Frequentes</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div>
            <h4 className="font-semibold text-neutral-900 mb-2">
              Posso mudar de plano depois?
            </h4>
            <p className="text-sm text-neutral-600">
              Sim! Você pode fazer upgrade ou downgrade a qualquer momento. Os créditos não utilizados
              serão mantidos.
            </p>
          </div>

          <div>
            <h4 className="font-semibold text-neutral-900 mb-2">
              O que acontece se eu ultrapassar meus créditos?
            </h4>
            <p className="text-sm text-neutral-600">
              Você pode comprar pacotes extras de créditos ou fazer upgrade para um plano maior.
              O sistema não permite fazer vistorias sem créditos.
            </p>
          </div>

          <div>
            <h4 className="font-semibold text-neutral-900 mb-2">
              Como funciona o período de teste?
            </h4>
            <p className="text-sm text-neutral-600">
              Todos os novos usuários começam com 3 créditos grátis no plano Free. Isso permite
              fazer 1 vistoria completa para testar a plataforma.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

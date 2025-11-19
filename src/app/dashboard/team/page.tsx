import Link from 'next/link'
import { Users, Crown, Building2, Zap, Shield, Globe } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

/**
 * Team Page - VistorIA Pro
 * Placeholder for multi-tenant team functionality (Business & Enterprise plans)
 */

export default function TeamPage() {
  const businessFeatures = [
    {
      icon: Users,
      title: 'Múltiplos Usuários',
      description: 'Adicione até 10 membros na sua equipe',
    },
    {
      icon: Crown,
      title: 'Permissões Granulares',
      description: 'Controle o que cada membro pode visualizar e editar',
    },
    {
      icon: Building2,
      title: 'Gestão Centralizada',
      description: 'Gerencie todos os imóveis e vistorias em um só lugar',
    },
    {
      icon: Zap,
      title: 'Workflows Colaborativos',
      description: 'Vistorias em equipe com atribuição de tarefas',
    },
    {
      icon: Shield,
      title: 'Auditoria Completa',
      description: 'Histórico de todas as ações dos membros',
    },
    {
      icon: Globe,
      title: 'White Label',
      description: 'Personalize com sua marca e domínio próprio',
    },
  ]

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-neutral-900 mb-2">
          Equipe
        </h1>
        <p className="text-neutral-600">
          Colabore com sua equipe e gerencie permissões
        </p>
      </div>

      {/* Unlock Feature Card */}
      <Card className="border-primary-200 bg-gradient-to-br from-primary-50 to-white">
        <CardContent className="p-8 md:p-12">
          <div className="flex flex-col items-center text-center max-w-3xl mx-auto">
            {/* Icon */}
            <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-primary-100">
              <Users className="h-10 w-10 text-primary-600" />
            </div>

            {/* Badge */}
            <Badge className="mb-4 bg-primary-600 text-white px-4 py-1">
              Disponível nos Planos Business e Enterprise
            </Badge>

            {/* Title */}
            <h2 className="text-3xl font-bold text-neutral-900 mb-4">
              Trabalhe em Equipe
            </h2>

            {/* Description */}
            <p className="text-lg text-neutral-600 mb-8 max-w-2xl">
              Desbloqueie o poder da colaboração! Adicione membros à sua equipe, delegue tarefas,
              controle permissões e aumente sua produtividade com funcionalidades avançadas de
              gestão de equipe.
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-4">
              <Button asChild size="lg" className="min-w-[200px]">
                <Link href="/dashboard/billing/plans">
                  Ver Planos
                </Link>
              </Button>
              <Button asChild variant="outline" size="lg" className="min-w-[200px]">
                <Link href="/dashboard/billing">
                  Fazer Upgrade
                </Link>
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Features Grid */}
      <div>
        <h3 className="text-xl font-semibold text-neutral-900 mb-6">
          O que você vai desbloquear:
        </h3>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {businessFeatures.map((feature) => {
            const Icon = feature.icon
            return (
              <Card
                key={feature.title}
                className="border-neutral-200 bg-white hover:border-primary-300 transition-all hover:shadow-md"
              >
                <CardHeader className="pb-4">
                  <div className="flex items-start gap-4">
                    <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary-100 text-primary-600 flex-shrink-0">
                      <Icon className="h-6 w-6" />
                    </div>
                    <div>
                      <CardTitle className="text-base font-semibold mb-2">
                        {feature.title}
                      </CardTitle>
                      <p className="text-sm text-neutral-600">
                        {feature.description}
                      </p>
                    </div>
                  </div>
                </CardHeader>
              </Card>
            )
          })}
        </div>
      </div>

      {/* Pricing Comparison */}
      <Card className="border-neutral-200 bg-white">
        <CardHeader className="pb-4">
          <CardTitle className="text-lg font-semibold">Comparação de Planos</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-6 md:grid-cols-2">
            {/* Business Plan */}
            <div className="p-6 border-2 border-primary-300 rounded-lg bg-primary-50/30">
              <div className="flex items-center justify-between mb-4">
                <h4 className="text-xl font-bold text-neutral-900">Business</h4>
                <Badge className="bg-primary-600 text-white">Recomendado</Badge>
              </div>
              <p className="text-3xl font-bold text-primary-600 mb-6">
                R$ 699<span className="text-lg font-normal text-neutral-600">/mês</span>
              </p>
              <ul className="space-y-3 mb-6">
                <li className="flex items-start gap-2 text-sm">
                  <span className="text-green-600 font-bold">✓</span>
                  <span>150 créditos/mês</span>
                </li>
                <li className="flex items-start gap-2 text-sm">
                  <span className="text-green-600 font-bold">✓</span>
                  <span>Até 10 usuários</span>
                </li>
                <li className="flex items-start gap-2 text-sm">
                  <span className="text-green-600 font-bold">✓</span>
                  <span>Comparações ilimitadas</span>
                </li>
                <li className="flex items-start gap-2 text-sm">
                  <span className="text-green-600 font-bold">✓</span>
                  <span>Google Vision AI ilimitado</span>
                </li>
                <li className="flex items-start gap-2 text-sm">
                  <span className="text-green-600 font-bold">✓</span>
                  <span>500GB de armazenamento</span>
                </li>
                <li className="flex items-start gap-2 text-sm">
                  <span className="text-green-600 font-bold">✓</span>
                  <span>White Label</span>
                </li>
                <li className="flex items-start gap-2 text-sm">
                  <span className="text-green-600 font-bold">✓</span>
                  <span>Acesso à API</span>
                </li>
              </ul>
              <Button asChild className="w-full">
                <Link href="/dashboard/billing/upgrade?plan=business">
                  Assinar Business
                </Link>
              </Button>
            </div>

            {/* Enterprise Plan */}
            <div className="p-6 border border-neutral-200 rounded-lg">
              <div className="flex items-center justify-between mb-4">
                <h4 className="text-xl font-bold text-neutral-900">Enterprise</h4>
                <Badge variant="outline">Customizado</Badge>
              </div>
              <p className="text-3xl font-bold text-neutral-900 mb-6">
                Sob Consulta
              </p>
              <ul className="space-y-3 mb-6">
                <li className="flex items-start gap-2 text-sm">
                  <span className="text-green-600 font-bold">✓</span>
                  <span>Créditos ilimitados</span>
                </li>
                <li className="flex items-start gap-2 text-sm">
                  <span className="text-green-600 font-bold">✓</span>
                  <span>Usuários ilimitados</span>
                </li>
                <li className="flex items-start gap-2 text-sm">
                  <span className="text-green-600 font-bold">✓</span>
                  <span>Todos os recursos do Business</span>
                </li>
                <li className="flex items-start gap-2 text-sm">
                  <span className="text-green-600 font-bold">✓</span>
                  <span>SLA garantido</span>
                </li>
                <li className="flex items-start gap-2 text-sm">
                  <span className="text-green-600 font-bold">✓</span>
                  <span>Suporte prioritário 24/7</span>
                </li>
                <li className="flex items-start gap-2 text-sm">
                  <span className="text-green-600 font-bold">✓</span>
                  <span>Implantação dedicada</span>
                </li>
                <li className="flex items-start gap-2 text-sm">
                  <span className="text-green-600 font-bold">✓</span>
                  <span>Integrações customizadas</span>
                </li>
              </ul>
              <Button asChild variant="outline" className="w-full">
                <Link href="/contact?plan=enterprise">
                  Falar com Vendas
                </Link>
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* FAQ Section */}
      <Card className="border-neutral-200 bg-white">
        <CardHeader className="pb-4">
          <CardTitle className="text-lg font-semibold">Perguntas Frequentes</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div>
            <h4 className="font-semibold text-neutral-900 mb-2">
              Quando a funcionalidade de equipe estará disponível?
            </h4>
            <p className="text-sm text-neutral-600">
              A funcionalidade de equipe está prevista para o primeiro trimestre de 2025. Assinantes
              dos planos Business e Enterprise terão acesso prioritário ao beta.
            </p>
          </div>

          <div>
            <h4 className="font-semibold text-neutral-900 mb-2">
              Posso fazer upgrade do meu plano atual?
            </h4>
            <p className="text-sm text-neutral-600">
              Sim! Você pode fazer upgrade a qualquer momento. Os créditos não utilizados do plano
              anterior serão mantidos e você receberá os créditos do novo plano proporcionalmente.
            </p>
          </div>

          <div>
            <h4 className="font-semibold text-neutral-900 mb-2">
              O que acontece se eu ultrapassar o limite de usuários?
            </h4>
            <p className="text-sm text-neutral-600">
              No plano Business, você pode adicionar usuários extras por R$ 50/mês por usuário. No
              plano Enterprise, não há limites.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

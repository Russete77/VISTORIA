import Link from 'next/link'
import {
  ArrowRight,
  Building2,
  Camera,
  FileText,
  Sparkles,
  CheckCircle,
  Zap,
  Shield,
  Check,
  Users,
  Star,
  TrendingUp,
  Mic,
  DollarSign,
  GitCompare,
  MessageSquare,
  Palette,
} from 'lucide-react'
import { SignInButton, SignUpButton, SignedIn, SignedOut, UserButton } from '@clerk/nextjs'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion'
import { MobileNav } from '@/components/mobile-nav'

// JSON-LD Schema para SEO
const jsonLd = {
  '@context': 'https://schema.org',
  '@graph': [
    {
      '@type': 'Organization',
      '@id': 'https://vistoria-pro.com.br/#organization',
      name: 'VistorIA Pro',
      url: 'https://vistoria-pro.com.br',
      logo: {
        '@type': 'ImageObject',
        url: 'https://vistoria-pro.com.br/logo.png',
      },
      description: 'Plataforma líder em vistorias imobiliárias com inteligência artificial',
      sameAs: [
        'https://twitter.com/vistoriapro',
        'https://linkedin.com/company/vistoriapro',
      ],
    },
    {
      '@type': 'SoftwareApplication',
      name: 'VistorIA Pro',
      applicationCategory: 'BusinessApplication',
      operatingSystem: 'Web',
      offers: {
        '@type': 'Offer',
        price: '0',
        priceCurrency: 'BRL',
        description: '1 vistoria grátis para experimentar',
      },
      aggregateRating: {
        '@type': 'AggregateRating',
        ratingValue: '4.9',
        ratingCount: '150',
        bestRating: '5',
        worstRating: '1',
      },
      featureList: [
        'Análise de fotos com IA Claude 4',
        'Detecção automática de problemas',
        'Laudo PDF profissional',
        'Comparação entrada/saída',
        'Estimativa de custos de reparo',
        'Ditado por voz',
      ],
    },
    {
      '@type': 'FAQPage',
      mainEntity: [
        {
          '@type': 'Question',
          name: 'Como funciona a análise com IA?',
          acceptedAnswer: {
            '@type': 'Answer',
            text: 'A VistorIA Pro utiliza o Claude 4, a IA mais avançada da Anthropic, para analisar cada foto enviada. O sistema identifica automaticamente problemas como rachaduras, manchas, danos em pisos, paredes e móveis, classificando a gravidade e sugerindo ações corretivas.',
          },
        },
        {
          '@type': 'Question',
          name: 'Posso usar no celular?',
          acceptedAnswer: {
            '@type': 'Answer',
            text: 'Sim! A VistorIA Pro é 100% responsiva e funciona perfeitamente em smartphones, tablets e desktops. Você pode tirar fotos diretamente do celular e criar laudos em qualquer lugar.',
          },
        },
        {
          '@type': 'Question',
          name: 'Os laudos são juridicamente válidos?',
          acceptedAnswer: {
            '@type': 'Answer',
            text: 'Sim. Os laudos gerados incluem todas as informações necessárias: fotos com data e hora, descrição detalhada dos problemas, e espaço para assinaturas digitais de todas as partes envolvidas.',
          },
        },
        {
          '@type': 'Question',
          name: 'Quanto tempo leva para gerar um laudo?',
          acceptedAnswer: {
            '@type': 'Answer',
            text: 'Após fazer o upload das fotos, a análise com IA leva de 30 segundos a 2 minutos, dependendo da quantidade de imagens. O laudo em PDF é gerado instantaneamente após a revisão final.',
          },
        },
      ],
    },
  ],
}

export default function HomePage() {
  return (
    <>
      {/* JSON-LD Schema */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      
    <div className="flex min-h-screen flex-col">
      {/* Header */}
      <header className="sticky top-0 z-50 w-full border-b border-neutral-200 bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/80">
        <div className="container-custom flex h-16 items-center">
          <Link href="/" className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary-600">
              <Building2 className="h-5 w-5 text-white" />
            </div>
            <span className="text-lg font-bold text-neutral-900">VistorIA Pro</span>
          </Link>
          <nav className="ml-auto hidden md:flex items-center gap-3">
            <SignedOut>
              <SignInButton mode="modal">
                <Button variant="ghost" size="sm">Entrar</Button>
              </SignInButton>
              <SignUpButton mode="modal">
                <Button size="sm">
                  Começar Grátis
                  <ArrowRight className="ml-1.5 h-4 w-4" />
                </Button>
              </SignUpButton>
            </SignedOut>
            <SignedIn>
              <Button variant="ghost" size="sm" asChild>
                <Link href="/dashboard">Dashboard</Link>
              </Button>
              <UserButton afterSignOutUrl="/" />
            </SignedIn>
          </nav>
          <MobileNav />
        </div>
      </header>

      <main className="flex-1">
        {/* Hero Section */}
        <section className="container-custom py-16 md:py-24 lg:py-32">
          <div className="mx-auto flex max-w-4xl flex-col items-center gap-8 text-center">
            <Badge variant="primary" className="gap-2">
              <Sparkles className="h-3.5 w-3.5" />
              Powered by Claude 4 AI
            </Badge>

            <h1 className="animate-fade-in text-balance text-4xl font-bold leading-tight tracking-tight text-neutral-900 md:text-5xl lg:text-6xl">
              Vistorias Imobiliárias com{' '}
              <span className="bg-gradient-to-r from-primary-600 to-primary-400 bg-clip-text text-transparent">
                Inteligência Artificial
              </span>
            </h1>

            <p className="max-w-2xl text-balance text-lg text-neutral-600 md:text-xl">
              Crie laudos profissionais em minutos. Análise com IA, ditado por voz,
              estimativa de custos e comparação de vistorias. Tudo em um só lugar.
            </p>

            <div className="flex flex-col gap-4 sm:flex-row">
              <SignUpButton mode="modal">
                <Button size="lg" className="w-full sm:w-auto">
                  Começar Grátis
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </SignUpButton>
              <Link href="#features">
                <Button size="lg" variant="outline" className="w-full sm:w-auto">
                  Ver Recursos
                </Button>
              </Link>
            </div>

            <div className="flex flex-wrap items-center justify-center gap-4 sm:gap-6 text-sm text-neutral-500">
              <div className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-success-600" />
                <span>1 vistoria grátis</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-success-600" />
                <span>Ditado por voz</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-success-600" />
                <span>Estimativa de custos</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-success-600" />
                <span>Resultados em minutos</span>
              </div>
            </div>
          </div>
        </section>

        {/* Stats Section */}
        <section className="border-t border-neutral-200 bg-white py-16 md:py-24">
          <div className="container-custom">
            <div className="mx-auto grid max-w-5xl grid-cols-2 gap-8 md:grid-cols-4">
              <div className="text-center">
                <div className="mb-2 flex items-center justify-center">
                  <Users className="mr-2 h-5 w-5 text-primary-600" />
                  <p className="text-4xl font-bold text-neutral-900">10.000+</p>
                </div>
                <p className="text-sm text-neutral-600">Vistorias Realizadas</p>
              </div>
              <div className="text-center">
                <div className="mb-2 flex items-center justify-center">
                  <Star className="mr-2 h-5 w-5 text-primary-600" />
                  <p className="text-4xl font-bold text-neutral-900">4.9/5</p>
                </div>
                <p className="text-sm text-neutral-600">Avaliação Média</p>
              </div>
              <div className="text-center">
                <div className="mb-2 flex items-center justify-center">
                  <TrendingUp className="mr-2 h-5 w-5 text-primary-600" />
                  <p className="text-4xl font-bold text-neutral-900">95%</p>
                </div>
                <p className="text-sm text-neutral-600">Precisão da IA</p>
              </div>
              <div className="text-center">
                <div className="mb-2 flex items-center justify-center">
                  <Zap className="mr-2 h-5 w-5 text-primary-600" />
                  <p className="text-4xl font-bold text-neutral-900">10x</p>
                </div>
                <p className="text-sm text-neutral-600">Mais Produtividade</p>
              </div>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section id="features" className="border-t border-neutral-200 bg-neutral-50 py-16 md:py-24">
          <div className="container-custom">
            <div className="mx-auto mb-12 max-w-3xl text-center">
              <h2 className="mb-4 text-3xl font-bold tracking-tight text-neutral-900 md:text-4xl">
                Tudo que você precisa para vistorias completas
              </h2>
              <p className="text-lg text-neutral-600">
                Tecnologia de ponta para simplificar seu trabalho e aumentar sua produtividade
              </p>
            </div>

            <div className="mx-auto grid max-w-6xl gap-6 md:grid-cols-2 lg:grid-cols-3">
              {/* Feature 1 - Captura */}
              <Card className="group border-neutral-200 bg-white p-6 transition-all hover:border-primary-300 hover:shadow-lg">
                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-primary-100 text-primary-600 transition-colors group-hover:bg-primary-600 group-hover:text-white">
                  <Camera className="h-6 w-6" />
                </div>
                <h3 className="mb-2 text-xl font-semibold text-neutral-900">
                  Captura Simplificada
                </h3>
                <p className="text-neutral-600">
                  Tire fotos de cada cômodo direto do celular ou desktop. Organize
                  por ambiente e adicione observações.
                </p>
              </Card>

              {/* Feature 2 - IA */}
              <Card className="group border-neutral-200 bg-white p-6 transition-all hover:border-primary-300 hover:shadow-lg">
                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-primary-100 text-primary-600 transition-colors group-hover:bg-primary-600 group-hover:text-white">
                  <Sparkles className="h-6 w-6" />
                </div>
                <h3 className="mb-2 text-xl font-semibold text-neutral-900">
                  Análise com IA
                </h3>
                <p className="text-neutral-600">
                  Claude 4 analisa automaticamente cada foto, detecta problemas,
                  classifica gravidade e sugere ações.
                </p>
              </Card>

              {/* Feature 3 - Voz */}
              <Card className="group border-neutral-200 bg-white p-6 transition-all hover:border-primary-300 hover:shadow-lg">
                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-emerald-100 text-emerald-600 transition-colors group-hover:bg-emerald-600 group-hover:text-white">
                  <Mic className="h-6 w-6" />
                </div>
                <Badge className="mb-3 bg-emerald-100 text-emerald-700 hover:bg-emerald-100">Novo</Badge>
                <h3 className="mb-2 text-xl font-semibold text-neutral-900">
                  Ditado por Voz
                </h3>
                <p className="text-neutral-600">
                  Dite observações com o microfone e a IA transcreve automaticamente.
                  Agilize a documentação sem digitar.
                </p>
              </Card>

              {/* Feature 4 - Custos */}
              <Card className="group border-neutral-200 bg-white p-6 transition-all hover:border-primary-300 hover:shadow-lg">
                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-emerald-100 text-emerald-600 transition-colors group-hover:bg-emerald-600 group-hover:text-white">
                  <DollarSign className="h-6 w-6" />
                </div>
                <Badge className="mb-3 bg-emerald-100 text-emerald-700 hover:bg-emerald-100">Novo</Badge>
                <h3 className="mb-2 text-xl font-semibold text-neutral-900">
                  Estimativa de Custos
                </h3>
                <p className="text-neutral-600">
                  Calcule automaticamente o custo de reparos com base em tabela de serviços.
                  Personalize preços por região.
                </p>
              </Card>

              {/* Feature 5 - Comparação */}
              <Card className="group border-neutral-200 bg-white p-6 transition-all hover:border-primary-300 hover:shadow-lg">
                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-primary-100 text-primary-600 transition-colors group-hover:bg-primary-600 group-hover:text-white">
                  <GitCompare className="h-6 w-6" />
                </div>
                <h3 className="mb-2 text-xl font-semibold text-neutral-900">
                  Comparação Inteligente
                </h3>
                <p className="text-neutral-600">
                  Compare vistorias de entrada e saída com IA que identifica novos
                  danos, desgaste natural e calcula responsabilidades.
                </p>
              </Card>

              {/* Feature 6 - Contestação */}
              <Card className="group border-neutral-200 bg-white p-6 transition-all hover:border-primary-300 hover:shadow-lg">
                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-amber-100 text-amber-600 transition-colors group-hover:bg-amber-600 group-hover:text-white">
                  <MessageSquare className="h-6 w-6" />
                </div>
                <Badge className="mb-3 bg-amber-100 text-amber-700 hover:bg-amber-100">Novo</Badge>
                <h3 className="mb-2 text-xl font-semibold text-neutral-900">
                  Sistema de Contestação
                </h3>
                <p className="text-neutral-600">
                  Inquilinos podem contestar problemas com fotos de evidência.
                  Proprietários respondem de forma organizada.
                </p>
              </Card>

              {/* Feature 7 - Templates */}
              <Card className="group border-neutral-200 bg-white p-6 transition-all hover:border-primary-300 hover:shadow-lg">
                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-purple-100 text-purple-600 transition-colors group-hover:bg-purple-600 group-hover:text-white">
                  <Palette className="h-6 w-6" />
                </div>
                <h3 className="mb-2 text-xl font-semibold text-neutral-900">
                  Templates Personalizados
                </h3>
                <p className="text-neutral-600">
                  Escolha entre diversos templates de PDF ou crie o seu.
                  Adicione sua logo e cores da marca.
                </p>
              </Card>

              {/* Feature 8 - PDF */}
              <Card className="group border-neutral-200 bg-white p-6 transition-all hover:border-primary-300 hover:shadow-lg">
                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-primary-100 text-primary-600 transition-colors group-hover:bg-primary-600 group-hover:text-white">
                  <FileText className="h-6 w-6" />
                </div>
                <h3 className="mb-2 text-xl font-semibold text-neutral-900">
                  Laudos Profissionais
                </h3>
                <p className="text-neutral-600">
                  Gere PDFs completos com fotos, problemas detectados,
                  custos estimados e assinaturas digitais.
                </p>
              </Card>

              {/* Feature 9 - Segurança */}
              <Card className="group border-neutral-200 bg-white p-6 transition-all hover:border-primary-300 hover:shadow-lg">
                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-primary-100 text-primary-600 transition-colors group-hover:bg-primary-600 group-hover:text-white">
                  <Shield className="h-6 w-6" />
                </div>
                <h3 className="mb-2 text-xl font-semibold text-neutral-900">
                  Seguro e Confiável
                </h3>
                <p className="text-neutral-600">
                  Dados criptografados, rate limiting, validação JWT.
                  Conforme LGPD e normas internacionais.
                </p>
              </Card>
            </div>
          </div>
        </section>

        {/* Pricing Section */}
        <section id="pricing" className="border-t border-neutral-200 bg-white py-16 md:py-24">
          <div className="container-custom">
            <div className="mx-auto mb-12 max-w-3xl text-center">
              <h2 className="mb-4 text-3xl font-bold tracking-tight text-neutral-900 md:text-4xl">
                Planos Flexíveis para seu Negócio
              </h2>
              <p className="text-lg text-neutral-600">
                Escolha o modelo que melhor se adapta às suas necessidades
              </p>
            </div>

            <div className="mx-auto grid max-w-6xl gap-8 md:grid-cols-2 lg:grid-cols-4">
              {/* Free Tier */}
              <Card className="border-neutral-200 bg-white p-6">
                <div className="mb-4">
                  <h3 className="text-xl font-bold text-neutral-900">Free</h3>
                  <p className="text-sm text-neutral-600">Para experimentar</p>
                </div>
                <div className="mb-6">
                  <p className="text-4xl font-bold text-neutral-900">R$ 0</p>
                  <p className="text-sm text-neutral-600">1 vistoria grátis</p>
                </div>
                <ul className="mb-6 space-y-3">
                  <li className="flex items-start gap-2">
                    <Check className="h-5 w-5 flex-shrink-0 text-success-600" />
                    <span className="text-sm text-neutral-700">
                      1 vistoria completa
                    </span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="h-5 w-5 flex-shrink-0 text-success-600" />
                    <span className="text-sm text-neutral-700">
                      Análise com IA
                    </span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="h-5 w-5 flex-shrink-0 text-success-600" />
                    <span className="text-sm text-neutral-700">
                      Laudo em PDF
                    </span>
                  </li>
                </ul>
                <SignUpButton mode="modal">
                  <Button variant="outline" className="w-full">Começar Grátis</Button>
                </SignUpButton>
              </Card>

              {/* Pay Per Use */}
              <Card className="border-neutral-200 bg-white p-6">
                <div className="mb-4">
                  <h3 className="text-xl font-bold text-neutral-900">
                    Pague por Uso
                  </h3>
                  <p className="text-sm text-neutral-600">Sem compromisso</p>
                </div>
                <div className="mb-6">
                  <p className="text-4xl font-bold text-neutral-900">R$ 29</p>
                  <p className="text-sm text-neutral-600">por vistoria</p>
                </div>
                <ul className="mb-6 space-y-3">
                  <li className="flex items-start gap-2">
                    <Check className="h-5 w-5 flex-shrink-0 text-success-600" />
                    <span className="text-sm text-neutral-700">
                      Pague só quando usar
                    </span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="h-5 w-5 flex-shrink-0 text-success-600" />
                    <span className="text-sm text-neutral-700">
                      Análise ilimitada de fotos
                    </span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="h-5 w-5 flex-shrink-0 text-success-600" />
                    <span className="text-sm text-neutral-700">
                      Suporte prioritário
                    </span>
                  </li>
                </ul>
                <SignUpButton mode="modal">
                  <Button className="w-full">Começar Agora</Button>
                </SignUpButton>
              </Card>

              {/* Professional Package */}
              <Card className="relative border-primary-300 bg-primary-50 p-6 ring-2 ring-primary-500">
                <Badge className="absolute -top-3 left-1/2 -translate-x-1/2 bg-primary-600 text-white">
                  Mais Popular
                </Badge>
                <div className="mb-4">
                  <h3 className="text-xl font-bold text-neutral-900">
                    Profissional
                  </h3>
                  <p className="text-sm text-neutral-600">
                    Pacote de vistorias
                  </p>
                </div>
                <div className="mb-6">
                  <p className="text-4xl font-bold text-neutral-900">R$ 249</p>
                  <p className="text-sm text-neutral-600">10 vistorias</p>
                </div>
                <ul className="mb-6 space-y-3">
                  <li className="flex items-start gap-2">
                    <Check className="h-5 w-5 flex-shrink-0 text-success-600" />
                    <span className="text-sm text-neutral-700">
                      Economia de 14%
                    </span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="h-5 w-5 flex-shrink-0 text-success-600" />
                    <span className="text-sm text-neutral-700">
                      Comparação entrada/saída
                    </span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="h-5 w-5 flex-shrink-0 text-success-600" />
                    <span className="text-sm text-neutral-700">
                      Assinaturas digitais
                    </span>
                  </li>
                </ul>
                <SignUpButton mode="modal">
                  <Button className="w-full">Adquirir Pacote</Button>
                </SignUpButton>
              </Card>

              {/* Business Subscription */}
              <Card className="border-neutral-200 bg-white p-6">
                <div className="mb-4">
                  <h3 className="text-xl font-bold text-neutral-900">
                    Empresarial
                  </h3>
                  <p className="text-sm text-neutral-600">Uso ilimitado</p>
                </div>
                <div className="mb-6">
                  <p className="text-4xl font-bold text-neutral-900">R$ 499</p>
                  <p className="text-sm text-neutral-600">por mês</p>
                </div>
                <ul className="mb-6 space-y-3">
                  <li className="flex items-start gap-2">
                    <Check className="h-5 w-5 flex-shrink-0 text-success-600" />
                    <span className="text-sm text-neutral-700">
                      Vistorias ilimitadas
                    </span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="h-5 w-5 flex-shrink-0 text-success-600" />
                    <span className="text-sm text-neutral-700">
                      Multi-usuários
                    </span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="h-5 w-5 flex-shrink-0 text-success-600" />
                    <span className="text-sm text-neutral-700">
                      API e integrações
                    </span>
                  </li>
                </ul>
                <SignUpButton mode="modal">
                  <Button variant="outline" className="w-full">Falar com Vendas</Button>
                </SignUpButton>
              </Card>
            </div>
          </div>
        </section>

        {/* FAQ Section */}
        <section className="border-t border-neutral-200 bg-neutral-50 py-16 md:py-24">
          <div className="container-custom">
            <div className="mx-auto mb-12 max-w-3xl text-center">
              <h2 className="mb-4 text-3xl font-bold tracking-tight text-neutral-900 md:text-4xl">
                Perguntas Frequentes
              </h2>
              <p className="text-lg text-neutral-600">
                Tudo que você precisa saber sobre a VistorIA Pro
              </p>
            </div>

            <div className="mx-auto max-w-3xl">
              <Accordion type="single" collapsible className="space-y-4">
                <AccordionItem
                  value="item-1"
                  className="rounded-lg border border-neutral-200 bg-white px-6"
                >
                  <AccordionTrigger className="text-left font-semibold text-neutral-900 hover:no-underline">
                    Como funciona a análise com IA?
                  </AccordionTrigger>
                  <AccordionContent className="text-neutral-600">
                    A VistorIA Pro utiliza o Claude 4, a IA mais avançada da
                    Anthropic, para analisar cada foto enviada. O sistema
                    identifica automaticamente problemas como rachaduras, manchas,
                    danos em pisos, paredes e móveis, classificando a gravidade e
                    sugerindo ações corretivas. Tudo em segundos.
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem
                  value="item-2"
                  className="rounded-lg border border-neutral-200 bg-white px-6"
                >
                  <AccordionTrigger className="text-left font-semibold text-neutral-900 hover:no-underline">
                    Posso usar no celular?
                  </AccordionTrigger>
                  <AccordionContent className="text-neutral-600">
                    Sim! A VistorIA Pro é 100% responsiva e funciona
                    perfeitamente em smartphones, tablets e desktops. Você pode
                    tirar fotos diretamente do celular e criar laudos em
                    qualquer lugar.
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem
                  value="item-3"
                  className="rounded-lg border border-neutral-200 bg-white px-6"
                >
                  <AccordionTrigger className="text-left font-semibold text-neutral-900 hover:no-underline">
                    Como funciona a comparação entrada/saída?
                  </AccordionTrigger>
                  <AccordionContent className="text-neutral-600">
                    Ao criar uma vistoria de saída, o sistema compara
                    automaticamente as fotos com a vistoria de entrada do mesmo
                    imóvel. A IA identifica diferenças, novos danos e desgaste
                    natural, facilitando a avaliação de responsabilidades.
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem
                  value="item-4"
                  className="rounded-lg border border-neutral-200 bg-white px-6"
                >
                  <AccordionTrigger className="text-left font-semibold text-neutral-900 hover:no-underline">
                    Os laudos são juridicamente válidos?
                  </AccordionTrigger>
                  <AccordionContent className="text-neutral-600">
                    Sim. Os laudos gerados incluem todas as informações
                    necessárias: fotos com data e hora, descrição detalhada dos
                    problemas, e espaço para assinaturas digitais de todas as
                    partes envolvidas (vistoriador, inquilino, proprietário).
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem
                  value="item-5"
                  className="rounded-lg border border-neutral-200 bg-white px-6"
                >
                  <AccordionTrigger className="text-left font-semibold text-neutral-900 hover:no-underline">
                    Quanto tempo leva para gerar um laudo?
                  </AccordionTrigger>
                  <AccordionContent className="text-neutral-600">
                    Após fazer o upload das fotos, a análise com IA leva de 30
                    segundos a 2 minutos, dependendo da quantidade de imagens. O
                    laudo em PDF é gerado instantaneamente após a revisão final.
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem
                  value="item-6"
                  className="rounded-lg border border-neutral-200 bg-white px-6"
                >
                  <AccordionTrigger className="text-left font-semibold text-neutral-900 hover:no-underline">
                    Posso editar as análises da IA?
                  </AccordionTrigger>
                  <AccordionContent className="text-neutral-600">
                    Sim! Todas as análises podem ser editadas, confirmadas ou
                    descartadas. Você tem controle total sobre o laudo final,
                    podendo adicionar observações manualmente ou ajustar a
                    gravidade dos problemas detectados.
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem
                  value="item-7"
                  className="rounded-lg border border-neutral-200 bg-white px-6"
                >
                  <AccordionTrigger className="text-left font-semibold text-neutral-900 hover:no-underline">
                    Como funciona o ditado por voz?
                  </AccordionTrigger>
                  <AccordionContent className="text-neutral-600">
                    Basta clicar no ícone do microfone e falar. A IA transcreve
                    automaticamente o áudio em texto usando tecnologia avançada
                    (OpenAI Whisper). Ideal para documentar observações durante
                    a vistoria sem precisar digitar.
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem
                  value="item-8"
                  className="rounded-lg border border-neutral-200 bg-white px-6"
                >
                  <AccordionTrigger className="text-left font-semibold text-neutral-900 hover:no-underline">
                    Como funciona a estimativa de custos?
                  </AccordionTrigger>
                  <AccordionContent className="text-neutral-600">
                    O sistema possui uma tabela de serviços de reparo com preços
                    regionalizados. A IA sugere automaticamente o serviço mais
                    adequado para cada problema detectado e calcula o custo
                    estimado. Você pode ajustar manualmente se necessário.
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="bg-gradient-to-br from-primary-600 to-primary-700 py-16 md:py-24">
          <div className="container-custom">
            <div className="mx-auto max-w-3xl text-center text-white">
              <h2 className="mb-4 text-3xl font-bold tracking-tight md:text-4xl">
                Pronto para revolucionar suas vistorias?
              </h2>
              <p className="mb-8 text-lg text-primary-100 md:text-xl">
                Junte-se a centenas de profissionais que já economizam horas
                com a VistorIA Pro. Comece grátis hoje mesmo.
              </p>
              <div className="flex flex-col items-center justify-center gap-4 sm:flex-row">
                <SignUpButton mode="modal">
                  <Button
                    size="lg"
                    variant="outline"
                    className="w-full border-white bg-white text-primary-600 hover:bg-primary-50 sm:w-auto"
                  >
                    Começar Gratuitamente
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Button>
                </SignUpButton>
                <Link href="#features">
                  <Button
                    size="lg"
                    variant="ghost"
                    className="w-full text-white hover:bg-primary-500/20 sm:w-auto"
                  >
                    Ver Demonstração
                  </Button>
                </Link>
              </div>
              <p className="mt-6 text-sm text-primary-200">
                Sem compromisso • Cancele quando quiser
              </p>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-neutral-200 bg-neutral-50 py-12 md:py-16">
        <div className="container-custom">
          <div className="grid gap-8 md:grid-cols-4 mb-8">
            {/* Brand */}
            <div>
              <div className="flex items-center gap-2 mb-4">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary-600">
                  <Building2 className="h-4 w-4 text-white" />
                </div>
                <span className="font-semibold text-neutral-900">
                  VistorIA Pro
                </span>
              </div>
              <p className="text-sm text-neutral-600">
                Vistorias imobiliárias com inteligência artificial. Rápido,
                preciso e profissional.
              </p>
            </div>

            {/* Product */}
            <div>
              <h3 className="font-semibold text-neutral-900 mb-4">Produto</h3>
              <ul className="space-y-3 text-sm text-neutral-600">
                <li>
                  <Link href="#features" className="hover:text-primary-600">
                    Recursos
                  </Link>
                </li>
                <li>
                  <Link href="#pricing" className="hover:text-primary-600">
                    Preços
                  </Link>
                </li>
                <li>
                  <Link href="/dashboard" className="hover:text-primary-600">
                    Dashboard
                  </Link>
                </li>
              </ul>
            </div>

            {/* Company */}
            <div>
              <h3 className="font-semibold text-neutral-900 mb-4">Suporte</h3>
              <ul className="space-y-3 text-sm text-neutral-600">
                <li>
                  <a href="mailto:contato@vistoria-pro.com.br" className="hover:text-primary-600">
                    Contato
                  </a>
                </li>
                <li>
                  <a href="mailto:suporte@vistoria-pro.com.br" className="hover:text-primary-600">
                    Suporte
                  </a>
                </li>
              </ul>
            </div>

            {/* Legal */}
            <div>
              <h3 className="font-semibold text-neutral-900 mb-4">Legal</h3>
              <ul className="space-y-3 text-sm text-neutral-600">
                <li>
                  <Link href="/privacidade" className="hover:text-primary-600">
                    Privacidade
                  </Link>
                </li>
                <li>
                  <Link href="/termos" className="hover:text-primary-600">
                    Termos de Uso
                  </Link>
                </li>
                <li>
                  <Link href="/lgpd" className="hover:text-primary-600">
                    LGPD
                  </Link>
                </li>
                <li>
                  <Link href="/cookies" className="hover:text-primary-600">
                    Cookies
                  </Link>
                </li>
              </ul>
            </div>
          </div>

          {/* Bottom Bar */}
          <div className="pt-8 border-t border-neutral-200 flex flex-col items-center justify-between gap-4 md:flex-row">
            <p className="text-sm text-neutral-600">
              © {new Date().getFullYear()} VistorIA Pro. Todos os direitos
              reservados.
            </p>
            <div className="flex items-center gap-4 text-sm text-neutral-600">
              <span>Powered by Claude 4</span>
              <span className="text-neutral-300">|</span>
              <span>Made with ❤️ in Brasil</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
    </>
  )
}

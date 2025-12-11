import Link from 'next/link'
import { Building2, ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Termos de Uso',
  description: 'Termos de Uso da plataforma VistorIA Pro - Leia atentamente antes de utilizar nossos serviços.',
}

export default function TermosPage() {
  return (
    <div className="min-h-screen bg-neutral-50">
      {/* Header */}
      <header className="sticky top-0 z-50 w-full border-b border-neutral-200 bg-white/95 backdrop-blur">
        <div className="container-custom flex h-16 items-center">
          <Link href="/" className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary-600">
              <Building2 className="h-5 w-5 text-white" />
            </div>
            <span className="text-lg font-bold text-neutral-900">VistorIA Pro</span>
          </Link>
          <div className="ml-auto">
            <Button variant="ghost" size="sm" asChild>
              <Link href="/">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Voltar
              </Link>
            </Button>
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="container-custom py-12 md:py-16">
        <div className="mx-auto max-w-3xl">
          <h1 className="mb-8 text-3xl font-bold text-neutral-900 md:text-4xl">
            Termos de Uso
          </h1>
          
          <div className="prose prose-neutral max-w-none">
            <p className="text-neutral-600 mb-6">
              Última atualização: {new Date().toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' })}
            </p>

            <section className="mb-8">
              <h2 className="text-xl font-semibold text-neutral-900 mb-4">1. Aceitação dos Termos</h2>
              <p className="text-neutral-700 mb-4">
                Ao acessar ou usar a plataforma VistorIA Pro, você concorda em cumprir estes Termos de Uso e todas as leis e regulamentos aplicáveis. Se você não concordar com algum destes termos, está proibido de usar ou acessar este site.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold text-neutral-900 mb-4">2. Descrição do Serviço</h2>
              <p className="text-neutral-700 mb-4">
                A VistorIA Pro é uma plataforma SaaS (Software as a Service) que oferece serviços de criação de laudos de vistoria imobiliária com análise automatizada por inteligência artificial.
              </p>
              <p className="text-neutral-700 mb-4">
                O serviço inclui:
              </p>
              <ul className="list-disc pl-6 text-neutral-700 mb-4">
                <li>Upload e organização de fotos por cômodos</li>
                <li>Análise automática de imagens com IA</li>
                <li>Detecção de problemas e classificação de gravidade</li>
                <li>Geração de laudos em PDF</li>
                <li>Comparação entre vistorias de entrada e saída</li>
                <li>Estimativas de custos de reparo</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold text-neutral-900 mb-4">3. Cadastro e Conta</h2>
              <p className="text-neutral-700 mb-4">
                Para utilizar nossos serviços, você deve criar uma conta fornecendo informações verdadeiras, atuais e completas. Você é responsável por manter a confidencialidade de sua senha e por todas as atividades realizadas em sua conta.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold text-neutral-900 mb-4">4. Uso Aceitável</h2>
              <p className="text-neutral-700 mb-4">
                Você concorda em não usar a plataforma para:
              </p>
              <ul className="list-disc pl-6 text-neutral-700 mb-4">
                <li>Violar leis ou regulamentos aplicáveis</li>
                <li>Fazer upload de conteúdo ilegal ou ofensivo</li>
                <li>Tentar acessar áreas restritas do sistema</li>
                <li>Interferir na operação normal da plataforma</li>
                <li>Revender ou redistribuir nossos serviços sem autorização</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold text-neutral-900 mb-4">5. Pagamentos e Reembolsos</h2>
              <p className="text-neutral-700 mb-4">
                Os pagamentos são processados de forma segura através do Stripe. Créditos adquiridos não são reembolsáveis após o uso. Para assinaturas, você pode cancelar a qualquer momento, e terá acesso até o final do período pago.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold text-neutral-900 mb-4">6. Propriedade Intelectual</h2>
              <p className="text-neutral-700 mb-4">
                Todo o conteúdo da plataforma, incluindo software, design, logotipos e textos, são propriedade exclusiva da VistorIA Pro. Os laudos gerados são de propriedade do usuário que os criou.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold text-neutral-900 mb-4">7. Limitação de Responsabilidade</h2>
              <p className="text-neutral-700 mb-4">
                A análise com IA é uma ferramenta de auxílio e não substitui a avaliação profissional de um vistoriador qualificado. A VistorIA Pro não se responsabiliza por decisões tomadas com base exclusivamente nas análises automáticas.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold text-neutral-900 mb-4">8. Modificações</h2>
              <p className="text-neutral-700 mb-4">
                Reservamo-nos o direito de modificar estes termos a qualquer momento. Notificaremos sobre mudanças significativas por e-mail ou através da plataforma.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold text-neutral-900 mb-4">9. Contato</h2>
              <p className="text-neutral-700 mb-4">
                Para dúvidas sobre estes Termos de Uso, entre em contato através do e-mail: contato@vistoria-pro.com.br
              </p>
            </section>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-neutral-200 bg-white py-8">
        <div className="container-custom text-center text-sm text-neutral-600">
          <p>© {new Date().getFullYear()} VistorIA Pro. Todos os direitos reservados.</p>
        </div>
      </footer>
    </div>
  )
}

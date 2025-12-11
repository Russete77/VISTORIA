import Link from 'next/link'
import { Building2, ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Política de Privacidade',
  description: 'Política de Privacidade da VistorIA Pro - Saiba como coletamos, usamos e protegemos seus dados.',
}

export default function PrivacidadePage() {
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
            Política de Privacidade
          </h1>
          
          <div className="prose prose-neutral max-w-none">
            <p className="text-neutral-600 mb-6">
              Última atualização: {new Date().toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' })}
            </p>

            <section className="mb-8">
              <h2 className="text-xl font-semibold text-neutral-900 mb-4">1. Introdução</h2>
              <p className="text-neutral-700 mb-4">
                A VistorIA Pro está comprometida em proteger sua privacidade. Esta política descreve como coletamos, usamos, armazenamos e protegemos suas informações pessoais.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold text-neutral-900 mb-4">2. Dados que Coletamos</h2>
              <p className="text-neutral-700 mb-4">
                Coletamos os seguintes tipos de dados:
              </p>
              <ul className="list-disc pl-6 text-neutral-700 mb-4">
                <li><strong>Dados de cadastro:</strong> nome, e-mail, telefone</li>
                <li><strong>Dados de uso:</strong> ações realizadas na plataforma, histórico de vistorias</li>
                <li><strong>Imagens:</strong> fotos de imóveis enviadas para análise</li>
                <li><strong>Dados de pagamento:</strong> processados pelo Stripe (não armazenamos números de cartão)</li>
                <li><strong>Dados técnicos:</strong> IP, navegador, dispositivo</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold text-neutral-900 mb-4">3. Como Usamos seus Dados</h2>
              <p className="text-neutral-700 mb-4">
                Utilizamos seus dados para:
              </p>
              <ul className="list-disc pl-6 text-neutral-700 mb-4">
                <li>Fornecer e melhorar nossos serviços</li>
                <li>Processar pagamentos e gerenciar sua conta</li>
                <li>Analisar imagens com inteligência artificial</li>
                <li>Gerar laudos de vistoria</li>
                <li>Enviar comunicações importantes sobre o serviço</li>
                <li>Melhorar nossos algoritmos de IA (dados anonimizados)</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold text-neutral-900 mb-4">4. Compartilhamento de Dados</h2>
              <p className="text-neutral-700 mb-4">
                Não vendemos seus dados. Compartilhamos informações apenas com:
              </p>
              <ul className="list-disc pl-6 text-neutral-700 mb-4">
                <li><strong>Provedores de serviço:</strong> Supabase (banco de dados), Clerk (autenticação), Stripe (pagamentos), Anthropic (IA)</li>
                <li><strong>Quando exigido por lei:</strong> em resposta a ordens judiciais ou solicitações legais</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold text-neutral-900 mb-4">5. Segurança dos Dados</h2>
              <p className="text-neutral-700 mb-4">
                Implementamos medidas de segurança incluindo:
              </p>
              <ul className="list-disc pl-6 text-neutral-700 mb-4">
                <li>Criptografia de dados em trânsito (HTTPS/TLS)</li>
                <li>Controle de acesso baseado em funções</li>
                <li>Autenticação segura (Clerk)</li>
                <li>Backups regulares</li>
                <li>Monitoramento de segurança</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold text-neutral-900 mb-4">6. Retenção de Dados</h2>
              <p className="text-neutral-700 mb-4">
                Mantemos seus dados enquanto sua conta estiver ativa. Após o encerramento da conta, os dados são retidos por 30 dias para permitir reativação, após o qual são excluídos permanentemente.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold text-neutral-900 mb-4">7. Seus Direitos</h2>
              <p className="text-neutral-700 mb-4">
                Você tem direito a:
              </p>
              <ul className="list-disc pl-6 text-neutral-700 mb-4">
                <li>Acessar seus dados pessoais</li>
                <li>Corrigir dados incorretos</li>
                <li>Solicitar exclusão de dados</li>
                <li>Exportar seus dados</li>
                <li>Retirar consentimento</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold text-neutral-900 mb-4">8. Cookies</h2>
              <p className="text-neutral-700 mb-4">
                Utilizamos cookies essenciais para funcionamento da plataforma e cookies analíticos para entender como você usa o serviço. Você pode gerenciar preferências de cookies nas configurações do navegador.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold text-neutral-900 mb-4">9. Contato</h2>
              <p className="text-neutral-700 mb-4">
                Para questões sobre privacidade, entre em contato: privacidade@vistoria-pro.com.br
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

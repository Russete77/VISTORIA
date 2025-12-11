import Link from 'next/link'
import { Building2, ArrowLeft, Shield, Eye, Trash2, Download, UserCheck } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'LGPD - Lei Geral de Proteção de Dados',
  description: 'Informações sobre como a VistorIA Pro está em conformidade com a Lei Geral de Proteção de Dados (LGPD).',
}

export default function LGPDPage() {
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
        <div className="mx-auto max-w-4xl">
          <h1 className="mb-4 text-3xl font-bold text-neutral-900 md:text-4xl">
            Lei Geral de Proteção de Dados (LGPD)
          </h1>
          <p className="text-lg text-neutral-600 mb-8">
            A VistorIA Pro está comprometida com a proteção dos seus dados pessoais, em conformidade com a Lei nº 13.709/2018 (LGPD).
          </p>

          {/* Seus Direitos */}
          <section className="mb-12">
            <h2 className="text-2xl font-semibold text-neutral-900 mb-6">Seus Direitos</h2>
            <div className="grid gap-4 md:grid-cols-2">
              <Card className="p-6 bg-white">
                <Eye className="h-8 w-8 text-primary-600 mb-3" />
                <h3 className="font-semibold text-neutral-900 mb-2">Direito de Acesso</h3>
                <p className="text-sm text-neutral-600">
                  Você pode solicitar confirmação de que tratamos seus dados e obter uma cópia das informações que mantemos sobre você.
                </p>
              </Card>

              <Card className="p-6 bg-white">
                <UserCheck className="h-8 w-8 text-primary-600 mb-3" />
                <h3 className="font-semibold text-neutral-900 mb-2">Direito de Correção</h3>
                <p className="text-sm text-neutral-600">
                  Você pode solicitar a correção de dados pessoais incompletos, inexatos ou desatualizados.
                </p>
              </Card>

              <Card className="p-6 bg-white">
                <Trash2 className="h-8 w-8 text-primary-600 mb-3" />
                <h3 className="font-semibold text-neutral-900 mb-2">Direito de Eliminação</h3>
                <p className="text-sm text-neutral-600">
                  Você pode solicitar a exclusão de seus dados pessoais, exceto quando a retenção for necessária por lei.
                </p>
              </Card>

              <Card className="p-6 bg-white">
                <Download className="h-8 w-8 text-primary-600 mb-3" />
                <h3 className="font-semibold text-neutral-900 mb-2">Direito de Portabilidade</h3>
                <p className="text-sm text-neutral-600">
                  Você pode solicitar a transferência de seus dados para outro fornecedor de serviço.
                </p>
              </Card>
            </div>
          </section>

          {/* Bases Legais */}
          <section className="mb-12">
            <h2 className="text-2xl font-semibold text-neutral-900 mb-6">Bases Legais para Tratamento</h2>
            <div className="bg-white rounded-lg border border-neutral-200 overflow-hidden">
              <table className="w-full">
                <thead className="bg-neutral-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-neutral-900">Finalidade</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-neutral-900">Base Legal</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-200">
                  <tr>
                    <td className="px-6 py-4 text-sm text-neutral-700">Criação e gestão de conta</td>
                    <td className="px-6 py-4 text-sm text-neutral-700">Execução de contrato</td>
                  </tr>
                  <tr>
                    <td className="px-6 py-4 text-sm text-neutral-700">Processamento de pagamentos</td>
                    <td className="px-6 py-4 text-sm text-neutral-700">Execução de contrato</td>
                  </tr>
                  <tr>
                    <td className="px-6 py-4 text-sm text-neutral-700">Análise de imagens com IA</td>
                    <td className="px-6 py-4 text-sm text-neutral-700">Execução de contrato</td>
                  </tr>
                  <tr>
                    <td className="px-6 py-4 text-sm text-neutral-700">Melhoria dos algoritmos</td>
                    <td className="px-6 py-4 text-sm text-neutral-700">Legítimo interesse (dados anonimizados)</td>
                  </tr>
                  <tr>
                    <td className="px-6 py-4 text-sm text-neutral-700">Retenção fiscal</td>
                    <td className="px-6 py-4 text-sm text-neutral-700">Obrigação legal</td>
                  </tr>
                  <tr>
                    <td className="px-6 py-4 text-sm text-neutral-700">E-mails de marketing</td>
                    <td className="px-6 py-4 text-sm text-neutral-700">Consentimento</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </section>

          {/* Encarregado */}
          <section className="mb-12">
            <h2 className="text-2xl font-semibold text-neutral-900 mb-6">Encarregado de Proteção de Dados (DPO)</h2>
            <Card className="p-6 bg-white">
              <div className="flex items-start gap-4">
                <Shield className="h-10 w-10 text-primary-600 flex-shrink-0" />
                <div>
                  <p className="text-neutral-700 mb-4">
                    Para exercer seus direitos ou esclarecer dúvidas sobre o tratamento de seus dados pessoais, entre em contato com nosso Encarregado de Proteção de Dados:
                  </p>
                  <p className="text-neutral-900 font-medium">
                    E-mail: lgpd@vistoria-pro.com.br
                  </p>
                  <p className="text-sm text-neutral-600 mt-2">
                    Responderemos sua solicitação em até 15 dias úteis, conforme estabelecido pela LGPD.
                  </p>
                </div>
              </div>
            </Card>
          </section>

          {/* Como Exercer */}
          <section>
            <h2 className="text-2xl font-semibold text-neutral-900 mb-6">Como Exercer Seus Direitos</h2>
            <div className="bg-white rounded-lg border border-neutral-200 p-6">
              <ol className="list-decimal pl-6 space-y-4 text-neutral-700">
                <li>
                  <strong>Via Plataforma:</strong> Acesse Configurações → Privacidade no seu dashboard para gerenciar suas preferências e solicitar exclusão de dados.
                </li>
                <li>
                  <strong>Via E-mail:</strong> Envie sua solicitação para lgpd@vistoria-pro.com.br com o assunto "Exercício de Direito LGPD".
                </li>
                <li>
                  <strong>Verificação de Identidade:</strong> Para sua segurança, podemos solicitar verificação de identidade antes de processar a solicitação.
                </li>
              </ol>

              <div className="mt-6 pt-6 border-t border-neutral-200">
                <p className="text-sm text-neutral-600">
                  Se não estiver satisfeito com nossa resposta, você pode apresentar reclamação à Autoridade Nacional de Proteção de Dados (ANPD).
                </p>
              </div>
            </div>
          </section>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-neutral-200 bg-white py-8">
        <div className="container-custom text-center text-sm text-neutral-600">
          <p>© {new Date().getFullYear()} VistorIA Pro. Todos os direitos reservados.</p>
          <p className="mt-2">
            <Link href="/termos" className="hover:text-primary-600">Termos de Uso</Link>
            {' · '}
            <Link href="/privacidade" className="hover:text-primary-600">Política de Privacidade</Link>
          </p>
        </div>
      </footer>
    </div>
  )
}

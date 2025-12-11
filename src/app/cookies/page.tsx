import Link from 'next/link'
import { Building2, ArrowLeft, Cookie, Shield, BarChart3, Settings } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Política de Cookies',
  description: 'Política de Cookies da VistorIA Pro - Entenda como utilizamos cookies e tecnologias similares.',
}

export default function CookiesPage() {
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
            Política de Cookies
          </h1>
          <p className="text-lg text-neutral-600 mb-8">
            Entenda como a VistorIA Pro utiliza cookies e tecnologias similares para melhorar sua experiência.
          </p>

          {/* Tipos de Cookies */}
          <section className="mb-12">
            <h2 className="text-2xl font-semibold text-neutral-900 mb-6">Tipos de Cookies que Utilizamos</h2>
            <div className="grid gap-4 md:grid-cols-2">
              <Card className="p-6 bg-white">
                <Cookie className="h-8 w-8 text-primary-600 mb-3" />
                <h3 className="font-semibold text-neutral-900 mb-2">Cookies Essenciais</h3>
                <p className="text-sm text-neutral-600 mb-3">
                  Necessários para o funcionamento básico da plataforma. Não podem ser desabilitados.
                </p>
                <ul className="text-xs text-neutral-500 space-y-1">
                  <li>• Autenticação de sessão (Clerk)</li>
                  <li>• Preferências de idioma</li>
                  <li>• Segurança e proteção contra fraudes</li>
                </ul>
              </Card>

              <Card className="p-6 bg-white">
                <BarChart3 className="h-8 w-8 text-primary-600 mb-3" />
                <h3 className="font-semibold text-neutral-900 mb-2">Cookies Analíticos</h3>
                <p className="text-sm text-neutral-600 mb-3">
                  Nos ajudam a entender como você usa a plataforma para melhorar nossos serviços.
                </p>
                <ul className="text-xs text-neutral-500 space-y-1">
                  <li>• Páginas mais visitadas</li>
                  <li>• Tempo de permanência</li>
                  <li>• Origem do tráfego</li>
                </ul>
              </Card>

              <Card className="p-6 bg-white">
                <Shield className="h-8 w-8 text-primary-600 mb-3" />
                <h3 className="font-semibold text-neutral-900 mb-2">Cookies de Segurança</h3>
                <p className="text-sm text-neutral-600 mb-3">
                  Protegem sua conta e dados contra acessos não autorizados.
                </p>
                <ul className="text-xs text-neutral-500 space-y-1">
                  <li>• Tokens de autenticação</li>
                  <li>• Verificação de dispositivo</li>
                  <li>• Proteção contra CSRF</li>
                </ul>
              </Card>

              <Card className="p-6 bg-white">
                <Settings className="h-8 w-8 text-primary-600 mb-3" />
                <h3 className="font-semibold text-neutral-900 mb-2">Cookies de Preferências</h3>
                <p className="text-sm text-neutral-600 mb-3">
                  Lembram suas escolhas para personalizar sua experiência.
                </p>
                <ul className="text-xs text-neutral-500 space-y-1">
                  <li>• Tema claro/escuro</li>
                  <li>• Configurações de exibição</li>
                  <li>• Preferências de notificação</li>
                </ul>
              </Card>
            </div>
          </section>

          {/* Tabela de Cookies */}
          <section className="mb-12">
            <h2 className="text-2xl font-semibold text-neutral-900 mb-6">Cookies Utilizados</h2>
            <div className="bg-white rounded-lg border border-neutral-200 overflow-hidden overflow-x-auto">
              <table className="w-full min-w-[600px]">
                <thead className="bg-neutral-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-neutral-900">Cookie</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-neutral-900">Provedor</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-neutral-900">Tipo</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-neutral-900">Duração</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-200">
                  <tr>
                    <td className="px-4 py-3 text-sm text-neutral-700 font-mono">__clerk_db_jwt</td>
                    <td className="px-4 py-3 text-sm text-neutral-700">Clerk</td>
                    <td className="px-4 py-3 text-sm text-neutral-700">Essencial</td>
                    <td className="px-4 py-3 text-sm text-neutral-700">Sessão</td>
                  </tr>
                  <tr>
                    <td className="px-4 py-3 text-sm text-neutral-700 font-mono">__session</td>
                    <td className="px-4 py-3 text-sm text-neutral-700">Clerk</td>
                    <td className="px-4 py-3 text-sm text-neutral-700">Essencial</td>
                    <td className="px-4 py-3 text-sm text-neutral-700">7 dias</td>
                  </tr>
                  <tr>
                    <td className="px-4 py-3 text-sm text-neutral-700 font-mono">sb-access-token</td>
                    <td className="px-4 py-3 text-sm text-neutral-700">Supabase</td>
                    <td className="px-4 py-3 text-sm text-neutral-700">Essencial</td>
                    <td className="px-4 py-3 text-sm text-neutral-700">1 hora</td>
                  </tr>
                  <tr>
                    <td className="px-4 py-3 text-sm text-neutral-700 font-mono">theme</td>
                    <td className="px-4 py-3 text-sm text-neutral-700">VistorIA Pro</td>
                    <td className="px-4 py-3 text-sm text-neutral-700">Preferência</td>
                    <td className="px-4 py-3 text-sm text-neutral-700">1 ano</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </section>

          {/* Como Gerenciar */}
          <section className="mb-12">
            <h2 className="text-2xl font-semibold text-neutral-900 mb-6">Como Gerenciar Cookies</h2>
            <div className="bg-white rounded-lg border border-neutral-200 p-6">
              <p className="text-neutral-700 mb-4">
                Você pode controlar e gerenciar cookies de várias formas:
              </p>
              <ol className="list-decimal pl-6 space-y-4 text-neutral-700">
                <li>
                  <strong>Configurações do navegador:</strong> A maioria dos navegadores permite bloquear ou excluir cookies. Consulte a documentação do seu navegador para instruções específicas.
                </li>
                <li>
                  <strong>Cookies de terceiros:</strong> Você pode optar por não receber cookies analíticos visitando as páginas de configuração dos respectivos provedores.
                </li>
                <li>
                  <strong>Modo privado:</strong> Use a navegação privada/anônima para limitar o armazenamento de cookies.
                </li>
              </ol>

              <div className="mt-6 p-4 bg-amber-50 border border-amber-200 rounded-lg">
                <p className="text-sm text-amber-800">
                  <strong>Atenção:</strong> Desabilitar cookies essenciais pode afetar o funcionamento da plataforma, impedindo o login e o uso normal dos serviços.
                </p>
              </div>
            </div>
          </section>

          {/* Atualizações */}
          <section>
            <h2 className="text-2xl font-semibold text-neutral-900 mb-6">Atualizações desta Política</h2>
            <div className="bg-white rounded-lg border border-neutral-200 p-6">
              <p className="text-neutral-700 mb-4">
                Esta política pode ser atualizada periodicamente. A última atualização foi em {new Date().toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' })}.
              </p>
              <p className="text-neutral-700">
                Para dúvidas sobre nossa política de cookies, entre em contato: <a href="mailto:privacidade@vistoria-pro.com.br" className="text-primary-600 hover:underline">privacidade@vistoria-pro.com.br</a>
              </p>
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
            {' · '}
            <Link href="/lgpd" className="hover:text-primary-600">LGPD</Link>
          </p>
        </div>
      </footer>
    </div>
  )
}

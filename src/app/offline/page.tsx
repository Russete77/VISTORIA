'use client'

import { WifiOff, RefreshCw, Home } from 'lucide-react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

/**
 * Página Offline - VistorIA Pro
 * Exibida quando o usuário está sem conexão
 */

export default function OfflinePage() {
  return (
    <div className="min-h-screen bg-neutral-50 flex items-center justify-center p-4">
      <Card className="max-w-md w-full">
        <CardHeader className="text-center">
          <div className="mx-auto w-16 h-16 bg-warning-100 rounded-full flex items-center justify-center mb-4">
            <WifiOff className="h-8 w-8 text-warning-600" />
          </div>
          <CardTitle className="text-2xl">Você está offline</CardTitle>
          <CardDescription>
            Não foi possível conectar à internet. Algumas funcionalidades podem estar limitadas.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* O que funciona offline */}
          <div className="bg-success-50 border border-success-200 rounded-lg p-4">
            <h3 className="font-semibold text-success-800 mb-2">
              Disponível offline:
            </h3>
            <ul className="text-sm text-success-700 space-y-1">
              <li>• Ver vistorias salvas em cache</li>
              <li>• Ver fotos já carregadas</li>
              <li>• Tirar novas fotos (sincroniza depois)</li>
              <li>• Criar rascunhos de vistorias</li>
            </ul>
          </div>

          {/* O que NÃO funciona offline */}
          <div className="bg-neutral-100 border border-neutral-200 rounded-lg p-4">
            <h3 className="font-semibold text-neutral-700 mb-2">
              Requer conexão:
            </h3>
            <ul className="text-sm text-neutral-600 space-y-1">
              <li>• Análise de IA das fotos</li>
              <li>• Gerar laudos PDF</li>
              <li>• Sincronizar dados</li>
              <li>• Criar novas vistorias</li>
            </ul>
          </div>

          {/* Ações */}
          <div className="flex flex-col gap-3">
            <Button
              onClick={() => window.location.reload()}
              className="w-full"
            >
              <RefreshCw className="mr-2 h-4 w-4" />
              Tentar novamente
            </Button>
            <Button
              variant="outline"
              asChild
              className="w-full"
            >
              <Link href="/dashboard">
                <Home className="mr-2 h-4 w-4" />
                Ir para Dashboard (cache)
              </Link>
            </Button>
          </div>

          {/* Dica */}
          <p className="text-xs text-neutral-500 text-center">
            Suas fotos e dados serão sincronizados automaticamente quando a conexão for restabelecida.
          </p>
        </CardContent>
      </Card>
    </div>
  )
}

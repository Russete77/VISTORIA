'use client'

import { useEffect, useState } from 'react'
import { Download, X, Smartphone } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { cn } from '@/lib/utils'

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

/**
 * Prompt para instalar o PWA
 * Aparece quando o app pode ser instalado
 */
export function InstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null)
  const [showPrompt, setShowPrompt] = useState(false)
  const [isInstalled, setIsInstalled] = useState(false)

  useEffect(() => {
    // Verifica se já está instalado
    if (window.matchMedia('(display-mode: standalone)').matches) {
      setIsInstalled(true)
      return
    }

    // Verifica se o usuário já dispensou
    const dismissed = localStorage.getItem('pwa-install-dismissed')
    if (dismissed) {
      const dismissedDate = new Date(dismissed)
      const daysSince = (Date.now() - dismissedDate.getTime()) / (1000 * 60 * 60 * 24)
      // Mostra novamente após 7 dias
      if (daysSince < 7) return
    }

    const handler = (e: Event) => {
      e.preventDefault()
      setDeferredPrompt(e as BeforeInstallPromptEvent)
      // Espera um pouco antes de mostrar
      setTimeout(() => setShowPrompt(true), 3000)
    }

    window.addEventListener('beforeinstallprompt', handler)

    // Detecta quando é instalado
    window.addEventListener('appinstalled', () => {
      setIsInstalled(true)
      setShowPrompt(false)
      setDeferredPrompt(null)
    })

    return () => {
      window.removeEventListener('beforeinstallprompt', handler)
    }
  }, [])

  const handleInstall = async () => {
    if (!deferredPrompt) return

    await deferredPrompt.prompt()
    const { outcome } = await deferredPrompt.userChoice

    if (outcome === 'accepted') {
      setIsInstalled(true)
    }

    setDeferredPrompt(null)
    setShowPrompt(false)
  }

  const handleDismiss = () => {
    localStorage.setItem('pwa-install-dismissed', new Date().toISOString())
    setShowPrompt(false)
  }

  if (isInstalled || !showPrompt || !deferredPrompt) return null

  return (
    <div className="fixed bottom-20 left-4 right-4 md:left-auto md:right-4 md:w-96 z-50 animate-in slide-in-from-bottom-5 duration-300">
      <Card className="border-primary-200 shadow-xl">
        <CardContent className="p-4">
          <div className="flex items-start gap-4">
            <div className="flex-shrink-0 p-2 bg-primary-100 rounded-lg">
              <Smartphone className="h-6 w-6 text-primary-600" />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-neutral-900 mb-1">
                Instalar VistorIA Pro
              </h3>
              <p className="text-sm text-neutral-600 mb-3">
                Instale o app para acesso rápido e funcionalidade offline
              </p>
              <div className="flex items-center gap-2">
                <Button size="sm" onClick={handleInstall}>
                  <Download className="h-4 w-4 mr-1" />
                  Instalar
                </Button>
                <Button size="sm" variant="ghost" onClick={handleDismiss}>
                  Agora não
                </Button>
              </div>
            </div>
            <button
              onClick={handleDismiss}
              className="text-neutral-400 hover:text-neutral-600 p-1"
              aria-label="Fechar"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

/**
 * Hook para verificar se o app está instalado como PWA
 */
export function useIsInstalled() {
  const [isInstalled, setIsInstalled] = useState(false)

  useEffect(() => {
    setIsInstalled(
      window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as any).standalone === true
    )
  }, [])

  return isInstalled
}

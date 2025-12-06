'use client'

import { useEffect, useState } from 'react'
import { WifiOff, Wifi, RefreshCw } from 'lucide-react'
import { useOffline } from '@/hooks/use-offline'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'

interface OfflineIndicatorProps {
  className?: string
}

/**
 * Indicador de status offline/online
 * Mostra toast quando perde/recupera conexão
 */
export function OfflineIndicator({ className }: OfflineIndicatorProps) {
  const { isOffline, wasOffline } = useOffline({
    onOffline: () => {
      toast.warning('Você está offline', {
        description: 'Algumas funcionalidades podem estar limitadas.',
        duration: 5000,
        icon: <WifiOff className="h-4 w-4" />,
      })
    },
    onOnline: () => {
      toast.success('Conexão restaurada!', {
        description: 'Sincronizando dados...',
        duration: 3000,
        icon: <Wifi className="h-4 w-4" />,
      })
    },
  })

  const [showBanner, setShowBanner] = useState(false)

  useEffect(() => {
    setShowBanner(isOffline)
  }, [isOffline])

  if (!showBanner) return null

  return (
    <div
      className={cn(
        'fixed bottom-4 left-4 right-4 md:left-auto md:right-4 md:w-80',
        'bg-warning-600 text-white rounded-lg shadow-lg p-4',
        'flex items-center gap-3 z-50',
        'animate-in slide-in-from-bottom-5 duration-300',
        className
      )}
    >
      <WifiOff className="h-5 w-5 flex-shrink-0" />
      <div className="flex-1 min-w-0">
        <p className="font-medium text-sm">Modo Offline</p>
        <p className="text-xs text-warning-100 truncate">
          Dados serão sincronizados quando voltar online
        </p>
      </div>
      <button
        onClick={() => window.location.reload()}
        className="p-2 hover:bg-warning-700 rounded-full transition-colors"
        aria-label="Tentar reconectar"
      >
        <RefreshCw className="h-4 w-4" />
      </button>
    </div>
  )
}

/**
 * Badge compacto para header/navbar
 */
export function OfflineBadge({ className }: OfflineIndicatorProps) {
  const { isOffline } = useOffline()

  if (!isOffline) return null

  return (
    <div
      className={cn(
        'inline-flex items-center gap-1.5 px-2 py-1',
        'bg-warning-100 text-warning-700 rounded-full text-xs font-medium',
        className
      )}
    >
      <WifiOff className="h-3 w-3" />
      <span>Offline</span>
    </div>
  )
}

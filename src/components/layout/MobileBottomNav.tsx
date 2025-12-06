'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  Building2,
  Home,
  ClipboardCheck,
  Settings,
  Users,
  DollarSign,
  LogOut,
  MoreHorizontal,
  GitCompare,
  ChevronDown,
  Calendar,
} from 'lucide-react'
import { useClerk } from '@clerk/nextjs'
import { cn } from '@/lib/utils'

// Itens principais (aparecem sempre na linha de baixo quando fechado)
const mainNavItems = [
  { name: 'Home', href: '/dashboard', icon: Home },
  { name: 'Imóveis', href: '/dashboard/properties', icon: Building2 },
  { name: 'Reservas', href: '/dashboard/bookings', icon: Calendar },
  { name: 'Vistorias', href: '/dashboard/inspections', icon: ClipboardCheck },
]

// Itens extras (aparecem na linha de baixo quando expandido)
const extraNavItems = [
  { name: 'Comparar', href: '/dashboard/comparisons', icon: GitCompare },
  { name: 'Equipe', href: '/dashboard/team', icon: Users },
  { name: 'Financeiro', href: '/dashboard/billing', icon: DollarSign },
  { name: 'Configurações', href: '/dashboard/settings', icon: Settings },
]

export function MobileBottomNav() {
  const pathname = usePathname()
  const [isExpanded, setIsExpanded] = useState(false)
  const { signOut } = useClerk()

  const handleSignOut = async () => {
    await signOut()
    window.location.href = '/'
  }

  // Fechar menu ao mudar de página
  useEffect(() => {
    setIsExpanded(false)
  }, [pathname])

  // Fechar menu ao clicar fora
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as HTMLElement
      if (isExpanded && !target.closest('[data-bottom-nav]')) {
        setIsExpanded(false)
      }
    }

    document.addEventListener('click', handleClickOutside)
    return () => document.removeEventListener('click', handleClickOutside)
  }, [isExpanded])

  const isActive = (href: string) => {
    if (href === '/dashboard') {
      return pathname === '/dashboard'
    }
    return pathname === href || pathname?.startsWith(href + '/')
  }

  // Verificar se algum item extra está ativo
  const isExtraActive = extraNavItems.some(item => isActive(item.href))

  return (
    <>
      {/* Overlay escuro */}
      <div
        className={cn(
          'lg:hidden fixed inset-0 z-40 bg-black/40 backdrop-blur-sm transition-opacity duration-300',
          isExpanded ? 'opacity-100' : 'opacity-0 pointer-events-none'
        )}
        onClick={() => setIsExpanded(false)}
      />

      {/* Bottom Navigation Container */}
      <div
        data-bottom-nav
        className="lg:hidden fixed bottom-0 left-0 right-0 z-50"
      >
        {/* Toolbar Expansível - Estilo Apple */}
        <div
          className="mx-3 mb-2 bg-white/95 backdrop-blur-xl rounded-3xl shadow-2xl border border-neutral-200/50 overflow-hidden transition-all duration-300 ease-out"
          style={{
            paddingBottom: 'env(safe-area-inset-bottom, 0px)',
          }}
        >
          {/* Seção Expandida - Ícones principais sobem para cá */}
          <div
            className={cn(
              'overflow-hidden transition-all duration-300 ease-out',
              isExpanded ? 'max-h-24 opacity-100' : 'max-h-0 opacity-0'
            )}
          >
            {/* Handle de arrastar */}
            <div className="flex justify-center pt-3 pb-1">
              <button
                onClick={() => setIsExpanded(false)}
                className="w-9 h-1 bg-neutral-300 rounded-full hover:bg-neutral-400 transition-colors"
              />
            </div>

            {/* Ícones principais que subiram */}
            <div className="flex items-center justify-around px-2 h-14">
              {mainNavItems.map((item) => {
                const Icon = item.icon
                const active = isActive(item.href)

                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    className={cn(
                      'flex flex-col items-center justify-center flex-1 h-full transition-all active:scale-95',
                      active ? 'text-primary-600' : 'text-neutral-500'
                    )}
                  >
                    <div
                      className={cn(
                        'flex items-center justify-center w-10 h-10 rounded-2xl transition-all',
                        active && 'bg-primary-100 scale-105'
                      )}
                    >
                      <Icon className={cn('h-5 w-5', active && 'text-primary-600')} />
                    </div>
                    <span
                      className={cn(
                        'text-[9px] font-medium -mt-0.5 transition-all',
                        active ? 'text-primary-600' : 'text-neutral-500'
                      )}
                    >
                      {item.name}
                    </span>
                  </Link>
                )
              })}
            </div>

            {/* Divisor sutil */}
            <div className="h-px bg-neutral-200/60 mx-6" />
          </div>

          {/* Barra Principal / Extras quando expandido */}
          <div className="flex items-center justify-around px-2 h-16">
            {/* Quando fechado: mostra os principais. Quando aberto: mostra os extras */}
            {!isExpanded ? (
              // Ícones principais
              <>
                {mainNavItems.map((item) => {
                  const Icon = item.icon
                  const active = isActive(item.href)

                  return (
                    <Link
                      key={item.name}
                      href={item.href}
                      className={cn(
                        'flex flex-col items-center justify-center flex-1 h-full transition-all active:scale-95',
                        active ? 'text-primary-600' : 'text-neutral-500'
                      )}
                    >
                      <div
                        className={cn(
                          'flex items-center justify-center w-11 h-11 rounded-2xl transition-all',
                          active && 'bg-primary-100 scale-105'
                        )}
                      >
                        <Icon className={cn('h-6 w-6', active && 'text-primary-600')} />
                      </div>
                      <span
                        className={cn(
                          'text-[10px] font-medium -mt-0.5 transition-all',
                          active ? 'text-primary-600' : 'text-neutral-500'
                        )}
                      >
                        {item.name}
                      </span>
                    </Link>
                  )
                })}
              </>
            ) : (
              // Ícones extras (quando expandido)
              <>
                {extraNavItems.map((item) => {
                  const Icon = item.icon
                  const active = isActive(item.href)

                  return (
                    <Link
                      key={item.name}
                      href={item.href}
                      className={cn(
                        'flex flex-col items-center justify-center flex-1 h-full transition-all active:scale-95',
                        active ? 'text-primary-600' : 'text-neutral-500'
                      )}
                    >
                      <div
                        className={cn(
                          'flex items-center justify-center w-11 h-11 rounded-2xl transition-all',
                          active && 'bg-primary-100 scale-105'
                        )}
                      >
                        <Icon className={cn('h-6 w-6', active && 'text-primary-600')} />
                      </div>
                      <span
                        className={cn(
                          'text-[10px] font-medium -mt-0.5 transition-all',
                          active ? 'text-primary-600' : 'text-neutral-500'
                        )}
                      >
                        {item.name}
                      </span>
                    </Link>
                  )
                })}

                {/* Botão Sair */}
                <button
                  onClick={handleSignOut}
                  className="flex flex-col items-center justify-center flex-1 h-full transition-all active:scale-95 text-red-500"
                >
                  <div className="flex items-center justify-center w-11 h-11 rounded-2xl transition-all hover:bg-red-50">
                    <LogOut className="h-6 w-6" />
                  </div>
                  <span className="text-[10px] font-medium -mt-0.5">
                    Sair
                  </span>
                </button>
              </>
            )}

            {/* Botão Mais - sempre visível */}
            <button
              onClick={(e) => {
                e.stopPropagation()
                setIsExpanded(!isExpanded)
              }}
              className={cn(
                'flex flex-col items-center justify-center flex-1 h-full transition-all active:scale-95',
                (isExpanded || isExtraActive) ? 'text-primary-600' : 'text-neutral-500'
              )}
            >
              <div
                className={cn(
                  'flex items-center justify-center w-11 h-11 rounded-2xl transition-all',
                  (isExpanded || isExtraActive) && 'bg-primary-100 scale-105'
                )}
              >
                {isExpanded ? (
                  <ChevronDown className="h-6 w-6 text-primary-600" />
                ) : (
                  <MoreHorizontal className={cn('h-6 w-6', isExtraActive && 'text-primary-600')} />
                )}
              </div>
              <span
                className={cn(
                  'text-[10px] font-medium -mt-0.5 transition-all',
                  (isExpanded || isExtraActive) ? 'text-primary-600' : 'text-neutral-500'
                )}
              >
                Mais
              </span>
            </button>
          </div>
        </div>
      </div>
    </>
  )
}

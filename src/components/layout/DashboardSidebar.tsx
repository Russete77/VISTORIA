'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState } from 'react'
import {
  Building2,
  Home,
  ClipboardCheck,
  Settings,
  Users,
  DollarSign,
  LogOut,
  Menu,
  X,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'

const navigation = [
  { name: 'Dashboard', href: '/dashboard', icon: Home },
  { name: 'Imóveis', href: '/dashboard/properties', icon: Building2 },
  { name: 'Vistorias', href: '/dashboard/inspections', icon: ClipboardCheck },
  { name: 'Equipe', href: '/dashboard/team', icon: Users },
  { name: 'Financeiro', href: '/dashboard/billing', icon: DollarSign },
  { name: 'Configurações', href: '/dashboard/settings', icon: Settings },
]

interface DashboardSidebarProps {
  className?: string
}

export function DashboardSidebar({ className }: DashboardSidebarProps) {
  const pathname = usePathname()
  const [isMobileOpen, setIsMobileOpen] = useState(false)

  return (
    <>
      {/* Mobile Menu Button */}
      <button
        onClick={() => setIsMobileOpen(!isMobileOpen)}
        className="lg:hidden fixed top-4 left-4 z-50 flex h-10 w-10 items-center justify-center rounded-lg bg-white border border-neutral-200 shadow-sm"
        aria-label="Toggle menu"
      >
        {isMobileOpen ? (
          <X className="h-5 w-5 text-neutral-700" />
        ) : (
          <Menu className="h-5 w-5 text-neutral-700" />
        )}
      </button>

      {/* Overlay para mobile */}
      {isMobileOpen && (
        <div
          className="lg:hidden fixed inset-0 z-30 bg-black/50"
          onClick={() => setIsMobileOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          'flex flex-col border-r border-neutral-200 bg-white',
          // Mobile: sidebar deslizante
          'fixed lg:sticky top-0 left-0 z-40 h-screen w-64 transition-transform duration-300',
          isMobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0',
          className
        )}
      >
        {/* Logo */}
        <div className="flex h-16 items-center gap-2 border-b border-neutral-200 px-6">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary-600">
            <Building2 className="h-5 w-5 text-white" />
          </div>
          <span className="text-lg font-bold text-neutral-900">VistorIA Pro</span>
        </div>

        {/* Navigation */}
        <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-4">
          {navigation.map((item) => {
            const isActive = pathname === item.href || pathname?.startsWith(item.href + '/')
            const Icon = item.icon

            return (
              <Link
                key={item.name}
                href={item.href}
                onClick={() => setIsMobileOpen(false)}
                className={cn(
                  'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-150',
                  isActive
                    ? 'bg-primary-100 text-primary-700'
                    : 'text-neutral-700 hover:bg-neutral-100'
                )}
              >
                <Icon className="h-5 w-5" aria-hidden="true" />
                <span>{item.name}</span>
              </Link>
            )
          })}
        </nav>

        {/* User Section */}
        <div className="border-t border-neutral-200 p-4">
          <div className="mb-3 flex items-center gap-3 rounded-lg bg-neutral-50 p-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary-100 text-sm font-semibold text-primary-700">
              JD
            </div>
            <div className="flex-1 overflow-hidden">
              <p className="truncate text-sm font-medium text-neutral-900">
                João Silva
              </p>
              <p className="truncate text-xs text-neutral-500">
                joao@exemplo.com
              </p>
            </div>
          </div>
          <Button
            variant="ghost"
            className="w-full justify-start gap-3 text-neutral-700"
            size="sm"
          >
            <LogOut className="h-4 w-4" />
            Sair
          </Button>
        </div>
      </aside>
    </>
  )
}

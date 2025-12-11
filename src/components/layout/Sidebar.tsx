'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard,
  Building2,
  ClipboardList,
  CreditCard,
  Settings,
  FileText,
  GitCompare,
  Calendar,
} from 'lucide-react'

import { cn } from '@/lib/utils'

const navigation = [
  {
    name: 'Dashboard',
    href: '/dashboard',
    icon: LayoutDashboard,
  },
  {
    name: 'Agenda',
    href: '/bookings',
    icon: Calendar,
  },
  {
    name: 'Comparações',
    href: '/comparisons',
    icon: GitCompare,
  },
  {
    name: 'Configurações',
    href: '/settings',
    icon: Settings,
  },
  {
    name: 'Créditos',
    href: '/billing',
    icon: CreditCard,
  },
  {
    name: 'Imóveis',
    href: '/properties',
    icon: Building2,
  },
  {
    name: 'Laudos',
    href: '/reports',
    icon: FileText,
  },
  {
    name: 'Vistorias',
    href: '/inspections',
    icon: ClipboardList,
  },
]

interface SidebarProps {
  className?: string
}

export function Sidebar({ className }: SidebarProps) {
  const pathname = usePathname()

  return (
    <aside className={cn('pb-12 w-64', className)}>
      <div className="space-y-4 py-4">
        <div className="px-3 py-2">
          <h2 className="mb-2 px-4 text-lg font-semibold tracking-tight">
            Menu
          </h2>
          <nav className="space-y-1">
            {navigation.map((item) => {
              const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`)
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={cn(
                    'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                    isActive
                      ? 'bg-primary text-primary-foreground'
                      : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
                  )}
                >
                  <item.icon className="h-4 w-4" />
                  {item.name}
                </Link>
              )
            })}
          </nav>
        </div>
      </div>
    </aside>
  )
}

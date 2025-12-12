'use client'

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
  GitCompare,
  Calendar,
  Shield,
} from 'lucide-react'
import { useClerk, useUser } from '@clerk/nextjs'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { useAuth } from '@/hooks/use-auth'
import Image from 'next/image'

const navigation = [
  { name: 'Dashboard', href: '/dashboard', icon: Home },
  { name: 'Agenda', href: '/dashboard/bookings', icon: Calendar },
  { name: 'Comparações', href: '/dashboard/comparisons', icon: GitCompare },
  { name: 'Configurações', href: '/dashboard/settings', icon: Settings },
  { name: 'Equipe', href: '/dashboard/team', icon: Users },
  { name: 'Financeiro', href: '/dashboard/billing', icon: DollarSign },
  { name: 'Imóveis', href: '/dashboard/properties', icon: Building2 },
  { name: 'Vistorias', href: '/dashboard/inspections', icon: ClipboardCheck },
]

interface DashboardSidebarProps {
  className?: string
}

export function DashboardSidebar({ className }: DashboardSidebarProps) {
  const pathname = usePathname()
  const { signOut } = useClerk()
  const { user: clerkUser } = useUser()
  const { user: dbUser } = useAuth()

  // Dados do usuário com fallback
  const userName = dbUser?.full_name || clerkUser?.fullName || clerkUser?.firstName || 'Usuário'
  const userEmail = dbUser?.email || clerkUser?.primaryEmailAddress?.emailAddress || ''
  const userImage = dbUser?.image_url || clerkUser?.imageUrl

  // Iniciais para avatar
  const getInitials = (name: string) => {
    const parts = name.split(' ')
    if (parts.length >= 2) {
      return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase()
    }
    return name.substring(0, 2).toUpperCase()
  }

  const userInitials = getInitials(userName)

  const handleSignOut = async () => {
    await signOut()
    window.location.href = '/'
  }

  return (
    <aside
      className={cn(
        'flex-col border-r border-neutral-200 bg-white',
        'sticky top-0 left-0 h-screen w-64',
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
            // Dashboard precisa de match exato, outras rotas podem ter subrotas
            const isActive =
              item.href === '/dashboard'
                ? pathname === '/dashboard'
                : pathname === item.href || pathname?.startsWith(item.href + '/')
            const Icon = item.icon

            return (
              <Link
                key={item.name}
                href={item.href}
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
          
          {/* Admin Link - only for admins */}
          {(dbUser?.role === 'admin' || dbUser?.role === 'super_admin') && (
            <Link
              href="/dashboard/admin"
              className={cn(
                'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-150 mt-4 border-t border-neutral-200 pt-4',
                pathname?.startsWith('/dashboard/admin')
                  ? 'bg-purple-100 text-purple-700'
                  : 'text-purple-600 hover:bg-purple-50'
              )}
            >
              <Shield className="h-5 w-5" aria-hidden="true" />
              <span>Admin</span>
            </Link>
          )}
        </nav>

        {/* User Section */}
        <div className="border-t border-neutral-200 p-4">
          <div className="mb-3 flex items-center gap-3 rounded-lg bg-neutral-50 p-3">
            {/* Avatar com foto ou iniciais */}
            {userImage ? (
              <div className="relative h-10 w-10 overflow-hidden rounded-full">
                <Image
                  src={userImage}
                  alt={userName}
                  fill
                  className="object-cover"
                />
              </div>
            ) : (
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary-100 text-sm font-semibold text-primary-700">
                {userInitials}
              </div>
            )}

            <div className="flex-1 overflow-hidden">
              <p className="truncate text-sm font-medium text-neutral-900">
                {userName}
              </p>
              <p className="truncate text-xs text-neutral-500">
                {userEmail}
              </p>
            </div>
          </div>
          <Button
            variant="ghost"
            className="w-full justify-start gap-3 text-neutral-700 hover:bg-neutral-100"
            size="sm"
            onClick={handleSignOut}
          >
            <LogOut className="h-4 w-4" />
            Sair
          </Button>
        </div>
    </aside>
  )
}

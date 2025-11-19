import Link from 'next/link'
import { UserButton } from '@clerk/nextjs'
import { Building2, Menu } from 'lucide-react'

import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

interface HeaderProps {
  onMenuClick?: () => void
}

export function Header({ onMenuClick }: HeaderProps) {
  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-14 items-center">
        <div className="flex items-center gap-2 md:gap-4">
          <Button
            variant="ghost"
            size="icon"
            className="md:hidden"
            onClick={onMenuClick}
            aria-label="Toggle menu"
          >
            <Menu className="h-5 w-5" />
          </Button>

          <Link href="/dashboard" className="flex items-center gap-2">
            <Building2 className="h-6 w-6 text-primary" />
            <span className="hidden font-bold sm:inline-block">
              VistorIA Pro
            </span>
          </Link>
        </div>

        <div className="ml-auto flex items-center gap-2">
          <nav className="hidden md:flex items-center gap-4 mr-4">
            <Link
              href="/dashboard"
              className="text-sm font-medium transition-colors hover:text-primary"
            >
              Dashboard
            </Link>
            <Link
              href="/properties"
              className="text-sm font-medium transition-colors hover:text-primary"
            >
              Imóveis
            </Link>
            <Link
              href="/inspections"
              className="text-sm font-medium transition-colors hover:text-primary"
            >
              Vistorias
            </Link>
            <Link
              href="/billing"
              className="text-sm font-medium transition-colors hover:text-primary"
            >
              Créditos
            </Link>
          </nav>

          <UserButton
            appearance={{
              elements: {
                avatarBox: 'w-8 h-8',
              },
            }}
            afterSignOutUrl="/"
          />
        </div>
      </div>
    </header>
  )
}

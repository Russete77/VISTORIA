import React from 'react'
import Link from 'next/link'
import { ChevronRight, Home } from 'lucide-react'
import { cn } from '@/lib/utils'

/**
 * Breadcrumbs Component
 * Navigation breadcrumb trail for hierarchical navigation
 */

export interface BreadcrumbItem {
  label: string
  href?: string
  icon?: React.ReactNode
}

interface BreadcrumbsProps {
  items: BreadcrumbItem[]
  className?: string
  showHome?: boolean
}

export function Breadcrumbs({ items, className, showHome = true }: BreadcrumbsProps) {
  const allItems = showHome
    ? [{ label: 'Home', href: '/dashboard', icon: <Home className="h-3.5 w-3.5" /> }, ...items]
    : items

  return (
    <nav
      className={cn('flex items-center space-x-2 text-sm text-neutral-600 mb-4', className)}
      aria-label="Breadcrumb"
    >
      {allItems.map((item, index) => {
        const isLast = index === allItems.length - 1

        return (
          <React.Fragment key={index}>
            {index > 0 && <ChevronRight className="h-4 w-4 flex-shrink-0" aria-hidden="true" />}

            {item.href && !isLast ? (
              <Link
                href={item.href}
                className="flex items-center gap-1.5 hover:text-primary-600 transition-colors"
              >
                {item.icon}
                <span>{item.label}</span>
              </Link>
            ) : (
              <span className="flex items-center gap-1.5 text-neutral-900 font-medium">
                {item.icon}
                <span>{item.label}</span>
              </span>
            )}
          </React.Fragment>
        )
      })}
    </nav>
  )
}

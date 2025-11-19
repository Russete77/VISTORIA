'use client'

import { useState } from 'react'
import { Header } from './Header'
import { Sidebar } from './Sidebar'
import { cn } from '@/lib/utils'

interface DashboardLayoutProps {
  children: React.ReactNode
}

export function DashboardLayout({ children }: DashboardLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false)

  return (
    <div className="relative min-h-screen">
      <Header onMenuClick={() => setSidebarOpen(!sidebarOpen)} />

      <div className="flex">
        {/* Mobile sidebar overlay */}
        {sidebarOpen && (
          <div
            className="fixed inset-0 z-40 bg-background/80 backdrop-blur-sm md:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}

        {/* Sidebar */}
        <div
          className={cn(
            'fixed inset-y-0 left-0 z-50 w-64 border-r bg-background transition-transform duration-300 ease-in-out md:relative md:translate-x-0',
            sidebarOpen ? 'translate-x-0' : '-translate-x-full'
          )}
        >
          <div className="mt-14 md:mt-0">
            <Sidebar />
          </div>
        </div>

        {/* Main content */}
        <main className="flex-1 p-6 md:p-8">
          {children}
        </main>
      </div>
    </div>
  )
}

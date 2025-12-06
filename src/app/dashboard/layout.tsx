import { DashboardSidebar } from '@/components/layout/DashboardSidebar'
import { MobileBottomNav } from '@/components/layout/MobileBottomNav'

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="flex min-h-screen bg-neutral-50">
      {/* Sidebar - apenas desktop */}
      <DashboardSidebar className="hidden lg:flex" />

      {/* Conteúdo principal */}
      <main className="flex-1 w-full">
        <div className="mx-auto max-w-7xl p-4 md:p-6 lg:p-8 pb-24 lg:pb-8">
          {children}
        </div>
      </main>

      {/* Bottom Navigation - apenas mobile/tablet */}
      <MobileBottomNav />
    </div>
  )
}

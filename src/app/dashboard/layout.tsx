import { DashboardSidebar } from '@/components/layout/DashboardSidebar'

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="flex min-h-screen bg-neutral-50">
      <DashboardSidebar />
      <main className="flex-1 w-full">
        <div className="mx-auto max-w-7xl p-4 md:p-6 lg:p-8">
          {children}
        </div>
      </main>
    </div>
  )
}

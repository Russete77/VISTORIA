import { Card } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'

/**
 * StatCardSkeleton Component
 * Loading placeholder for StatsCard
 */

export function StatCardSkeleton() {
  return (
    <Card className="border-neutral-200 bg-white p-4 sm:p-6">
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <Skeleton className="h-4 w-24 mb-3" />
          <Skeleton className="h-8 w-16 mb-2" />
          <Skeleton className="h-3 w-12" />
        </div>
        <Skeleton className="h-12 w-12 rounded-full" />
      </div>
    </Card>
  )
}

import { Card } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'

/**
 * PropertyCardSkeleton Component
 * Loading placeholder for PropertyCard
 */

export function PropertyCardSkeleton() {
  return (
    <Card className="overflow-hidden border-neutral-200 bg-white">
      {/* Thumbnail Skeleton */}
      <Skeleton className="h-48 w-full rounded-none" />

      {/* Content */}
      <div className="p-6">
        {/* Title */}
        <Skeleton className="h-6 w-3/4 mb-2" />

        {/* Address */}
        <Skeleton className="h-4 w-full mb-4" />

        {/* Metadata */}
        <div className="flex gap-4 mb-4">
          <Skeleton className="h-4 w-20" />
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-4 w-16" />
        </div>

        {/* Footer */}
        <div className="pt-4 border-t border-neutral-200">
          <Skeleton className="h-3 w-32" />
        </div>
      </div>
    </Card>
  )
}

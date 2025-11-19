import { Skeleton } from '@/components/ui/skeleton'

/**
 * InspectionRowSkeleton Component
 * Loading placeholder for Inspection table rows
 */

export function InspectionRowSkeleton() {
  return (
    <div className="grid gap-4 px-6 py-4 md:grid-cols-12 border-b border-neutral-200">
      {/* Type */}
      <div className="col-span-12 md:col-span-2">
        <div className="flex items-center gap-2">
          <Skeleton className="h-8 w-8 rounded-full" />
          <div className="flex-1">
            <Skeleton className="h-4 w-24 mb-1" />
            <Skeleton className="h-3 w-20 md:hidden" />
          </div>
        </div>
      </div>

      {/* Names - Hidden on mobile */}
      <div className="col-span-3 hidden md:block">
        <Skeleton className="h-4 w-32 mb-1" />
        <Skeleton className="h-3 w-24" />
      </div>

      {/* Status */}
      <div className="col-span-6 md:col-span-2">
        <Skeleton className="h-6 w-24 rounded-full" />
      </div>

      {/* Problems */}
      <div className="col-span-6 md:col-span-2">
        <Skeleton className="h-6 w-20 rounded-full" />
      </div>

      {/* Date */}
      <div className="col-span-6 md:col-span-2">
        <Skeleton className="h-4 w-28" />
      </div>

      {/* Actions */}
      <div className="col-span-6 md:col-span-1 flex gap-2">
        <Skeleton className="h-8 w-16" />
      </div>
    </div>
  )
}

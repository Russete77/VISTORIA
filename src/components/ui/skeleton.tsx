import { cn } from '@/lib/utils'

/**
 * Skeleton Component
 * Loading placeholder with pulse animation
 */

interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {}

export function Skeleton({ className, ...props }: SkeletonProps) {
  return (
    <div
      className={cn('animate-pulse rounded-lg bg-neutral-200', className)}
      {...props}
    />
  )
}

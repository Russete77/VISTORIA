import { LucideIcon, TrendingUp, TrendingDown } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { cn } from '@/lib/utils'

interface StatsCardProps {
  title: string
  value: string | number
  icon: LucideIcon
  trend?: 'up' | 'down'
  trendValue?: string
  className?: string
}

/**
 * StatsCard Component
 * Displays a metric card with icon, value, and optional trend indicator
 * Used in dashboard for showing key statistics
 */
export function StatsCard({
  title,
  value,
  icon: Icon,
  trend,
  trendValue,
  className,
}: StatsCardProps) {
  const trendColors = {
    up: 'text-success-600',
    down: 'text-danger-600',
  }

  const TrendIcon = trend === 'up' ? TrendingUp : TrendingDown

  return (
    <Card className={cn('p-6', className)}>
      {/* Header with icon */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-medium text-neutral-600">{title}</h3>
        <div className="p-2 rounded-lg bg-primary-50">
          <Icon className="h-5 w-5 text-primary-600" aria-hidden="true" />
        </div>
      </div>

      {/* Main value */}
      <div className="flex items-baseline justify-between">
        <p className="text-3xl font-bold text-neutral-900">{value}</p>

        {/* Trend indicator */}
        {trend && trendValue && (
          <div
            className={cn(
              'flex items-center gap-1 text-sm font-medium',
              trendColors[trend]
            )}
          >
            <TrendIcon className="h-4 w-4" aria-hidden="true" />
            <span>{trendValue}</span>
          </div>
        )}
      </div>
    </Card>
  )
}

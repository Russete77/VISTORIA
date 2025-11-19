import { Check } from 'lucide-react'
import { cn } from '@/lib/utils'

interface RoomProgressProps {
  completed: number
  total: number
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

const sizeConfig = {
  sm: {
    container: 'h-10 w-10',
    stroke: 3,
    text: 'text-xs',
    icon: 'h-4 w-4',
  },
  md: {
    container: 'h-12 w-12',
    stroke: 4,
    text: 'text-sm',
    icon: 'h-5 w-5',
  },
  lg: {
    container: 'h-16 w-16',
    stroke: 5,
    text: 'text-base',
    icon: 'h-6 w-6',
  },
}

export function RoomProgress({
  completed,
  total,
  size = 'md',
  className,
}: RoomProgressProps) {
  const percentage = total > 0 ? (completed / total) * 100 : 0
  const isComplete = completed === total && total > 0
  const config = sizeConfig[size]

  // SVG circle calculations
  const radius = size === 'sm' ? 16 : size === 'md' ? 20 : 28
  const circumference = 2 * Math.PI * radius
  const strokeDashoffset = circumference - (percentage / 100) * circumference

  return (
    <div className={cn('relative inline-flex items-center justify-center', config.container, className)}>
      {/* Background circle */}
      <svg
        className="absolute inset-0 -rotate-90 transform"
        viewBox="0 0 48 48"
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* Background track */}
        <circle
          cx="24"
          cy="24"
          r={radius}
          fill="none"
          stroke="currentColor"
          strokeWidth={config.stroke}
          className="text-neutral-200"
        />
        {/* Progress circle */}
        <circle
          cx="24"
          cy="24"
          r={radius}
          fill="none"
          stroke="currentColor"
          strokeWidth={config.stroke}
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          className={cn(
            'transition-all duration-500',
            isComplete ? 'text-success-500' : 'text-primary-500'
          )}
        />
      </svg>

      {/* Center content */}
      <div className="relative flex items-center justify-center">
        {isComplete ? (
          <Check className={cn(config.icon, 'text-success-600')} aria-hidden="true" />
        ) : (
          <span className={cn('font-semibold tabular-nums', config.text, 'text-neutral-700')}>
            {completed}/{total}
          </span>
        )}
      </div>

      {/* Screen reader only text */}
      <span className="sr-only">
        {completed} de {total} itens completos ({Math.round(percentage)}%)
      </span>
    </div>
  )
}

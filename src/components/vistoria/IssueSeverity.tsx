import { AlertCircle, AlertTriangle, Info } from 'lucide-react'
import { cn } from '@/lib/utils'

type SeverityLevel = 'low' | 'medium' | 'high' | 'urgent'

interface IssueSeverityProps {
  severity: SeverityLevel
  className?: string
  showLabel?: boolean
  size?: 'sm' | 'md' | 'lg'
}

const severityConfig: Record<SeverityLevel, {
  label: string
  icon: typeof Info
  iconColor: string
  bgColor: string
  textColor: string
  pulse?: boolean
}> = {
  low: {
    label: 'Baixa',
    icon: Info,
    iconColor: 'text-neutral-500',
    bgColor: 'bg-neutral-100',
    textColor: 'text-neutral-700',
  },
  medium: {
    label: 'Média',
    icon: AlertTriangle,
    iconColor: 'text-warning-600',
    bgColor: 'bg-warning-100',
    textColor: 'text-warning-700',
  },
  high: {
    label: 'Alta',
    icon: AlertCircle,
    iconColor: 'text-danger-600',
    bgColor: 'bg-danger-100',
    textColor: 'text-danger-700',
  },
  urgent: {
    label: 'Urgente',
    icon: AlertTriangle,
    iconColor: 'text-danger-700',
    bgColor: 'bg-danger-200',
    textColor: 'text-danger-800',
    pulse: true,
  },
}

export function IssueSeverity({
  severity,
  className,
  showLabel = true,
  size = 'md'
}: IssueSeverityProps) {
  const config = severityConfig[severity]
  const Icon = config.icon

  const sizeClasses = {
    sm: 'px-1.5 py-1 gap-1',
    md: 'px-2.5 py-1.5 gap-1.5',
    lg: 'px-3 py-2 gap-2',
  }

  const iconSizes = {
    sm: 'h-3 w-3',
    md: 'h-4 w-4',
    lg: 'h-5 w-5',
  }

  const textSizes = {
    sm: 'text-[10px]',
    md: 'text-xs',
    lg: 'text-sm',
  }

  return (
    <div
      className={cn(
        'inline-flex items-center rounded-md',
        sizeClasses[size],
        config.bgColor,
        className
      )}
    >
      <Icon
        className={cn(
          iconSizes[size],
          config.iconColor,
          config.pulse && 'animate-pulse'
        )}
        aria-hidden="true"
      />
      {showLabel && (
        <span className={cn('font-medium', textSizes[size], config.textColor)}>
          {config.label}
        </span>
      )}
    </div>
  )
}

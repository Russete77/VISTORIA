import { AlertCircle, AlertTriangle, Info } from 'lucide-react'
import { cn } from '@/lib/utils'

type SeverityLevel = 'low' | 'medium' | 'high' | 'urgent'

interface IssueSeverityProps {
  severity: SeverityLevel
  className?: string
  showLabel?: boolean
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
  showLabel = true
}: IssueSeverityProps) {
  const config = severityConfig[severity]
  const Icon = config.icon

  return (
    <div
      className={cn(
        'inline-flex items-center gap-1.5 rounded-md px-2.5 py-1.5',
        config.bgColor,
        className
      )}
    >
      <Icon
        className={cn(
          'h-4 w-4',
          config.iconColor,
          config.pulse && 'animate-pulse'
        )}
        aria-hidden="true"
      />
      {showLabel && (
        <span className={cn('text-xs font-medium', config.textColor)}>
          {config.label}
        </span>
      )}
    </div>
  )
}

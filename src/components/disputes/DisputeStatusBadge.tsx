import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import type { DisputeStatus } from '@/types/database'

interface DisputeStatusBadgeProps {
  status: DisputeStatus
  className?: string
}

const statusConfig: Record<
  DisputeStatus,
  {
    label: string
    variant: 'default' | 'info' | 'success' | 'primary' | 'danger'
    dotColor: string
    pulse?: boolean
  }
> = {
  pending: {
    label: 'Pendente',
    variant: 'default',
    dotColor: 'bg-neutral-400',
    pulse: true,
  },
  under_review: {
    label: 'Em Análise',
    variant: 'info',
    dotColor: 'bg-info-500',
    pulse: true,
  },
  accepted: {
    label: 'Aceita',
    variant: 'success',
    dotColor: 'bg-success-500',
  },
  rejected: {
    label: 'Rejeitada',
    variant: 'danger',
    dotColor: 'bg-danger-500',
  },
  resolved: {
    label: 'Resolvida',
    variant: 'primary',
    dotColor: 'bg-primary-500',
  },
}

export function DisputeStatusBadge({ status, className }: DisputeStatusBadgeProps) {
  const config = statusConfig[status]

  return (
    <Badge variant={config.variant} className={cn('gap-1.5', className)}>
      <span
        className={cn(
          'h-1.5 w-1.5 rounded-full',
          config.dotColor,
          config.pulse && 'animate-pulse'
        )}
        aria-hidden="true"
      />
      {config.label}
    </Badge>
  )
}

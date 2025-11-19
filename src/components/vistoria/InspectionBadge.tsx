import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'

type InspectionStatus = 'draft' | 'in_progress' | 'completed' | 'signed'

interface InspectionBadgeProps {
  status: InspectionStatus
  className?: string
}

const statusConfig: Record<InspectionStatus, { label: string; variant: 'default' | 'info' | 'success' | 'primary'; dotColor: string; pulse?: boolean }> = {
  draft: {
    label: 'Rascunho',
    variant: 'default',
    dotColor: 'bg-neutral-400',
  },
  in_progress: {
    label: 'Em Andamento',
    variant: 'info',
    dotColor: 'bg-info-500',
    pulse: true,
  },
  completed: {
    label: 'Concluída',
    variant: 'success',
    dotColor: 'bg-success-500',
  },
  signed: {
    label: 'Assinada',
    variant: 'primary',
    dotColor: 'bg-primary-500',
  },
}

export function InspectionBadge({ status, className }: InspectionBadgeProps) {
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

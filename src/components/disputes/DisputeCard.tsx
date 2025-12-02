import Link from 'next/link'
import { Calendar, MapPin, AlertCircle, MessageCircle } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { DisputeStatusBadge } from './DisputeStatusBadge'
import { cn } from '@/lib/utils'
import { DISPUTE_CATEGORIES, PROBLEM_SEVERITY } from '@/lib/constants'
import type { DisputeWithInspection } from '@/types/database'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'

interface DisputeCardProps {
  dispute: DisputeWithInspection
  className?: string
  messageCount?: number
  href?: string // Optional custom href for landlord access
}

export function DisputeCard({ dispute, className, messageCount = 0, href }: DisputeCardProps) {
  const categoryInfo = DISPUTE_CATEGORIES[dispute.category]
  const severityInfo = PROBLEM_SEVERITY[dispute.severity]
  const linkHref = href || `/dashboard/disputes/${dispute.id}`

  return (
    <Link href={linkHref}>
      <Card
        className={cn(
          'group relative overflow-hidden border-neutral-200 bg-white transition-all duration-200',
          'hover:shadow-lg hover:-translate-y-1 cursor-pointer',
          className
        )}
      >
        <div className="p-6">
          {/* Header */}
          <div className="flex items-start justify-between gap-4 mb-4">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-xs font-medium text-neutral-500">
                  {dispute.protocol}
                </span>
                <DisputeStatusBadge status={dispute.status} />
              </div>
              <h3 className="text-lg font-semibold text-neutral-900 truncate group-hover:text-primary-600 transition-colors">
                {dispute.item_description}
              </h3>
            </div>

            {/* Severity Badge */}
            <Badge
              className={cn(
                'shrink-0',
                severityInfo.bgColor,
                severityInfo.color
              )}
            >
              {severityInfo.label}
            </Badge>
          </div>

          {/* Category */}
          <div className="flex items-center gap-2 mb-3">
            <span className="text-base" aria-hidden="true">
              {categoryInfo.icon}
            </span>
            <span className="text-sm text-neutral-600">
              {categoryInfo.label}
            </span>
          </div>

          {/* Tenant Info */}
          <div className="mb-4">
            <p className="text-sm font-medium text-neutral-700 mb-1">
              {dispute.tenant_name}
            </p>
            <p className="text-sm text-neutral-500">
              {dispute.tenant_email}
            </p>
          </div>

          {/* Property Info */}
          {dispute.inspection?.property && (
            <div className="flex items-start gap-2 mb-4">
              <MapPin className="h-4 w-4 text-neutral-400 mt-0.5 shrink-0" />
              <div className="min-w-0">
                <p className="text-sm font-medium text-neutral-700 truncate">
                  {dispute.inspection.property.name}
                </p>
                <p className="text-xs text-neutral-500 truncate">
                  {dispute.inspection.property.address}
                </p>
              </div>
            </div>
          )}

          {/* Description Preview */}
          <p className="text-sm text-neutral-600 line-clamp-2 mb-4">
            {dispute.description}
          </p>

          {/* Footer */}
          <div className="flex items-center justify-between pt-4 border-t border-neutral-100">
            <div className="flex items-center gap-2 text-xs text-neutral-500">
              <Calendar className="h-3.5 w-3.5" />
              <span>
                {format(new Date(dispute.created_at), 'dd/MM/yyyy', { locale: ptBR })}
              </span>
            </div>

            {messageCount > 0 && (
              <div className="flex items-center gap-1.5 text-xs text-neutral-600">
                <MessageCircle className="h-3.5 w-3.5" />
                <span>{messageCount} {messageCount === 1 ? 'mensagem' : 'mensagens'}</span>
              </div>
            )}
          </div>

          {/* Item Location (if provided) */}
          {dispute.item_location && (
            <div className="mt-3 flex items-center gap-2">
              <AlertCircle className="h-3.5 w-3.5 text-neutral-400" />
              <span className="text-xs text-neutral-500">
                Local: {dispute.item_location}
              </span>
            </div>
          )}
        </div>

        {/* Hover Effect */}
        <div
          className="absolute inset-0 border-2 border-primary-500 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg pointer-events-none"
          aria-hidden="true"
        />
      </Card>
    </Link>
  )
}

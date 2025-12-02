import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import { User, ShieldCheck, Activity } from 'lucide-react'
import type { DisputeMessage } from '@/types/database'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'

interface DisputeTimelineProps {
  messages: DisputeMessage[]
  className?: string
  showInternalNotes?: boolean
}

export function DisputeTimeline({
  messages,
  className,
  showInternalNotes = false,
}: DisputeTimelineProps) {
  // Filter messages based on internal notes visibility
  const visibleMessages = messages.filter(
    (msg) => !msg.is_internal_note || showInternalNotes
  )

  if (visibleMessages.length === 0) {
    return (
      <Card className={cn('p-8 text-center', className)}>
        <p className="text-neutral-500">Nenhuma mensagem ainda</p>
      </Card>
    )
  }

  return (
    <div className={cn('space-y-4', className)}>
      {visibleMessages.map((message, index) => {
        const isLast = index === visibleMessages.length - 1
        const isTenant = message.author_type === 'tenant'
        const isAdmin = message.author_type === 'admin'
        const isSystem = message.author_type === 'system'

        return (
          <div key={message.id} className="relative">
            {/* Timeline line */}
            {!isLast && (
              <div
                className="absolute left-4 top-12 bottom-0 w-0.5 bg-neutral-200"
                aria-hidden="true"
              />
            )}

            <Card
              className={cn(
                'relative p-4 transition-colors',
                isSystem && 'bg-neutral-50 border-neutral-200',
                message.is_internal_note && 'bg-amber-50 border-amber-200'
              )}
            >
              <div className="flex gap-3">
                {/* Avatar */}
                <div
                  className={cn(
                    'flex h-8 w-8 shrink-0 items-center justify-center rounded-full',
                    isTenant && 'bg-blue-100 text-blue-600',
                    isAdmin && 'bg-purple-100 text-purple-600',
                    isSystem && 'bg-neutral-100 text-neutral-600'
                  )}
                  aria-hidden="true"
                >
                  {isTenant && <User className="h-4 w-4" />}
                  {isAdmin && <ShieldCheck className="h-4 w-4" />}
                  {isSystem && <Activity className="h-4 w-4" />}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  {/* Header */}
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <span className="text-sm font-medium text-neutral-900">
                      {message.author_name || 'Sistema'}
                    </span>

                    <Badge
                      variant={
                        isTenant
                          ? 'default'
                          : isAdmin
                          ? 'primary'
                          : 'default'
                      }
                      className="text-xs"
                    >
                      {isTenant && 'Inquilino'}
                      {isAdmin && 'Administrador'}
                      {isSystem && 'Sistema'}
                    </Badge>

                    {message.is_internal_note && (
                      <Badge variant="default" className="text-xs bg-amber-100 text-amber-700">
                        Nota Interna
                      </Badge>
                    )}

                    <span className="text-xs text-neutral-500">
                      {format(new Date(message.created_at), "dd/MM/yyyy 'às' HH:mm", {
                        locale: ptBR,
                      })}
                    </span>
                  </div>

                  {/* Message */}
                  <p
                    className={cn(
                      'text-sm text-neutral-700 whitespace-pre-wrap break-words',
                      isSystem && 'italic'
                    )}
                  >
                    {message.message}
                  </p>
                </div>
              </div>
            </Card>
          </div>
        )
      })}
    </div>
  )
}

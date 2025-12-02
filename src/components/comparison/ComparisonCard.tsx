/**
 * ComparisonCard Component - VistorIA Pro
 * Exibe um card resumido de comparação na lista
 */

import Link from 'next/link'
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Eye, Trash2, Clock, CheckCircle2, AlertCircle, XCircle } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import type { Comparison } from '@/types/database'

interface ComparisonCardProps {
  comparison: Comparison & {
    property: {
      name: string
      address: string
    }
  }
  onDelete?: (id: string) => void
}

export function ComparisonCard({ comparison, onDelete }: ComparisonCardProps) {
  const statusConfig = {
    pending: {
      label: 'Pendente',
      icon: Clock,
      color: 'bg-gray-100 text-gray-700',
    },
    processing: {
      label: 'Processando',
      icon: Clock,
      color: 'bg-blue-100 text-blue-700',
    },
    completed: {
      label: 'Concluída',
      icon: CheckCircle2,
      color: 'bg-green-100 text-green-700',
    },
    failed: {
      label: 'Falhou',
      icon: XCircle,
      color: 'bg-red-100 text-red-700',
    },
  }

  const status = statusConfig[comparison.status]
  const StatusIcon = status.icon

  const formattedDate = formatDistanceToNow(new Date(comparison.created_at), {
    addSuffix: true,
    locale: ptBR,
  })

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <h3 className="font-semibold text-lg truncate">
              {comparison.property.name}
            </h3>
            <p className="text-sm text-muted-foreground truncate">
              {comparison.property.address}
            </p>
          </div>
          <Badge className={status.color} variant="outline">
            <StatusIcon className="w-3 h-3 mr-1" />
            {status.label}
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="pb-3">
        {comparison.status === 'completed' ? (
          <div className="grid grid-cols-3 gap-3 text-center">
            <div>
              <div className="text-2xl font-bold text-foreground">
                {comparison.differences_detected}
              </div>
              <div className="text-xs text-muted-foreground">Diferenças</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-red-600">
                {comparison.new_damages}
              </div>
              <div className="text-xs text-muted-foreground">Danos Novos</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-orange-600">
                R$ {(comparison.estimated_repair_cost || 0).toFixed(2)}
              </div>
              <div className="text-xs text-muted-foreground">Custo Est.</div>
            </div>
          </div>
        ) : comparison.status === 'processing' ? (
          <div className="text-center py-4">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-2"></div>
            <p className="text-sm text-muted-foreground">Analisando fotos com IA...</p>
          </div>
        ) : comparison.status === 'failed' ? (
          <div className="text-center py-4">
            <AlertCircle className="w-8 h-8 text-red-500 mx-auto mb-2" />
            <p className="text-sm text-red-600">Erro ao processar comparação</p>
          </div>
        ) : null}

        <p className="text-xs text-muted-foreground mt-3">
          Criada {formattedDate}
        </p>
      </CardContent>

      <CardFooter className="pt-0 flex gap-2">
        <Button
          asChild
          variant="default"
          size="sm"
          className="flex-1"
          disabled={comparison.status !== 'completed'}
        >
          <Link href={`/dashboard/comparisons/${comparison.id}`}>
            <Eye className="w-4 h-4 mr-1" />
            Visualizar
          </Link>
        </Button>
        {onDelete && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => onDelete(comparison.id)}
          >
            <Trash2 className="w-4 h-4" />
          </Button>
        )}
      </CardFooter>
    </Card>
  )
}

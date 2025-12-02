/**
 * DifferenceCard Component - VistorIA Pro
 * Exibe uma diferença detectada entre fotos de entrada/saída
 */

import Image from 'next/image'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { PROBLEM_SEVERITY } from '@/lib/constants'
import type { ComparisonDifference } from '@/types/database'

interface DifferenceCardProps {
  difference: ComparisonDifference & {
    before_photo_url?: string | null
    after_photo_url?: string | null
  }
}

export function DifferenceCard({ difference }: DifferenceCardProps) {
  const severityConfig = difference.severity
    ? PROBLEM_SEVERITY[difference.severity]
    : null

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <h4 className="font-medium text-base">{difference.room_name}</h4>
          </div>
          <div className="flex gap-2">
            {difference.is_new_damage && (
              <Badge variant="destructive" className="text-xs">
                Dano Novo
              </Badge>
            )}
            {difference.is_natural_wear && (
              <Badge variant="secondary" className="bg-yellow-100 text-yellow-700 text-xs">
                Desgaste Natural
              </Badge>
            )}
            {severityConfig && (
              <Badge className={`${severityConfig.bgColor} ${severityConfig.color} text-xs`}>
                {severityConfig.label}
              </Badge>
            )}
          </div>
        </div>
      </CardHeader>

      <CardContent>
        {/* Fotos lado a lado */}
        <div className="grid grid-cols-2 gap-3 mb-4">
          <div>
            <p className="text-xs font-medium text-muted-foreground mb-2">ANTES (Entrada)</p>
            {difference.before_photo_url ? (
              <div className="relative aspect-video w-full rounded-md overflow-hidden bg-neutral-100">
                <Image
                  src={difference.before_photo_url}
                  alt="Foto antes"
                  fill
                  className="object-cover"
                  sizes="(max-width: 768px) 100vw, 50vw"
                />
              </div>
            ) : (
              <div className="aspect-video w-full rounded-md bg-neutral-100 flex items-center justify-center">
                <p className="text-xs text-muted-foreground">Sem foto</p>
              </div>
            )}
          </div>

          <div>
            <p className="text-xs font-medium text-muted-foreground mb-2">DEPOIS (Saída)</p>
            {difference.after_photo_url ? (
              <div className="relative aspect-video w-full rounded-md overflow-hidden bg-neutral-100">
                <Image
                  src={difference.after_photo_url}
                  alt="Foto depois"
                  fill
                  className="object-cover"
                  sizes="(max-width: 768px) 100vw, 50vw"
                />
              </div>
            ) : (
              <div className="aspect-video w-full rounded-md bg-neutral-100 flex items-center justify-center">
                <p className="text-xs text-muted-foreground">Sem foto</p>
              </div>
            )}
          </div>
        </div>

        {/* Descrição */}
        <div className="space-y-2">
          <div>
            <p className="text-sm font-medium text-foreground">Descrição</p>
            <p className="text-sm text-muted-foreground">{difference.description}</p>
          </div>

          {/* Localização */}
          {difference.markers && typeof difference.markers === 'object' && 'location' in difference.markers && (
            <div>
              <p className="text-xs font-medium text-muted-foreground">Localização</p>
              <p className="text-sm">{String(difference.markers.location)}</p>
            </div>
          )}

          {/* Custo estimado */}
          {difference.estimated_repair_cost !== null && difference.estimated_repair_cost > 0 && (
            <div className="flex items-center justify-between pt-2 border-t">
              <p className="text-sm font-medium">Custo estimado de reparo</p>
              <p className="text-lg font-bold text-orange-600">
                R$ {difference.estimated_repair_cost.toFixed(2)}
              </p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

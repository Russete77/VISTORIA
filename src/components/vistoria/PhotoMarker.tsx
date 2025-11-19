'use client'

import { useState } from 'react'
import { IssueSeverity } from './IssueSeverity'
import { cn } from '@/lib/utils'

type SeverityLevel = 'low' | 'medium' | 'high' | 'urgent'

interface PhotoMarkerProps {
  /**
   * Coordenadas normalizadas (0-1) da bounding box
   */
  x: number
  y: number
  width: number
  height: number

  /**
   * Tipo do problema detectado
   */
  issueType: string

  /**
   * Descrição gerada pela IA
   */
  description: string

  /**
   * Nível de severidade
   */
  severity: SeverityLevel

  /**
   * Callback quando o marker é clicado
   */
  onClick?: () => void

  className?: string
}

export function PhotoMarker({
  x,
  y,
  width,
  height,
  issueType,
  description,
  severity,
  onClick,
  className,
}: PhotoMarkerProps) {
  const [isHovered, setIsHovered] = useState(false)

  // Convert normalized coordinates to percentages
  const style = {
    left: `${x * 100}%`,
    top: `${y * 100}%`,
    width: `${width * 100}%`,
    height: `${height * 100}%`,
  }

  const severityColors: Record<SeverityLevel, string> = {
    low: 'border-neutral-500 bg-neutral-500/10',
    medium: 'border-warning-500 bg-warning-500/10',
    high: 'border-danger-500 bg-danger-500/10',
    urgent: 'border-danger-700 bg-danger-700/20',
  }

  return (
    <div
      className={cn('absolute cursor-pointer transition-all duration-200', className)}
      style={style}
      onClick={onClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      role="button"
      tabIndex={0}
      aria-label={`Problema detectado: ${issueType}`}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault()
          onClick?.()
        }
      }}
    >
      {/* Bounding box */}
      <div
        className={cn(
          'h-full w-full rounded-md border-2 transition-all duration-200',
          severityColors[severity],
          isHovered && 'border-4 shadow-lg'
        )}
      />

      {/* Tooltip on hover */}
      {isHovered && (
        <div className="absolute left-0 top-full z-10 mt-2 min-w-64 max-w-xs animate-fade-in rounded-lg border border-neutral-200 bg-white p-3 shadow-lg">
          <div className="mb-2 flex items-center justify-between gap-2">
            <h4 className="text-sm font-semibold text-neutral-900">
              {issueType}
            </h4>
            <IssueSeverity severity={severity} showLabel={false} />
          </div>
          <p className="text-xs text-neutral-600">{description}</p>
          <div className="mt-2 text-xs text-neutral-500">
            Clique para ver detalhes
          </div>
        </div>
      )}
    </div>
  )
}

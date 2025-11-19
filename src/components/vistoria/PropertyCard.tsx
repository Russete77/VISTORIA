import Image from 'next/image'
import Link from 'next/link'
import { Building2, Bed, Bath, Ruler, Calendar, ArrowRight } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import { highlightText } from '@/lib/highlight'

interface PropertyCardProps {
  id: string
  name: string
  address: string
  thumbnail?: string
  bedrooms?: number
  bathrooms?: number
  area?: number
  lastInspection?: Date
  status?: 'active' | 'inactive' | 'pending'
  className?: string
  searchQuery?: string
  moveInCount?: number
  moveOutCount?: number
  totalInspections?: number
}

const statusConfig = {
  active: {
    label: 'Ativo',
    className: 'bg-success-100 text-success-700',
  },
  inactive: {
    label: 'Inativo',
    className: 'bg-neutral-100 text-neutral-700',
  },
  pending: {
    label: 'Pendente',
    className: 'bg-warning-100 text-warning-700',
  },
}

export function PropertyCard({
  id,
  name,
  address,
  thumbnail,
  bedrooms,
  bathrooms,
  area,
  lastInspection,
  status = 'active',
  className,
  searchQuery = '',
  moveInCount = 0,
  moveOutCount = 0,
  totalInspections = 0,
}: PropertyCardProps) {
  const statusInfo = statusConfig[status]

  return (
    <Link href={`/dashboard/properties/${id}`}>
      <Card
        className={cn(
          'group relative overflow-hidden border-neutral-200 bg-white transition-all duration-200',
          'hover:shadow-lg hover:-translate-y-1 cursor-pointer',
          className
        )}
      >
        {/* Thumbnail */}
        <div className="relative h-48 w-full overflow-hidden bg-neutral-100">
          {thumbnail ? (
            <Image
              src={thumbnail}
              alt={name}
              fill
              className="object-cover transition-transform duration-300 group-hover:scale-105"
            />
          ) : (
            <div className="flex h-full items-center justify-center">
              <Building2 className="h-16 w-16 text-neutral-400" />
            </div>
          )}

          {/* Status Badge - Overlay */}
          <div className="absolute right-3 top-3">
            <Badge className={statusInfo.className}>
              {statusInfo.label}
            </Badge>
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          {/* Title */}
          <h3 className="text-lg font-semibold text-neutral-900 line-clamp-1 mb-1">
            {searchQuery ? highlightText(name, searchQuery) : name}
          </h3>

          {/* Address */}
          <p className="text-sm text-neutral-600 line-clamp-1 mb-4">
            {searchQuery ? highlightText(address, searchQuery) : address}
          </p>

          {/* Metadata */}
          <div className="flex flex-wrap gap-4 mb-4">
            {bedrooms !== undefined && (
              <div className="flex items-center gap-1.5 text-sm text-neutral-700">
                <Bed className="h-4 w-4 text-neutral-500" />
                <span>{bedrooms} {bedrooms === 1 ? 'quarto' : 'quartos'}</span>
              </div>
            )}

            {bathrooms !== undefined && (
              <div className="flex items-center gap-1.5 text-sm text-neutral-700">
                <Bath className="h-4 w-4 text-neutral-500" />
                <span>{bathrooms} {bathrooms === 1 ? 'banheiro' : 'banheiros'}</span>
              </div>
            )}

            {area !== undefined && (
              <div className="flex items-center gap-1.5 text-sm text-neutral-700">
                <Ruler className="h-4 w-4 text-neutral-500" />
                <span>{area}m²</span>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="pt-4 border-t border-neutral-200 space-y-2">
            {totalInspections > 0 ? (
              <>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-neutral-600 font-medium">Vistorias realizadas:</span>
                  <span className="text-neutral-900 font-semibold">{totalInspections}</span>
                </div>
                <div className="flex items-center gap-3 text-xs text-neutral-600">
                  <div className="flex items-center gap-1">
                    <div className="w-2 h-2 rounded-full bg-success-500"></div>
                    <span>Entrada: {moveInCount}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <div className="w-2 h-2 rounded-full bg-danger-500"></div>
                    <span>Saída: {moveOutCount}</span>
                  </div>
                </div>
              </>
            ) : (
              <span className="text-xs text-neutral-500">Sem vistorias</span>
            )}
          </div>
        </div>
      </Card>
    </Link>
  )
}

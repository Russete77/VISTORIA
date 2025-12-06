'use client'

import { use, useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  ArrowLeft,
  Building2,
  Calendar,
  TrendingUp,
  TrendingDown,
  Minus,
  AlertTriangle,
  CheckCircle2,
  FileText,
  Download,
  ChevronDown,
  ChevronUp,
  ArrowRightLeft,
  Loader2,
  ClipboardCheck,
  History,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Breadcrumbs } from '@/components/ui/breadcrumbs'
import { toast } from 'sonner'

/**
 * Property History Page (Prontuário) - VistorIA Pro
 * Timeline view of all inspections with room-by-room trends
 */

interface PropertyHistoryPageProps {
  params: Promise<{ id: string }>
}

interface TimelineItem {
  id: string
  type: string
  status: string
  tenant_name: string | null
  inspector_name: string | null
  date: string
  report_url: string | null
  rooms_count: number
  photos_count: number
  problems: {
    total: number
    urgent: number
    high: number
    medium: number
    low: number
  }
}

interface RoomInspection {
  inspection_id: string
  date: string
  type: string
  problems_count: number
  problems: Array<{
    description: string
    severity: string
  }>
  summary?: string
}

interface RoomTrend {
  room_name: string
  inspections: RoomInspection[]
  trend: 'improving' | 'stable' | 'deteriorating' | 'new'
}

interface Stats {
  total_inspections: number
  total_problems: number
  avg_problems_per_inspection: number
  unique_rooms: number
  overall_trend: 'improving' | 'stable' | 'deteriorating' | 'unknown'
  first_inspection: string | null
  last_inspection: string | null
}

interface Property {
  id: string
  name: string
  address: string
  city: string
  state: string
}

const typeLabels: Record<string, string> = {
  move_in: 'Entrada',
  move_out: 'Saída',
  periodic: 'Periódica',
}

const typeColors: Record<string, string> = {
  move_in: 'bg-success-100 text-success-700',
  move_out: 'bg-danger-100 text-danger-700',
  periodic: 'bg-primary-100 text-primary-700',
}

const statusLabels: Record<string, string> = {
  draft: 'Rascunho',
  in_progress: 'Em Andamento',
  completed: 'Concluída',
  signed: 'Assinada',
}

const trendIcons: Record<string, React.ReactNode> = {
  improving: <TrendingDown className="h-4 w-4 text-success-600" />,
  stable: <Minus className="h-4 w-4 text-neutral-500" />,
  deteriorating: <TrendingUp className="h-4 w-4 text-danger-600" />,
  new: <CheckCircle2 className="h-4 w-4 text-primary-600" />,
  unknown: <Minus className="h-4 w-4 text-neutral-400" />,
}

const trendLabels: Record<string, string> = {
  improving: 'Melhorando',
  stable: 'Estável',
  deteriorating: 'Piorando',
  new: 'Novo',
  unknown: 'Sem dados',
}

const trendColors: Record<string, string> = {
  improving: 'text-success-600',
  stable: 'text-neutral-600',
  deteriorating: 'text-danger-600',
  new: 'text-primary-600',
  unknown: 'text-neutral-400',
}

export default function PropertyHistoryPage({ params }: PropertyHistoryPageProps) {
  const { id } = use(params)
  const router = useRouter()

  const [isLoading, setIsLoading] = useState(true)
  const [property, setProperty] = useState<Property | null>(null)
  const [stats, setStats] = useState<Stats | null>(null)
  const [timeline, setTimeline] = useState<TimelineItem[]>([])
  const [rooms, setRooms] = useState<RoomTrend[]>([])
  const [expandedRooms, setExpandedRooms] = useState<Set<string>>(new Set())
  const [selectedInspections, setSelectedInspections] = useState<string[]>([])

  useEffect(() => {
    fetchHistory()
  }, [id])

  const fetchHistory = async () => {
    try {
      const response = await fetch(`/api/properties/${id}/history`, {
        credentials: 'include',
      })

      if (!response.ok) {
        throw new Error('Failed to fetch history')
      }

      const data = await response.json()
      setProperty(data.property)
      setStats(data.stats)
      setTimeline(data.timeline)
      setRooms(data.rooms)
    } catch (error) {
      console.error('Error fetching history:', error)
      toast.error('Erro ao carregar prontuário')
    } finally {
      setIsLoading(false)
    }
  }

  const toggleRoom = (roomName: string) => {
    const newExpanded = new Set(expandedRooms)
    if (newExpanded.has(roomName)) {
      newExpanded.delete(roomName)
    } else {
      newExpanded.add(roomName)
    }
    setExpandedRooms(newExpanded)
  }

  const toggleInspectionSelection = (inspectionId: string) => {
    setSelectedInspections(prev => {
      if (prev.includes(inspectionId)) {
        return prev.filter(id => id !== inspectionId)
      }
      if (prev.length >= 2) {
        return [prev[1], inspectionId]
      }
      return [...prev, inspectionId]
    })
  }

  const handleCompare = () => {
    if (selectedInspections.length === 2) {
      router.push(`/dashboard/comparisons/new?inspection1=${selectedInspections[0]}&inspection2=${selectedInspections[1]}`)
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary-600" />
      </div>
    )
  }

  if (!property) {
    return (
      <div className="text-center py-12">
        <p className="text-neutral-600">Imóvel não encontrado</p>
        <Button className="mt-4" onClick={() => router.push('/dashboard/properties')}>
          Voltar para Imóveis
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-6 px-4 sm:px-0">
      {/* Breadcrumbs */}
      <Breadcrumbs
        items={[
          { label: 'Imóveis', href: '/dashboard/properties', icon: <Building2 className="h-3.5 w-3.5" /> },
          { label: property.name, href: `/dashboard/properties/${id}` },
          { label: 'Prontuário', icon: <History className="h-3.5 w-3.5" /> },
        ]}
      />

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-neutral-900 flex items-center gap-3">
            <History className="h-8 w-8 text-primary-600" />
            Prontuário do Imóvel
          </h1>
          <p className="text-neutral-600 mt-1">{property.name} - {property.address}</p>
        </div>
        <div className="flex gap-2">
          {selectedInspections.length === 2 && (
            <Button onClick={handleCompare}>
              <ArrowRightLeft className="mr-2 h-4 w-4" />
              Comparar Selecionadas
            </Button>
          )}
          <Button variant="outline" asChild>
            <Link href={`/dashboard/inspections/new?property=${id}`}>
              <ClipboardCheck className="mr-2 h-4 w-4" />
              Nova Vistoria
            </Link>
          </Button>
        </div>
      </div>

      {/* Stats Overview */}
      {stats && (
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-4">
          <Card className="p-4">
            <p className="text-xs font-medium text-neutral-500 uppercase">Vistorias</p>
            <p className="text-2xl font-bold text-neutral-900 mt-1">{stats.total_inspections}</p>
          </Card>
          <Card className="p-4">
            <p className="text-xs font-medium text-neutral-500 uppercase">Total Problemas</p>
            <p className="text-2xl font-bold text-neutral-900 mt-1">{stats.total_problems}</p>
          </Card>
          <Card className="p-4">
            <p className="text-xs font-medium text-neutral-500 uppercase">Média/Vistoria</p>
            <p className="text-2xl font-bold text-neutral-900 mt-1">{stats.avg_problems_per_inspection}</p>
          </Card>
          <Card className="p-4">
            <p className="text-xs font-medium text-neutral-500 uppercase">Cômodos</p>
            <p className="text-2xl font-bold text-neutral-900 mt-1">{stats.unique_rooms}</p>
          </Card>
          <Card className="p-4 col-span-2">
            <p className="text-xs font-medium text-neutral-500 uppercase">Tendência Geral</p>
            <div className="flex items-center gap-2 mt-1">
              {trendIcons[stats.overall_trend]}
              <span className={`text-lg font-semibold ${trendColors[stats.overall_trend]}`}>
                {trendLabels[stats.overall_trend]}
              </span>
            </div>
          </Card>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Timeline */}
        <div className="lg:col-span-2 space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Histórico de Vistorias
              </CardTitle>
              <CardDescription>
                Selecione 2 vistorias para comparar
              </CardDescription>
            </CardHeader>
            <CardContent>
              {timeline.length === 0 ? (
                <div className="text-center py-8 text-neutral-500">
                  <FileText className="h-12 w-12 mx-auto mb-2 opacity-50" />
                  <p>Nenhuma vistoria registrada</p>
                </div>
              ) : (
                <div className="relative">
                  {/* Timeline line */}
                  <div className="absolute left-6 top-0 bottom-0 w-0.5 bg-neutral-200" />

                  <div className="space-y-4">
                    {timeline.map((item, index) => {
                      const isSelected = selectedInspections.includes(item.id)
                      const hasProblems = item.problems.total > 0

                      return (
                        <div
                          key={item.id}
                          className={`relative pl-14 pr-4 py-4 rounded-lg border-2 transition-all cursor-pointer ${
                            isSelected
                              ? 'border-primary-500 bg-primary-50'
                              : 'border-transparent hover:border-neutral-200 hover:bg-neutral-50'
                          }`}
                          onClick={() => toggleInspectionSelection(item.id)}
                        >
                          {/* Timeline dot */}
                          <div
                            className={`absolute left-4 w-5 h-5 rounded-full border-2 border-white shadow ${
                              hasProblems ? 'bg-danger-500' : 'bg-success-500'
                            }`}
                          />

                          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 flex-wrap">
                                <Badge className={typeColors[item.type]}>
                                  {typeLabels[item.type]}
                                </Badge>
                                <Badge variant="outline">
                                  {statusLabels[item.status]}
                                </Badge>
                                {isSelected && (
                                  <Badge className="bg-primary-600">
                                    Selecionada
                                  </Badge>
                                )}
                              </div>

                              <p className="text-sm text-neutral-600 mt-2">
                                <span className="font-medium">Data:</span>{' '}
                                {new Date(item.date).toLocaleDateString('pt-BR', {
                                  day: '2-digit',
                                  month: 'long',
                                  year: 'numeric',
                                })}
                              </p>

                              {item.tenant_name && (
                                <p className="text-sm text-neutral-600">
                                  <span className="font-medium">Inquilino:</span> {item.tenant_name}
                                </p>
                              )}

                              <div className="flex items-center gap-4 mt-2 text-sm text-neutral-500">
                                <span>{item.rooms_count} cômodos</span>
                                <span>{item.photos_count} fotos</span>
                              </div>
                            </div>

                            <div className="flex flex-col items-end gap-2">
                              {/* Problems summary */}
                              <div className="flex items-center gap-2">
                                {item.problems.urgent > 0 && (
                                  <Badge variant="danger" className="text-xs">
                                    {item.problems.urgent} urgente{item.problems.urgent > 1 ? 's' : ''}
                                  </Badge>
                                )}
                                {item.problems.high > 0 && (
                                  <Badge variant="warning" className="text-xs">
                                    {item.problems.high} alto{item.problems.high > 1 ? 's' : ''}
                                  </Badge>
                                )}
                                {item.problems.total === 0 && (
                                  <span className="text-xs text-success-600 flex items-center gap-1">
                                    <CheckCircle2 className="h-3 w-3" />
                                    Sem problemas
                                  </span>
                                )}
                              </div>

                              {/* Actions */}
                              <div className="flex gap-2">
                                {item.report_url && (
                                  <Button variant="ghost" size="sm" asChild>
                                    <a href={item.report_url} target="_blank" rel="noopener noreferrer">
                                      <Download className="h-4 w-4" />
                                    </a>
                                  </Button>
                                )}
                                <Button variant="ghost" size="sm" asChild>
                                  <Link href={`/dashboard/inspections/${item.id}`}>
                                    Ver
                                  </Link>
                                </Button>
                              </div>
                            </div>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Room Trends */}
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                Tendências por Cômodo
              </CardTitle>
              <CardDescription>
                Evolução dos problemas em cada ambiente
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {rooms.length === 0 ? (
                <p className="text-sm text-neutral-500 text-center py-4">
                  Nenhum cômodo registrado
                </p>
              ) : (
                rooms.map((room) => {
                  const isExpanded = expandedRooms.has(room.room_name)
                  const latestProblems = room.inspections[room.inspections.length - 1]?.problems_count || 0

                  return (
                    <div
                      key={room.room_name}
                      className="border border-neutral-200 rounded-lg overflow-hidden"
                    >
                      <button
                        onClick={() => toggleRoom(room.room_name)}
                        className="w-full p-3 flex items-center justify-between hover:bg-neutral-50 transition-colors"
                      >
                        <div className="flex items-center gap-3">
                          <div className="flex items-center gap-1">
                            {trendIcons[room.trend]}
                          </div>
                          <div className="text-left">
                            <p className="font-medium text-neutral-900">{room.room_name}</p>
                            <p className="text-xs text-neutral-500">
                              {room.inspections.length} vistoria{room.inspections.length > 1 ? 's' : ''}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          {latestProblems > 0 ? (
                            <Badge variant="danger" className="text-xs">
                              {latestProblems}
                            </Badge>
                          ) : (
                            <CheckCircle2 className="h-4 w-4 text-success-500" />
                          )}
                          {isExpanded ? (
                            <ChevronUp className="h-4 w-4 text-neutral-400" />
                          ) : (
                            <ChevronDown className="h-4 w-4 text-neutral-400" />
                          )}
                        </div>
                      </button>

                      {isExpanded && (
                        <div className="border-t border-neutral-200 bg-neutral-50 p-3 space-y-2">
                          {room.inspections.map((insp, idx) => (
                            <div
                              key={insp.inspection_id}
                              className="flex items-center justify-between text-sm"
                            >
                              <div className="flex items-center gap-2">
                                <Badge variant="outline" className="text-xs">
                                  {typeLabels[insp.type]}
                                </Badge>
                                <span className="text-neutral-600">
                                  {new Date(insp.date).toLocaleDateString('pt-BR')}
                                </span>
                              </div>
                              <div className="flex items-center gap-2">
                                {insp.problems_count > 0 ? (
                                  <span className="text-danger-600 font-medium">
                                    {insp.problems_count} problema{insp.problems_count > 1 ? 's' : ''}
                                  </span>
                                ) : (
                                  <span className="text-success-600">OK</span>
                                )}
                                {idx > 0 && (
                                  <span className="text-xs">
                                    {insp.problems_count < room.inspections[idx - 1].problems_count && (
                                      <TrendingDown className="h-3 w-3 text-success-500 inline" />
                                    )}
                                    {insp.problems_count > room.inspections[idx - 1].problems_count && (
                                      <TrendingUp className="h-3 w-3 text-danger-500 inline" />
                                    )}
                                  </span>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )
                })
              )}
            </CardContent>
          </Card>

          {/* Quick comparison suggestion */}
          {timeline.length >= 2 && (
            <Card className="bg-primary-50 border-primary-200">
              <CardContent className="pt-4">
                <div className="flex items-start gap-3">
                  <ArrowRightLeft className="h-5 w-5 text-primary-600 mt-0.5" />
                  <div>
                    <p className="font-medium text-primary-900">Comparar Vistorias</p>
                    <p className="text-sm text-primary-700 mt-1">
                      Selecione 2 vistorias na timeline para ver as diferenças detalhadas entre elas.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}

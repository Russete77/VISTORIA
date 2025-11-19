'use client'

import { use, useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, FileText, Download, Loader2, Sparkles, CheckCircle2, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { IssueSeverity } from '@/components/vistoria/IssueSeverity'
import { PhotoLightbox } from '@/components/ui/PhotoLightbox'
import { toast } from 'sonner'

/**
 * Inspection Review Page - VistorIA Pro
 * Review all photos and AI analysis before generating PDF
 */

interface Room {
  id: string
  name: string
  type: string
  order_index: number
}

interface PhotoAnalysis {
  hasProblems: boolean
  summary: string
  confidence: number
  detailedAnalysis: {
    piso?: string
    rodape?: string
    parede?: string
    forro?: string
    porta?: string
    janela?: string
    soleira?: string
    protecao?: string
    acabamento_eletrico?: string
    hidraulica?: string
    louca?: string
    metais?: string
    banca?: string
    box?: string
    local_do_ar?: string
    adicionais?: string
  }
  problems: Array<{
    description: string
    severity: string
    location: string
    suggestedAction: string
  }>
}

interface Problem {
  id: string
  description: string
  severity: string
  location: string | null
  suggested_action: string | null
  ai_confidence: number
}

interface Photo {
  id: string
  room_name: string
  room_category: string
  photo_url: string
  storage_path: string
  ai_summary: string | null
  ai_has_problems: boolean
  problems: Problem[]
  created_at: string
}

interface Inspection {
  id: string
  type: string
  status: string
  created_at: string
  property: {
    name: string
    address: string
    city: string
    state: string
  }
}

interface InspectionReviewPageProps {
  params: Promise<{ id: string }>
}

export default function InspectionReviewPage({ params }: InspectionReviewPageProps) {
  const { id } = use(params)
  const router = useRouter()

  const [isLoading, setIsLoading] = useState(true)
  const [isGenerating, setIsGenerating] = useState(false)
  const [inspection, setInspection] = useState<Inspection | null>(null)
  const [rooms, setRooms] = useState<Room[]>([])
  const [photos, setPhotos] = useState<Photo[]>([])
  const [deletingPhotoId, setDeletingPhotoId] = useState<string | null>(null)
  const [lightboxPhoto, setLightboxPhoto] = useState<{ url: string; alt: string } | null>(null)

  useEffect(() => {
    fetchData()
  }, [id])

  const fetchData = async () => {
    try {
      const [inspectionRes, roomsRes, photosRes] = await Promise.all([
        fetch(`/api/inspections/${id}`, { credentials: 'include' }),
        fetch(`/api/inspections/${id}/rooms`, { credentials: 'include' }),
        fetch(`/api/inspections/${id}/photos`, { credentials: 'include' }),
      ])

      if (!inspectionRes.ok || !roomsRes.ok || !photosRes.ok) {
        throw new Error('Failed to fetch data')
      }

      const [inspectionData, roomsData, photosData] = await Promise.all([
        inspectionRes.json(),
        roomsRes.json(),
        photosRes.json(),
      ])

      setInspection(inspectionData.inspection)
      setRooms(roomsData.rooms)
      setPhotos(photosData.photos)
    } catch (error) {
      console.error('Error fetching data:', error)
      toast.error('Erro ao carregar dados da vistoria')
    } finally {
      setIsLoading(false)
    }
  }

  const handleDeletePhoto = async (photoId: string) => {
    if (!confirm('Tem certeza que deseja excluir esta foto?')) return

    setDeletingPhotoId(photoId)
    try {
      const response = await fetch(`/api/inspections/${id}/photos?photoId=${photoId}`, {
        method: 'DELETE',
        credentials: 'include',
      })

      if (!response.ok) throw new Error('Failed to delete photo')

      setPhotos(photos.filter((p: any) => p.id !== photoId))
      toast.success('Foto excluída com sucesso!')
      await fetchData() // Reload data
    } catch (error) {
      console.error('Error deleting photo:', error)
      toast.error('Erro ao excluir foto')
    } finally {
      setDeletingPhotoId(null)
    }
  }

  const handleGeneratePDF = async () => {
    setIsGenerating(true)
    try {
      const response = await fetch(`/api/inspections/${id}/generate-report`, {
        method: 'POST',
        credentials: 'include',
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Falha ao gerar PDF')
      }

      const data = await response.json()

      // Download the PDF from the URL
      if (data.report_url) {
        window.open(data.report_url, '_blank')
        toast.success(`Laudo PDF gerado com sucesso! Créditos restantes: ${data.credits_remaining}`)
        router.push(`/dashboard/inspections/${id}`)
      } else {
        throw new Error('Report URL not received')
      }
    } catch (error) {
      console.error('Error generating PDF:', error)
      toast.error(error instanceof Error ? error.message : 'Erro ao gerar PDF')
    } finally {
      setIsGenerating(false)
    }
  }

  const getDetailedAnalysisFields = (): Array<{ key: keyof PhotoAnalysis['detailedAnalysis']; label: string }> => {
    return [
      { key: 'piso', label: 'PISO' },
      { key: 'rodape', label: 'RODAPÉ' },
      { key: 'parede', label: 'PAREDE' },
      { key: 'forro', label: 'FORRO' },
      { key: 'porta', label: 'PORTA' },
      { key: 'janela', label: 'JANELA' },
      { key: 'soleira', label: 'SOLEIRA' },
      { key: 'protecao', label: 'PROTEÇÃO' },
      { key: 'acabamento_eletrico', label: 'ACAB. ELÉTRICO' },
      { key: 'hidraulica', label: 'HIDRÁULICA' },
      { key: 'louca', label: 'LOUÇA' },
      { key: 'metais', label: 'METAIS' },
      { key: 'banca', label: 'BANCA' },
      { key: 'box', label: 'BOX' },
      { key: 'local_do_ar', label: 'LOCAL DO AR' },
      { key: 'adicionais', label: 'ADICIONAIS' },
    ]
  }

  const typeLabels: Record<string, string> = {
    move_in: 'Entrada',
    move_out: 'Saída',
    periodic: 'Periódica',
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary-600" />
      </div>
    )
  }

  if (!inspection) {
    return (
      <div className="text-center py-12">
        <p className="text-neutral-600">Vistoria não encontrada</p>
      </div>
    )
  }

  const roomsWithPhotos = rooms
    .map((room) => ({
      ...room,
      photos: photos.filter((photo: any) => photo.room_name === room.name),
    }))
    .filter((room) => room.photos.length > 0)
    .sort((a, b) => a.order_index - b.order_index)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link href={`/dashboard/inspections/${id}`}>
              <ArrowLeft className="h-5 w-5" />
            </Link>
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-neutral-900">Revisão do Laudo</h1>
            <p className="text-sm text-neutral-600 mt-1">
              Revise a análise antes de gerar o PDF
            </p>
          </div>
        </div>
        <Button onClick={handleGeneratePDF} disabled={isGenerating} size="lg">
          {isGenerating ? (
            <>
              <Loader2 className="mr-2 h-5 w-5 animate-spin" />
              Gerando PDF...
            </>
          ) : (
            <>
              <FileText className="mr-2 h-5 w-5" />
              Gerar Laudo PDF
            </>
          )}
        </Button>
      </div>

      {/* Inspection Info */}
      <Card>
        <CardHeader>
          <CardTitle>Informações da Vistoria</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <p className="text-sm font-medium text-neutral-600">Imóvel</p>
              <p className="text-base text-neutral-900">{inspection.property.name}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-neutral-600">Endereço</p>
              <p className="text-base text-neutral-900">
                {inspection.property.address}, {inspection.property.city} - {inspection.property.state}
              </p>
            </div>
            <div>
              <p className="text-sm font-medium text-neutral-600">Tipo</p>
              <Badge>{typeLabels[inspection.type] || inspection.type}</Badge>
            </div>
            <div>
              <p className="text-sm font-medium text-neutral-600">Data</p>
              <p className="text-base text-neutral-900">
                {new Date(inspection.created_at).toLocaleDateString('pt-BR')}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Rooms Analysis */}
      {roomsWithPhotos.map((room) => (
        <Card key={room.id}>
          <CardHeader>
            <CardTitle className="text-2xl">{room.name.toUpperCase()}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Photos Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {room.photos.map((photo: any) => {
                const isDeleting = deletingPhotoId === photo.id
                return (
                  <div key={photo.id} className="space-y-2">
                    <div className="relative group">
                      {/* Delete Button - Aparece no hover */}
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          handleDeletePhoto(photo.id)
                        }}
                        disabled={isDeleting}
                        className="absolute top-2 right-2 z-20 flex items-center gap-1 px-2 py-1 bg-danger-600/90 backdrop-blur-sm text-white text-xs font-medium rounded-md shadow-md opacity-0 group-hover:opacity-100 hover:bg-danger-700 disabled:opacity-50 transition-all"
                        aria-label="Excluir foto"
                      >
                        {isDeleting ? (
                          <Loader2 className="h-3 w-3 animate-spin" />
                        ) : (
                          <>
                            <Trash2 className="h-3 w-3" />
                            <span className="hidden sm:inline">Excluir</span>
                          </>
                        )}
                      </button>

                      <div
                        className="relative aspect-video rounded-lg overflow-hidden bg-neutral-100 shadow-sm cursor-pointer hover:ring-2 hover:ring-primary-500 transition-all"
                        onClick={() => setLightboxPhoto({ url: photo.photo_url, alt: `${room.name} - Foto ${room.photos.indexOf(photo) + 1}` })}
                      >
                        <img
                          src={photo.photo_url}
                          alt={`Foto ${room.name}`}
                          className="object-cover w-full h-full"
                          loading="lazy"
                        />
                      </div>
                    </div>

                    {/* Badge de problemas - Abaixo da imagem */}
                    {photo.ai_has_problems && (
                      <Badge className="bg-danger-600 text-xs w-fit">
                        <Sparkles className="mr-1 h-3 w-3" />
                        {photo.problems?.length || 0} {(photo.problems?.length || 0) === 1 ? 'problema' : 'problemas'}
                      </Badge>
                    )}
                  </div>
                )
              })}
            </div>

            {/* AI Summary */}
            {room.photos.some((p: any) => p.ai_summary) && (
              <div className="space-y-2 border-t pt-4">
                <h3 className="font-semibold text-lg flex items-center gap-2">
                  <Sparkles className="h-5 w-5 text-primary-600" />
                  Resumo da Análise IA
                </h3>
                {room.photos
                  .filter((p: any) => p.ai_summary)
                  .map((p: any, idx: number) => (
                    <div key={idx} className="p-3 bg-primary-50 border border-primary-200 rounded-lg">
                      <p className="text-sm text-neutral-700">{p.ai_summary}</p>
                    </div>
                  ))}
              </div>
            )}

            {/* Problems List */}
            {room.photos.some((p: any) => p.ai_has_problems) && (
              <div className="space-y-3 border-t pt-4">
                <h3 className="font-semibold text-lg">Problemas Detectados</h3>
                {room.photos
                  .filter((p: any) => p.ai_has_problems && p.problems)
                  .flatMap((p: any) => p.problems || [])
                  .map((problem: any, idx: number) => (
                    <div key={idx} className="flex items-start gap-3 p-3 bg-danger-50 border border-danger-200 rounded-lg">
                      <IssueSeverity severity={problem.severity as any} />
                      <div className="flex-1">
                        <p className="font-medium text-neutral-900">{problem.description}</p>
                        {problem.location && (
                          <p className="text-sm text-neutral-600 mt-1">Local: {problem.location}</p>
                        )}
                        {problem.suggested_action && (
                          <p className="text-sm text-neutral-700 mt-2">
                            <span className="font-medium">Ação sugerida:</span> {problem.suggested_action}
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
              </div>
            )}

            {/* Photo Registration Checkbox */}
            <div className="flex items-center gap-2 text-neutral-600 pt-2">
              <div className="w-4 h-4 border-2 border-neutral-400 rounded" />
              <span className="text-sm font-medium">REGISTRO FOTOGRÁFICO</span>
            </div>
          </CardContent>
        </Card>
      ))}

      {roomsWithPhotos.length === 0 && (
        <Card className="p-12">
          <div className="text-center text-neutral-600">
            <FileText className="h-16 w-16 mx-auto mb-4 text-neutral-400" />
            <p>Nenhuma foto encontrada para revisão</p>
            <Button variant="outline" className="mt-4" asChild>
              <Link href={`/dashboard/inspections/${id}/capture`}>
                Voltar para Captura
              </Link>
            </Button>
          </div>
        </Card>
      )}

      {/* Photo Lightbox */}
      <PhotoLightbox
        isOpen={!!lightboxPhoto}
        photoUrl={lightboxPhoto?.url || ''}
        photoAlt={lightboxPhoto?.alt || 'Foto da vistoria'}
        onClose={() => setLightboxPhoto(null)}
      />
    </div>
  )
}

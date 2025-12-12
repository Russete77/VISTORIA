'use client'

import { use, useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, FileText, Download, Loader2, Sparkles, CheckCircle2, Trash2, Palette, Pencil, X, Save, Plus, DollarSign, Calculator, Settings2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { IssueSeverity } from '@/components/vistoria/IssueSeverity'
import { PhotoLightbox } from '@/components/ui/PhotoLightbox'
import { TemplateSelector } from '@/components/templates'
import { AIFeedbackButton } from '@/components/feedback/AIFeedbackButton'
import { AITrainingBanner } from '@/components/feedback/AITrainingBanner'
import { CostEditorDialog } from '@/components/costs/CostEditorDialog'
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

interface EstimatedCost {
  min: number
  max: number
  avg: number
  service_name: string
  unit: string
  region: string
}

interface Problem {
  id: string
  description: string
  severity: string
  location: string | null
  suggested_action: string | null
  ai_confidence: number
  estimatedCost?: EstimatedCost | null
  // Cost edit fields
  service_id?: string | null
  quantity?: number
  manual_cost?: number | null
  cost_notes?: string | null
  cost_edited_at?: string | null
}

interface RepairService {
  id: string
  code: string
  name: string
  unit_label: string
  base_price_min: number
  base_price_max: number
  category?: {
    name: string
  }
}

interface CostSummary {
  totalMin: number
  totalMax: number
  totalAvg: number
  problemsWithCosts: number
  problemsWithoutCosts: number
  region: string
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
  const [selectedTemplateId, setSelectedTemplateId] = useState<string | null>(null)
  const [costSummary, setCostSummary] = useState<CostSummary | null>(null)

  // Estados para edição de análise IA
  const [editingPhotoId, setEditingPhotoId] = useState<string | null>(null)
  const [editingSummary, setEditingSummary] = useState('')
  const [editingProblems, setEditingProblems] = useState<any[]>([])
  const [isSavingEdit, setIsSavingEdit] = useState(false)

  // Estados para edição de custos (usando novo componente CostEditorDialog)
  const [editingCostProblem, setEditingCostProblem] = useState<Problem | null>(null)

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
      setCostSummary(photosData.costSummary || null)
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

  // Iniciar edição de uma foto
  const handleStartEdit = (photo: Photo) => {
    setEditingPhotoId(photo.id)
    setEditingSummary(photo.ai_summary || '')
    setEditingProblems(photo.problems?.map(p => ({ ...p })) || [])
  }

  // Cancelar edição
  const handleCancelEdit = () => {
    setEditingPhotoId(null)
    setEditingSummary('')
    setEditingProblems([])
  }

  // Salvar edição da análise
  const handleSaveEdit = async (photoId: string) => {
    setIsSavingEdit(true)
    try {
      const response = await fetch(`/api/inspections/${id}/photos`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          photoId,
          ai_summary: editingSummary,
          problems: editingProblems,
        }),
        credentials: 'include',
      })

      if (!response.ok) throw new Error('Falha ao salvar')

      // Atualizar estado local
      setPhotos(photos.map(p => {
        if (p.id === photoId) {
          return {
            ...p,
            ai_summary: editingSummary,
            ai_has_problems: editingProblems.length > 0,
            problems: editingProblems,
          }
        }
        return p
      }))

      setEditingPhotoId(null)
      setEditingSummary('')
      setEditingProblems([])
      toast.success('Análise atualizada com sucesso!')
    } catch (error) {
      console.error('Erro ao salvar:', error)
      toast.error('Erro ao salvar alterações')
    } finally {
      setIsSavingEdit(false)
    }
  }

  // Adicionar novo problema
  const handleAddProblem = () => {
    setEditingProblems([
      ...editingProblems,
      {
        id: `new-${Date.now()}`,
        description: '',
        severity: 'medium',
        location: '',
        suggested_action: '',
        ai_confidence: 1.0,
      },
    ])
  }

  // Remover problema
  const handleRemoveProblem = (problemId: string) => {
    setEditingProblems(editingProblems.filter(p => p.id !== problemId))
  }

  // Atualizar problema
  const handleUpdateProblem = (problemId: string, field: string, value: string) => {
    setEditingProblems(editingProblems.map(p => {
      if (p.id === problemId) {
        return { ...p, [field]: value }
      }
      return p
    }))
  }

  // Abrir/fechar editor de custo (lógica delegada ao CostEditorDialog)
  const handleEditCost = (problem: Problem) => {
    setEditingCostProblem(problem)
  }

  const handleCloseCostEditor = () => {
    setEditingCostProblem(null)
  }

  const handleCostSaved = async () => {
    await fetchData() // Reload data after cost update
  }

  const handleGeneratePDF = async () => {
    setIsGenerating(true)
    try {
      const response = await fetch(`/api/inspections/${id}/generate-report`, {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          template_id: selectedTemplateId,
        }),
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

  // Helper function to format price
  const formatPrice = (value: number): string => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value)
  }

  const formatPriceRange = (min: number, max: number): string => {
    if (min === max) {
      return formatPrice(min)
    }
    return `${formatPrice(min)} - ${formatPrice(max)}`
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
    <div className="space-y-4 sm:space-y-6 px-4 sm:px-0">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3 sm:gap-4">
          <Button variant="ghost" size="icon" asChild className="shrink-0">
            <Link href={`/dashboard/inspections/${id}`}>
              <ArrowLeft className="h-5 w-5" />
            </Link>
          </Button>
          <div>
            <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-neutral-900">Revisão do Laudo</h1>
            <p className="text-xs sm:text-sm text-neutral-600 mt-1">
              Revise a análise antes de gerar o PDF
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <TemplateSelector
            onSelect={setSelectedTemplateId}
            selectedTemplateId={selectedTemplateId}
            disabled={isGenerating}
            trigger={
              <Button variant="outline" size="default" disabled={isGenerating} className="flex-1 sm:flex-none">
                <Palette className="mr-2 h-4 w-4 sm:h-5 sm:w-5" />
                <span className="hidden sm:inline">Template</span>
                <span className="sm:hidden">Tema</span>
              </Button>
            }
          />
          <Button onClick={handleGeneratePDF} disabled={isGenerating} size="default" className="flex-1 sm:flex-none">
            {isGenerating ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 sm:h-5 sm:w-5 animate-spin" />
                <span className="hidden sm:inline">Gerando PDF...</span>
                <span className="sm:hidden">Gerando...</span>
              </>
            ) : (
              <>
                <FileText className="mr-2 h-4 w-4 sm:h-5 sm:w-5" />
                <span className="hidden sm:inline">Gerar Laudo PDF</span>
                <span className="sm:hidden">Gerar PDF</span>
              </>
            )}
          </Button>
        </div>
      </div>

      {/* AI Training Banner - Educational guidance */}
      <AITrainingBanner className="mb-2" />

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

      {/* Cost Summary Card */}
      {costSummary && costSummary.problemsWithCosts > 0 && (
        <Card className="bg-gradient-to-r from-emerald-50 to-teal-50 border-emerald-200">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-emerald-800">
              <Calculator className="h-5 w-5" />
              Estimativa de Custos de Reparo
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
              <div className="text-center p-2 sm:p-3 bg-white/60 rounded-lg">
                <p className="text-xs sm:text-sm text-emerald-700 font-medium">Valor Mínimo</p>
                <p className="text-base sm:text-xl font-bold text-emerald-800">{formatPrice(costSummary.totalMin)}</p>
              </div>
              <div className="text-center p-2 sm:p-3 bg-white/60 rounded-lg">
                <p className="text-xs sm:text-sm text-emerald-700 font-medium">Valor Médio</p>
                <p className="text-base sm:text-xl font-bold text-emerald-800">{formatPrice(costSummary.totalAvg)}</p>
              </div>
              <div className="text-center p-2 sm:p-3 bg-white/60 rounded-lg">
                <p className="text-xs sm:text-sm text-emerald-700 font-medium">Valor Máximo</p>
                <p className="text-base sm:text-xl font-bold text-emerald-800">{formatPrice(costSummary.totalMax)}</p>
              </div>
              <div className="text-center p-2 sm:p-3 bg-white/60 rounded-lg">
                <p className="text-xs sm:text-sm text-emerald-700 font-medium">Problemas</p>
                <p className="text-base sm:text-xl font-bold text-emerald-800">
                  {costSummary.problemsWithCosts}/{costSummary.problemsWithCosts + costSummary.problemsWithoutCosts}
                </p>
              </div>
            </div>
            <p className="text-xs text-emerald-600 mt-3 text-center">
              Valores estimados para a região: {costSummary.region === 'sp_capital' ? 'São Paulo Capital' : costSummary.region}
            </p>
          </CardContent>
        </Card>
      )}

      {/* Rooms Analysis */}
      {roomsWithPhotos.map((room) => (
        <Card key={room.id}>
          <CardHeader>
            <CardTitle className="text-2xl">{room.name.toUpperCase()}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Each Photo with its Analysis - Integrated Cards */}
            {room.photos.map((photo: any, photoIndex: number) => {
              const isEditing = editingPhotoId === photo.id
              const isDeleting = deletingPhotoId === photo.id
              const hasContent = photo.ai_summary || photo.ai_has_problems

              return (
                <div key={photo.id} className="border border-neutral-200 rounded-lg p-4 space-y-4 bg-neutral-50/30">
                  {/* Photo Number Header */}
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-semibold text-lg text-neutral-900">
                      Foto {photoIndex + 1}
                    </h3>
                    <button
                      onClick={() => handleDeletePhoto(photo.id)}
                      disabled={isDeleting}
                      className="flex items-center gap-1 px-3 py-1.5 bg-danger-600 text-white text-xs font-medium rounded-md hover:bg-danger-700 disabled:opacity-50 transition-all"
                    >
                      {isDeleting ? (
                        <Loader2 className="h-3 w-3 animate-spin" />
                      ) : (
                        <>
                          <Trash2 className="h-3 w-3" />
                          <span>Excluir</span>
                        </>
                      )}
                    </button>
                  </div>

                  {/* Photo Image */}
                  <div
                    className="relative aspect-video rounded-lg overflow-hidden bg-neutral-100 shadow-md cursor-pointer hover:ring-2 hover:ring-primary-500 transition-all max-w-2xl"
                    onClick={() => setLightboxPhoto({ url: photo.photo_url, alt: `${room.name} - Foto ${photoIndex + 1}` })}
                  >
                    <img
                      src={photo.photo_url}
                      alt={`Foto ${room.name} ${photoIndex + 1}`}
                      className="object-cover w-full h-full"
                      loading="lazy"
                    />
                  </div>

                  {/* AI Analysis Section */}
                  {(hasContent || isEditing) && (
                    <div className="bg-white border border-neutral-200 rounded-lg p-4 space-y-4">
                      <div className="flex items-center justify-between">
                        <h4 className="font-semibold text-base flex items-center gap-2">
                          <Sparkles className="h-5 w-5 text-primary-600" />
                          Análise da IA
                        </h4>
                        {!isEditing ? (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleStartEdit(photo)}
                          >
                            <Pencil className="h-4 w-4 mr-1" />
                            Editar
                          </Button>
                        ) : (
                          <div className="flex gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={handleCancelEdit}
                              disabled={isSavingEdit}
                            >
                              <X className="h-4 w-4 mr-1" />
                              Cancelar
                            </Button>
                            <Button
                              size="sm"
                              onClick={() => handleSaveEdit(photo.id)}
                              disabled={isSavingEdit}
                            >
                              {isSavingEdit ? (
                                <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                              ) : (
                                <Save className="h-4 w-4 mr-1" />
                              )}
                              Salvar
                            </Button>
                          </div>
                        )}
                      </div>

                      {/* AI Summary */}
                      {isEditing ? (
                        <div className="space-y-2">
                          <label className="text-sm font-medium text-neutral-700">Resumo da Análise</label>
                          <textarea
                            value={editingSummary}
                            onChange={(e) => setEditingSummary(e.target.value)}
                            className="w-full p-3 border border-neutral-300 rounded-lg text-sm min-h-[100px] focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                            placeholder="Descreva a condição geral do ambiente..."
                          />
                        </div>
                      ) : photo.ai_summary ? (
                        <div className="p-3 bg-primary-50 border border-primary-200 rounded-lg">
                          <p className="text-sm text-neutral-700">{photo.ai_summary}</p>
                        </div>
                      ) : null}

                      {/* Problems */}
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <h5 className="font-medium text-neutral-700 flex items-center gap-2">
                            {photo.problems?.length > 0 && (
                              <Badge className="bg-danger-600">
                                {photo.problems.length} {photo.problems.length === 1 ? 'problema' : 'problemas'}
                              </Badge>
                            )}
                            {photo.problems?.length === 0 && <span className="text-sm text-neutral-500">Nenhum problema detectado</span>}
                          </h5>
                          {isEditing && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={handleAddProblem}
                            >
                              <Plus className="h-4 w-4 mr-1" />
                              Adicionar Problema
                            </Button>
                          )}
                        </div>

                        {isEditing ? (
                          editingProblems.length === 0 ? (
                            <p className="text-sm text-neutral-500 italic">Nenhum problema. Clique em "Adicionar" para registrar.</p>
                          ) : (
                            editingProblems.map((problem) => (
                              <div key={problem.id} className="p-3 bg-neutral-50 border border-neutral-200 rounded-lg space-y-3">
                                <div className="flex items-start justify-between gap-2">
                                  <div className="flex-1 space-y-3">
                                    <div>
                                      <label className="text-xs font-medium text-neutral-600">Descrição</label>
                                      <input
                                        type="text"
                                        value={problem.description}
                                        onChange={(e) => handleUpdateProblem(problem.id, 'description', e.target.value)}
                                        className="w-full p-2 border border-neutral-300 rounded text-sm mt-1"
                                        placeholder="Descreva o problema..."
                                      />
                                    </div>
                                    <div className="grid grid-cols-2 gap-3">
                                      <div>
                                        <label className="text-xs font-medium text-neutral-600">Gravidade</label>
                                        <select
                                          value={problem.severity}
                                          onChange={(e) => handleUpdateProblem(problem.id, 'severity', e.target.value)}
                                          className="w-full p-2 border border-neutral-300 rounded text-sm mt-1"
                                        >
                                          <option value="low">Baixa</option>
                                          <option value="medium">Média</option>
                                          <option value="high">Alta</option>
                                          <option value="urgent">Urgente</option>
                                        </select>
                                      </div>
                                      <div>
                                        <label className="text-xs font-medium text-neutral-600">Localização</label>
                                        <input
                                          type="text"
                                          value={problem.location || ''}
                                          onChange={(e) => handleUpdateProblem(problem.id, 'location', e.target.value)}
                                          className="w-full p-2 border border-neutral-300 rounded text-sm mt-1"
                                          placeholder="Ex: Parede direita"
                                        />
                                      </div>
                                    </div>
                                    <div>
                                      <label className="text-xs font-medium text-neutral-600">Ação Sugerida</label>
                                      <input
                                        type="text"
                                        value={problem.suggested_action || ''}
                                        onChange={(e) => handleUpdateProblem(problem.id, 'suggested_action', e.target.value)}
                                        className="w-full p-2 border border-neutral-300 rounded text-sm mt-1"
                                        placeholder="Ex: Repintar a parede"
                                      />
                                    </div>
                                  </div>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => handleRemoveProblem(problem.id)}
                                    className="text-danger-600 hover:text-danger-700 hover:bg-danger-50"
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                </div>
                              </div>
                            ))
                          )
                        ) : photo.problems?.length > 0 ? (
                          photo.problems.map((problem: any, idx: number) => (
                            <div key={idx} className="flex items-start gap-3 p-3 bg-danger-50 border border-danger-200 rounded-lg">
                              <IssueSeverity severity={problem.severity as any} />
                              <div className="flex-1">
                                <div className="flex items-start justify-between gap-2">
                                  <p className="font-medium text-neutral-900">{problem.description}</p>
                                  <AIFeedbackButton
                                    feedbackType="problem_detection"
                                    inspectionId={id}
                                    photoId={photo.id}
                                    problemId={problem.id}
                                    aiContent={{
                                      description: problem.description,
                                      severity: problem.severity,
                                      location: problem.location,
                                      suggestedAction: problem.suggested_action,
                                      confidence: problem.ai_confidence,
                                    }}
                                    compact
                                  />
                                </div>
                                {problem.location && (
                                  <p className="text-sm text-neutral-600 mt-1">Local: {problem.location}</p>
                                )}
                                {problem.suggested_action && (
                                  <p className="text-sm text-neutral-700 mt-2">
                                    <span className="font-medium">Ação sugerida:</span> {problem.suggested_action}
                                  </p>
                                )}
                                {/* Cost Estimate */}
                                <div className="mt-3 pt-3 border-t border-danger-200/50">
                                  <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                      <DollarSign className="h-4 w-4 text-emerald-600" />
                                      {problem.manual_cost ? (
                                        <span className="text-sm font-medium text-emerald-700">
                                          Custo manual: {formatPrice(problem.manual_cost)}
                                          {problem.cost_edited_at && (
                                            <Badge variant="outline" className="ml-2 text-xs">Editado</Badge>
                                          )}
                                        </span>
                                      ) : problem.estimatedCost ? (
                                        <span className="text-sm font-medium text-emerald-700">
                                          Estimativa: {formatPriceRange(problem.estimatedCost.min, problem.estimatedCost.max)}
                                        </span>
                                      ) : (
                                        <span className="text-sm text-neutral-500">Sem estimativa de custo</span>
                                      )}
                                    </div>
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      onClick={() => handleEditCost(problem)}
                                    >
                                      <Settings2 className="h-3 w-3 mr-1" />
                                      {problem.manual_cost ? 'Editar' : 'Adicionar'} Custo
                                    </Button>
                                  </div>
                                  {problem.cost_notes && (
                                    <p className="text-xs text-neutral-600 mt-2 italic">Obs: {problem.cost_notes}</p>
                                  )}
                                </div>
                              </div>
                            </div>
                          ))
                        ) : null}
                      </div>
                    </div>
                  )}
                </div>
              )
            })}
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

      {/* Cost Edit Dialog - Novo componente com busca e sugestões */}
      <CostEditorDialog
        problem={editingCostProblem}
        isOpen={!!editingCostProblem}
        onClose={handleCloseCostEditor}
        onSave={handleCostSaved}
      />
    </div>
  )
}

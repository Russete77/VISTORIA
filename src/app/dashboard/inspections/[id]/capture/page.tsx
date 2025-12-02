'use client'

import { use, useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Camera, Upload, Loader2, Check, Plus, Sparkles, FileText, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { IssueSeverity } from '@/components/vistoria/IssueSeverity'
import { PhotoLightbox } from '@/components/ui/PhotoLightbox'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { toast } from 'sonner'

/**
 * Inspection Capture Page - VistorIA Pro
 * Upload photos by room and get AI analysis
 */

interface Room {
  id: string
  name: string
  type: string
  order_index: number
  photos?: { count: number }[]
}

interface SuggestedRoom {
  name: string
  category: string
  photo_count: number
}

interface Photo {
  id: string
  photo_url: string
  ai_analysis: any
  created_at: string
}

interface InspectionCapturePageProps {
  params: Promise<{ id: string }>
}

const roomTypes = [
  { value: 'living_room', label: 'Sala de Estar' },
  { value: 'kitchen', label: 'Cozinha' },
  { value: 'bedroom', label: 'Quarto' },
  { value: 'bathroom', label: 'Banheiro' },
  { value: 'balcony', label: 'Varanda' },
  { value: 'garage', label: 'Garagem' },
  { value: 'laundry', label: 'Área de Serviço' },
  { value: 'hallway', label: 'Corredor' },
  { value: 'entrance', label: 'Entrada' },
  { value: 'other', label: 'Outro' },
]

export default function InspectionCapturePage({ params }: InspectionCapturePageProps) {
  const { id } = use(params)
  const router = useRouter()
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [isLoading, setIsLoading] = useState(true)
  const [rooms, setRooms] = useState<Room[]>([])
  const [selectedRoom, setSelectedRoom] = useState<string>('')
  const [isCreatingRoom, setIsCreatingRoom] = useState(false)
  const [newRoomName, setNewRoomName] = useState('')
  const [newRoomType, setNewRoomType] = useState('')
  const [isUploading, setIsUploading] = useState(false)
  const [photos, setPhotos] = useState<Photo[]>([])
  const [deletingPhotoId, setDeletingPhotoId] = useState<string | null>(null)
  const [lightboxPhoto, setLightboxPhoto] = useState<{ url: string; alt: string } | null>(null)
  const [showConfirmDialog, setShowConfirmDialog] = useState(false)
  const [isCompleting, setIsCompleting] = useState(false)
  const [suggestedRooms, setSuggestedRooms] = useState<SuggestedRoom[]>([])
  const [isLoadingSuggestions, setIsLoadingSuggestions] = useState(false)

  useEffect(() => {
    fetchRooms()
    fetchPhotos()
    fetchSuggestedRooms()
  }, [id])

  const fetchRooms = async () => {
    try {
      const response = await fetch(`/api/inspections/${id}/rooms`, {
        credentials: 'include',
      })
      if (!response.ok) throw new Error('Failed to fetch rooms')
      const data = await response.json()
      setRooms(data.rooms)
      if (data.rooms.length > 0) {
        setSelectedRoom(data.rooms[0].id)
      }
    } catch (error) {
      console.error('Error fetching rooms:', error)
      toast.error('Erro ao carregar cômodos')
    } finally {
      setIsLoading(false)
    }
  }

  const fetchPhotos = async () => {
    try {
      const response = await fetch(`/api/inspections/${id}/photos`, {
        credentials: 'include',
      })
      if (!response.ok) throw new Error('Failed to fetch photos')
      const data = await response.json()
      setPhotos(data.photos)
    } catch (error) {
      console.error('Error fetching photos:', error)
    }
  }

  const fetchSuggestedRooms = async () => {
    setIsLoadingSuggestions(true)
    try {
      const response = await fetch(`/api/inspections/${id}/suggested-rooms`, {
        credentials: 'include',
      })
      if (!response.ok) {
        // Not an error if no suggestions found - just log it
        console.log('No suggested rooms available')
        return
      }
      const data = await response.json()
      if (data.suggestions && data.suggestions.length > 0) {
        setSuggestedRooms(data.suggestions)
      }
    } catch (error) {
      console.error('Error fetching suggested rooms:', error)
      // Don't show error toast - suggestions are optional
    } finally {
      setIsLoadingSuggestions(false)
    }
  }

  const handleSuggestedRoomClick = (suggestion: SuggestedRoom) => {
    setNewRoomName(suggestion.name)
    setNewRoomType(suggestion.category)
    toast.success(`"${suggestion.name}" preenchido automaticamente`)
  }

  const handleCreateRoom = async () => {
    if (!newRoomName || !newRoomType) {
      toast.error('Preencha nome e tipo do cômodo')
      return
    }

    const trimmedName = newRoomName.trim()
    if (trimmedName.length < 2) {
      toast.error('Nome do cômodo deve ter pelo menos 2 caracteres')
      return
    }

    setIsCreatingRoom(true)
    try {
      const response = await fetch(`/api/inspections/${id}/rooms`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: trimmedName, // Enviar nome já trimmed
          category: newRoomType,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        console.error('Room creation failed:', errorData)
        throw new Error(errorData.error || 'Failed to create room')
      }

      const data = await response.json()

      setRooms([...rooms, data.room])
      setSelectedRoom(data.room.id)
      setNewRoomName('')
      setNewRoomType('')
      toast.success('Cômodo criado com sucesso!')
    } catch (error) {
      console.error('Error creating room:', error)
      toast.error(error instanceof Error ? error.message : 'Erro ao criar cômodo')
    } finally {
      setIsCreatingRoom(false)
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

      setPhotos(photos.filter((p) => p.id !== photoId))
      toast.success('Foto excluída com sucesso!')
      fetchRooms() // Atualiza contador de fotos
    } catch (error) {
      console.error('Error deleting photo:', error)
      toast.error('Erro ao excluir foto')
    } finally {
      setDeletingPhotoId(null)
    }
  }

  const handleComplete = async () => {
    try {
      setIsCompleting(true)

      // Validar que tem pelo menos 1 foto
      const totalPhotos = rooms.reduce((sum, room) => sum + (room.photos?.[0]?.count || 0), 0)
      if (totalPhotos === 0) {
        toast.error('Adicione pelo menos uma foto antes de concluir')
        setShowConfirmDialog(false)
        return
      }

      // Chamar API para mudar status para 'completed'
      const response = await fetch(`/api/inspections/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'completed' }),
        credentials: 'include',
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Erro ao concluir vistoria')
      }

      toast.success('Vistoria concluída com sucesso!')
      setShowConfirmDialog(false)

      // Redirecionar para a página de detalhes
      router.push(`/dashboard/inspections/${id}`)
    } catch (error) {
      console.error('Error completing inspection:', error)
      toast.error(error instanceof Error ? error.message : 'Erro ao concluir vistoria')
    } finally {
      setIsCompleting(false)
    }
  }

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files
    if (!files || files.length === 0 || !selectedRoom) return

    setIsUploading(true)

    try {
      const file = files[0]
      const room = rooms.find((r) => r.id === selectedRoom)
      if (!room) throw new Error('Room not found')

      const formData = new FormData()
      formData.append('photo', file)
      formData.append('room_id', selectedRoom)
      formData.append('room_name', room.name.trim()) // ✅ FIX: Garantir nome trimmed
      formData.append('room_type', room.type)

      const response = await fetch(`/api/inspections/${id}/photos`, {
        method: 'POST',
        body: formData,
      })

      if (!response.ok) throw new Error('Failed to upload photo')
      const data = await response.json()

      setPhotos([...photos, data.photo])

      // Show success with AI analysis summary
      if (data.aiAnalysis?.hasProblems) {
        toast.success(
          `Foto analisada! IA detectou ${data.aiAnalysis.problems.length} problema(s)`,
          { duration: 5000 }
        )
      } else {
        toast.success('Foto analisada! Nenhum problema detectado pela IA', { duration: 4000 })
      }
    } catch (error) {
      console.error('Error uploading photo:', error)
      toast.error('Erro ao enviar foto')
    } finally {
      setIsUploading(false)
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    }
  }

  const currentRoom = rooms.find((r) => r.id === selectedRoom)
  const currentRoomPhotos = currentRoom
    ? photos.filter((p: any) => p.room_name === currentRoom.name)
    : []

  // Calcular estatísticas para o dialog de confirmação
  const totalPhotos = rooms.reduce((sum, room) => sum + (room.photos?.[0]?.count || 0), 0)
  const totalRooms = rooms.length
  const roomsWithPhotos = rooms.filter((room) => (room.photos?.[0]?.count || 0) > 0).length

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary-600" />
      </div>
    )
  }

  return (
    <div className="space-y-4 sm:space-y-6 px-4 sm:px-0">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3 sm:gap-4 w-full sm:w-auto">
          <Button variant="ghost" size="icon" asChild className="flex-shrink-0">
            <Link href={`/dashboard/inspections/${id}`}>
              <ArrowLeft className="h-5 w-5" />
            </Link>
          </Button>
          <div className="min-w-0">
            <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-neutral-900 truncate">Captura de Fotos</h1>
            <p className="text-xs sm:text-sm md:text-base text-neutral-600 mt-1">
              Tire fotos dos cômodos e receba análise de IA
            </p>
          </div>
        </div>
        <div className="flex gap-2 w-full sm:w-auto">
          <Button onClick={() => router.push(`/dashboard/inspections/${id}/review`)} variant="outline" className="w-full sm:w-auto flex-shrink-0">
            <FileText className="mr-2 h-4 w-4" />
            Revisar Laudo
          </Button>
          <Button
            onClick={() => setShowConfirmDialog(true)}
            disabled={isCompleting}
            className="w-full sm:w-auto flex-shrink-0"
          >
            {isCompleting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Concluindo...
              </>
            ) : (
              <>
                <Check className="mr-2 h-4 w-4" />
                Concluir
              </>
            )}
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
        {/* Sidebar - Rooms List */}
        <Card>
          <CardHeader>
            <CardTitle>Cômodos</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Room List */}
            <div className="space-y-2">
              {rooms.map((room) => {
                const photoCount = room.photos?.[0]?.count || 0
                return (
                  <button
                    key={room.id}
                    onClick={() => setSelectedRoom(room.id)}
                    className={`
                      w-full text-left p-3 rounded-lg border-2 transition-all
                      ${
                        selectedRoom === room.id
                          ? 'border-primary-600 bg-primary-50'
                          : 'border-neutral-200 hover:border-neutral-300'
                      }
                    `}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-medium">{room.name}</span>
                      <Badge variant="secondary">
                        {photoCount} {photoCount === 1 ? 'foto' : 'fotos'}
                      </Badge>
                    </div>
                  </button>
                )
              })}
            </div>

            {/* Suggested Rooms from Move-In Inspection */}
            {suggestedRooms.length > 0 && (
              <div className="pt-4 border-t space-y-3">
                <div className="flex items-center gap-2 text-sm font-medium text-neutral-700">
                  <Sparkles className="h-4 w-4 text-primary-600" />
                  <span>Cômodos da Vistoria de Entrada</span>
                </div>
                <p className="text-xs text-neutral-500">
                  Clique para usar os mesmos nomes e garantir consistência na comparação
                </p>
                <div className="grid grid-cols-1 gap-2 max-h-64 overflow-y-auto">
                  {suggestedRooms.map((suggestion, index) => (
                    <button
                      key={index}
                      onClick={() => handleSuggestedRoomClick(suggestion)}
                      className="flex items-center justify-between p-2.5 text-left bg-primary-50 hover:bg-primary-100 border border-primary-200 hover:border-primary-300 rounded-lg transition-all group"
                      type="button"
                    >
                      <span className="text-sm font-medium text-neutral-800 group-hover:text-primary-700">
                        {suggestion.name}
                      </span>
                      <Badge variant="secondary" className="text-xs">
                        {suggestion.photo_count} {suggestion.photo_count === 1 ? 'foto' : 'fotos'}
                      </Badge>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Add Room */}
            <div className="pt-4 border-t space-y-3">
              <div className="flex items-center gap-2 text-sm font-medium text-neutral-700">
                <Plus className="h-4 w-4" />
                <span>{suggestedRooms.length > 0 ? 'Ou adicionar novo cômodo' : 'Adicionar Cômodo'}</span>
              </div>
              <Input
                placeholder="Nome do cômodo"
                value={newRoomName}
                onChange={(e) => setNewRoomName(e.target.value)}
                list="room-suggestions"
              />
              {suggestedRooms.length > 0 && (
                <datalist id="room-suggestions">
                  {suggestedRooms.map((suggestion, index) => (
                    <option key={index} value={suggestion.name} />
                  ))}
                </datalist>
              )}
              <Select value={newRoomType} onValueChange={setNewRoomType}>
                <SelectTrigger>
                  <SelectValue placeholder="Tipo" />
                </SelectTrigger>
                <SelectContent>
                  {roomTypes.map((type) => (
                    <SelectItem key={type.value} value={type.value}>
                      {type.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button
                onClick={handleCreateRoom}
                disabled={isCreatingRoom || !newRoomName || !newRoomType}
                variant="outline"
                className="w-full"
              >
                {isCreatingRoom ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Plus className="mr-2 h-4 w-4" />
                )}
                Adicionar Cômodo
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Main Content - Photo Capture */}
        <div className="lg:col-span-2 space-y-6">
          {selectedRoom ? (
            <>
              {/* Upload Area */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Camera className="h-5 w-5" />
                    {currentRoom?.name}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      capture="environment"
                      onChange={handleFileSelect}
                      className="hidden"
                      aria-label="Capturar foto"
                    />
                    <Button
                      onClick={() => fileInputRef.current?.click()}
                      disabled={isUploading}
                      size="lg"
                      className="w-full h-16 sm:h-20 text-base sm:text-lg"
                      aria-label="Abrir câmera para tirar foto"
                    >
                      {isUploading ? (
                        <>
                          <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                          <span className="text-sm sm:text-base">Analisando com IA...</span>
                        </>
                      ) : (
                        <>
                          <Camera className="mr-2 h-5 w-5" />
                          <span className="text-sm sm:text-base">Tirar Foto</span>
                        </>
                      )}
                    </Button>
                    <p className="text-xs sm:text-sm text-center text-neutral-600">
                      As fotos serão analisadas automaticamente pela IA
                    </p>
                    <p className="text-xs text-center text-neutral-500 italic">
                      Em dispositivos móveis, a câmera traseira será usada automaticamente
                    </p>
                  </div>
                </CardContent>
              </Card>

              {/* Photos Grid */}
              {currentRoomPhotos.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base sm:text-lg">Fotos Capturadas ({currentRoomPhotos.length})</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                      {currentRoomPhotos.map((photo: any) => {
                        const hasProblems = photo.problems && photo.problems.length > 0
                        const isDeleting = deletingPhotoId === photo.id
                        return (
                          <div key={photo.id} className="space-y-3">
                            <div className="relative group">
                              {/* Delete Button - Canto superior direito com espaçamento */}
                              <button
                                onClick={(e) => {
                                  e.stopPropagation()
                                  handleDeletePhoto(photo.id)
                                }}
                                disabled={isDeleting}
                                className="absolute top-2 right-2 z-10 flex items-center gap-1.5 px-2.5 py-1.5 bg-danger-600/90 backdrop-blur-sm text-white text-xs font-medium rounded-md shadow-md hover:bg-danger-700 disabled:opacity-50 transition-all"
                                aria-label="Excluir foto"
                              >
                                {isDeleting ? (
                                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                ) : (
                                  <>
                                    <Trash2 className="h-3.5 w-3.5" />
                                    <span>Excluir</span>
                                  </>
                                )}
                              </button>

                              <div
                                className="relative aspect-video rounded-lg overflow-hidden bg-neutral-100 shadow-sm cursor-pointer hover:ring-2 hover:ring-primary-500 transition-all"
                                onClick={() => setLightboxPhoto({ url: photo.photo_url, alt: `Foto - ${currentRoom?.name}` })}
                              >
                                <img
                                  src={photo.photo_url || ''}
                                  alt="Foto da vistoria"
                                  className="object-cover w-full h-full"
                                  loading="lazy"
                                />
                              </div>
                            </div>

                            {/* Badge de problemas - Abaixo da imagem */}
                            {hasProblems && (
                              <div className="flex items-center gap-2">
                                <Badge className="bg-danger-600 text-xs">
                                  <Sparkles className="mr-1 h-3 w-3" />
                                  {photo.problems.length} {photo.problems.length === 1 ? 'problema detectado' : 'problemas detectados'}
                                </Badge>
                              </div>
                            )}

                            {/* AI Summary */}
                            {photo.ai_summary && (
                              <div className="p-2 bg-primary-50 rounded-md border border-primary-200">
                                <p className="text-xs text-neutral-700">
                                  <span className="font-semibold">Análise IA:</span> {photo.ai_summary}
                                </p>
                              </div>
                            )}

                            {/* Problems List */}
                            {hasProblems && (
                              <div className="space-y-1">
                                {photo.problems.map((problem: any, idx: number) => (
                                  <div
                                    key={idx}
                                    className="flex items-start gap-2 text-xs p-2 bg-white rounded border border-neutral-200"
                                  >
                                    <IssueSeverity severity={problem.severity} size="sm" />
                                    <div className="flex-1 min-w-0">
                                      <p className="text-neutral-700 font-medium">{problem.description}</p>
                                      {problem.location && (
                                        <p className="text-neutral-500 text-xs mt-0.5">Local: {problem.location}</p>
                                      )}
                                      {problem.suggested_action && (
                                        <p className="text-primary-600 text-xs mt-0.5">Ação: {problem.suggested_action}</p>
                                      )}
                                    </div>
                                  </div>
                                ))}
                              </div>
                            )}

                            {/* User Notes */}
                            {photo.user_notes && (
                              <div className="p-2 bg-neutral-50 rounded-md border border-neutral-200">
                                <p className="text-xs text-neutral-600">
                                  <span className="font-semibold">Observações:</span> {photo.user_notes}
                                </p>
                              </div>
                            )}
                          </div>
                        )
                      })}
                    </div>
                  </CardContent>
                </Card>
              )}
            </>
          ) : (
            <Card className="p-12">
              <div className="text-center text-neutral-600">
                <Camera className="h-16 w-16 mx-auto mb-4 text-neutral-400" />
                <p>Selecione ou crie um cômodo para começar</p>
              </div>
            </Card>
          )}
        </div>
      </div>

      {/* Photo Lightbox */}
      <PhotoLightbox
        isOpen={!!lightboxPhoto}
        photoUrl={lightboxPhoto?.url || ''}
        photoAlt={lightboxPhoto?.alt || 'Foto da vistoria'}
        onClose={() => setLightboxPhoto(null)}
      />

      {/* Confirm Complete Dialog */}
      <AlertDialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Concluir Vistoria?</AlertDialogTitle>
            <AlertDialogDescription>
              Após concluir, não será possível adicionar mais fotos. Você poderá gerar o laudo em PDF.
            </AlertDialogDescription>
          </AlertDialogHeader>

          <div className="my-4 space-y-2 text-sm">
            <div className="flex justify-between py-2 border-b">
              <span className="text-neutral-600">Total de cômodos:</span>
              <span className="font-semibold">{totalRooms}</span>
            </div>
            <div className="flex justify-between py-2 border-b">
              <span className="text-neutral-600">Cômodos com fotos:</span>
              <span className="font-semibold">{roomsWithPhotos}</span>
            </div>
            <div className="flex justify-between py-2 border-b">
              <span className="text-neutral-600">Total de fotos:</span>
              <span className="font-semibold">{totalPhotos}</span>
            </div>
          </div>

          {totalPhotos === 0 && (
            <div className="p-3 bg-danger-50 border border-danger-200 rounded-md">
              <p className="text-sm text-danger-700">
                Você precisa adicionar pelo menos uma foto antes de concluir a vistoria.
              </p>
            </div>
          )}

          {totalPhotos > 0 && roomsWithPhotos < totalRooms && (
            <div className="p-3 bg-warning-50 border border-warning-200 rounded-md">
              <p className="text-sm text-warning-700">
                Alguns cômodos ainda não têm fotos. Tem certeza que deseja continuar?
              </p>
            </div>
          )}

          <AlertDialogFooter>
            <AlertDialogCancel disabled={isCompleting}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleComplete}
              disabled={isCompleting || totalPhotos === 0}
            >
              {isCompleting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Concluindo...
                </>
              ) : (
                'Sim, Concluir'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

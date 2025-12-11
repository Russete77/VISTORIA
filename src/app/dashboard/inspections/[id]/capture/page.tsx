'use client'

import { use, useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Camera, Upload, Loader2, Check, Plus, Sparkles, FileText, Trash2, Mic, MoreVertical, X, Zap, Video } from 'lucide-react'
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
import { IssueSeverity, VoiceInput } from '@/components/vistoria'
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
  user_notes?: string
  room_name?: string
  problems?: any[]
  ai_summary?: string
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
  const videoInputRef = useRef<HTMLInputElement>(null)

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
  const [editingNotes, setEditingNotes] = useState<string | null>(null)
  const [notesText, setNotesText] = useState('')
  const [isSavingNotes, setIsSavingNotes] = useState(false)
  const [showMobileMenu, setShowMobileMenu] = useState(false)
  const [isCreatingRoomsByVoice, setIsCreatingRoomsByVoice] = useState(false)
  const [isUploadingVideo, setIsUploadingVideo] = useState(false)

  useEffect(() => {
    const initializePage = async () => {
      // PRIMEIRO: tentar auto-criar cômodos da vistoria de entrada (se for saída)
      await fetchSuggestedRooms()
      // DEPOIS: buscar os cômodos (incluindo os auto-criados)
      await fetchRooms()
      // Por fim: buscar fotos
      fetchPhotos()
    }
    initializePage()
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
      // Use autoCreate=true to automatically create rooms from move-in inspection
      const response = await fetch(`/api/inspections/${id}/suggested-rooms?autoCreate=true`, {
        credentials: 'include',
      })
      if (!response.ok) {
        // Not an error if no suggestions found - just log it
        console.log('No suggested rooms available')
        return
      }
      const data = await response.json()

      // If rooms were auto-created, show success message
      if (data.autoCreated && data.createdRooms?.length > 0) {
        console.log('[AutoCreate] Rooms created from move-in inspection:', data.createdRooms.length)
        toast.success(`${data.createdRooms.length} cômodos importados da vistoria de entrada!`)
        // fetchRooms será chamado logo depois no useEffect
      }

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

  // Importar TODOS os cômodos da vistoria de entrada de uma vez
  const handleImportAllRooms = async () => {
    if (suggestedRooms.length === 0) return

    setIsCreatingRoom(true)
    let created = 0
    let failed = 0

    for (const suggestion of suggestedRooms) {
      try {
        const response = await fetch(`/api/inspections/${id}/rooms`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: suggestion.name,
            category: suggestion.category,
          }),
        })

        if (response.ok) {
          const data = await response.json()
          setRooms(prev => [...prev, data.room])
          if (created === 0) {
            setSelectedRoom(data.room.id)
          }
          created++
        } else {
          failed++
        }
      } catch (error) {
        console.error('Error creating room:', suggestion.name, error)
        failed++
      }
    }

    setIsCreatingRoom(false)
    setSuggestedRooms([]) // Limpar sugestões após importar

    if (created > 0) {
      toast.success(`${created} cômodo(s) importado(s) com sucesso!`)
    }
    if (failed > 0) {
      toast.error(`${failed} cômodo(s) não puderam ser importados`)
    }
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

  const handleEditNotes = (photoId: string, currentNotes: string) => {
    setEditingNotes(photoId)
    setNotesText(currentNotes || '')
  }

  const handleSaveNotes = async (photoId: string) => {
    setIsSavingNotes(true)
    try {
      const response = await fetch(`/api/inspections/${id}/photos`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ photoId, user_notes: notesText }),
        credentials: 'include',
      })

      if (!response.ok) throw new Error('Failed to save notes')

      // Update local state
      setPhotos(photos.map(p =>
        p.id === photoId ? { ...p, user_notes: notesText } : p
      ))
      setEditingNotes(null)
      setNotesText('')
      toast.success('Observações salvas!')
    } catch (error) {
      console.error('Error saving notes:', error)
      toast.error('Erro ao salvar observações')
    } finally {
      setIsSavingNotes(false)
    }
  }

  const handleVoiceTranscript = (text: string) => {
    setNotesText(prev => prev ? `${prev} ${text}` : text)
  }

  // Tipos de cômodos conhecidos
  const knownRoomTypes: { [key: string]: { name: string; type: string } } = {
    'sala': { name: 'SALA', type: 'living_room' },
    'sala de estar': { name: 'SALA DE ESTAR', type: 'living_room' },
    'sala de jantar': { name: 'SALA DE JANTAR', type: 'living_room' },
    'living': { name: 'LIVING', type: 'living_room' },
    'cozinha': { name: 'COZINHA', type: 'kitchen' },
    'quarto': { name: 'QUARTO', type: 'bedroom' },
    'quartos': { name: 'QUARTO', type: 'bedroom' },
    'dormitório': { name: 'DORMITÓRIO', type: 'bedroom' },
    'dormitórios': { name: 'DORMITÓRIO', type: 'bedroom' },
    'suíte': { name: 'SUÍTE', type: 'bedroom' },
    'suítes': { name: 'SUÍTE', type: 'bedroom' },
    'suite': { name: 'SUÍTE', type: 'bedroom' },
    'suites': { name: 'SUÍTE', type: 'bedroom' },
    'banheiro': { name: 'BANHEIRO', type: 'bathroom' },
    'banheiros': { name: 'BANHEIRO', type: 'bathroom' },
    'lavabo': { name: 'LAVABO', type: 'bathroom' },
    'wc': { name: 'WC', type: 'bathroom' },
    'varanda': { name: 'VARANDA', type: 'balcony' },
    'varandas': { name: 'VARANDA', type: 'balcony' },
    'sacada': { name: 'SACADA', type: 'balcony' },
    'terraço': { name: 'TERRAÇO', type: 'balcony' },
    'garagem': { name: 'GARAGEM', type: 'garage' },
    'vaga': { name: 'VAGA', type: 'garage' },
    'vagas': { name: 'VAGA', type: 'garage' },
    'área de serviço': { name: 'ÁREA DE SERVIÇO', type: 'laundry' },
    'lavanderia': { name: 'LAVANDERIA', type: 'laundry' },
    'corredor': { name: 'CORREDOR', type: 'hallway' },
    'hall': { name: 'HALL', type: 'hallway' },
    'entrada': { name: 'ENTRADA', type: 'entrance' },
    'escritório': { name: 'ESCRITÓRIO', type: 'other' },
    'despensa': { name: 'DESPENSA', type: 'other' },
    'closet': { name: 'CLOSET', type: 'other' },
  }

  // Parsear transcrição de voz para cômodos
  const parseVoiceRooms = (transcript: string): { name: string; type: string }[] => {
    const results: { name: string; type: string }[] = []

    console.log('[VoiceRooms] Texto original:', transcript)

    // Mapa de números por extenso
    const numberWords: { [key: string]: number } = {
      'um': 1, 'uma': 1, 'dois': 2, 'duas': 2, 'tres': 3, 'três': 3,
      'quatro': 4, 'cinco': 5, 'seis': 6, 'sete': 7, 'oito': 8, 'nove': 9, 'dez': 10
    }

    // PRIMEIRO: Separar por vírgulas e "e" ANTES de limpar pontuação
    const rawSegments = transcript
      .toLowerCase()
      .split(/\s*,\s*|\s+e\s+/)
      .map(s => s.replace(/[.!?]/g, '').trim())
      .filter(s => s.length > 0)

    console.log('[VoiceRooms] Segmentos:', rawSegments)

    // Lista de cômodos para buscar (ordenados do mais específico para o mais genérico)
    const roomMappings = [
      { patterns: ['sala de estar'], name: 'SALA DE ESTAR', type: 'living_room' },
      { patterns: ['sala de jantar'], name: 'SALA DE JANTAR', type: 'living_room' },
      { patterns: ['area de servico', 'área de serviço'], name: 'ÁREA DE SERVIÇO', type: 'laundry' },
      { patterns: ['cozinha'], name: 'COZINHA', type: 'kitchen' },
      { patterns: ['quarto', 'quartos'], name: 'QUARTO', type: 'bedroom' },
      { patterns: ['suite', 'suíte', 'suites', 'suítes'], name: 'SUÍTE', type: 'bedroom' },
      { patterns: ['dormitorio', 'dormitório', 'dormitorios', 'dormitórios'], name: 'DORMITÓRIO', type: 'bedroom' },
      { patterns: ['banheiro', 'banheiros'], name: 'BANHEIRO', type: 'bathroom' },
      { patterns: ['lavabo'], name: 'LAVABO', type: 'bathroom' },
      { patterns: ['varanda', 'varandas'], name: 'VARANDA', type: 'balcony' },
      { patterns: ['sacada', 'sacadas'], name: 'SACADA', type: 'balcony' },
      { patterns: ['garagem'], name: 'GARAGEM', type: 'garage' },
      { patterns: ['vaga', 'vagas'], name: 'VAGA', type: 'garage' },
      { patterns: ['lavanderia'], name: 'LAVANDERIA', type: 'laundry' },
      { patterns: ['corredor'], name: 'CORREDOR', type: 'hallway' },
      { patterns: ['hall'], name: 'HALL', type: 'hallway' },
      { patterns: ['entrada'], name: 'ENTRADA', type: 'entrance' },
      { patterns: ['escritorio', 'escritório'], name: 'ESCRITÓRIO', type: 'other' },
      { patterns: ['closet'], name: 'CLOSET', type: 'other' },
      { patterns: ['despensa'], name: 'DESPENSA', type: 'other' },
      { patterns: ['sala'], name: 'SALA', type: 'living_room' }, // Sala genérica por último
    ]

    // Processar cada segmento
    for (const segment of rawSegments) {
      console.log('[VoiceRooms] Processando segmento:', segment)

      // Encontrar qual cômodo está no segmento
      let foundRoom = null
      for (const room of roomMappings) {
        for (const pattern of room.patterns) {
          if (segment.includes(pattern)) {
            foundRoom = room
            console.log(`[VoiceRooms] Cômodo encontrado: ${pattern} -> ${room.name}`)
            break
          }
        }
        if (foundRoom) break
      }

      if (!foundRoom) {
        console.log('[VoiceRooms] Nenhum cômodo encontrado no segmento')
        continue
      }

      // Extrair quantidade
      let quantity = 1

      // Procurar número no início do segmento
      const words = segment.split(/\s+/)
      const firstWord = words[0]

      // Verificar se é número
      const numericMatch = firstWord.match(/^\d+$/)
      if (numericMatch) {
        quantity = parseInt(firstWord)
        console.log(`[VoiceRooms] Quantidade numérica: ${quantity}`)
      } else if (numberWords[firstWord]) {
        quantity = numberWords[firstWord]
        console.log(`[VoiceRooms] Quantidade por extenso (${firstWord}): ${quantity}`)
      } else {
        // Verificar segunda palavra também (ex: "mais um quarto")
        if (words.length > 1 && numberWords[words[1]]) {
          quantity = numberWords[words[1]]
          console.log(`[VoiceRooms] Quantidade na segunda palavra (${words[1]}): ${quantity}`)
        }
      }

      // Adicionar cômodos com quantidade
      if (quantity === 1) {
        results.push({ name: foundRoom.name, type: foundRoom.type })
      } else {
        for (let i = 1; i <= quantity; i++) {
          results.push({ name: `${foundRoom.name} ${i}`, type: foundRoom.type })
        }
      }
      console.log(`[VoiceRooms] Adicionado: ${quantity}x ${foundRoom.name}`)
    }

    console.log('[VoiceRooms] Resultado final:', results)
    return results
  }

  // Função para criar cômodos por voz
  const handleVoiceRooms = async (transcript: string) => {
    // Parsear os cômodos da transcrição
    const parsedRooms = parseVoiceRooms(transcript)

    if (parsedRooms.length === 0) {
      toast.error('Não consegui identificar os cômodos. Diga por exemplo: "2 quartos, 1 banheiro e cozinha"')
      return
    }

    setIsCreatingRoomsByVoice(true)

    // Mostrar preview do que será criado
    const preview = parsedRooms.map(r => r.name).join(', ')
    toast.info(`Criando: ${preview}`)

    let created = 0
    let failed = 0

    for (const room of parsedRooms) {
      try {
        const response = await fetch(`/api/inspections/${id}/rooms`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: room.name,
            category: room.type,
          }),
        })

        if (response.ok) {
          const data = await response.json()
          setRooms(prev => [...prev, data.room])
          if (!selectedRoom) {
            setSelectedRoom(data.room.id)
          }
          created++
        } else {
          failed++
        }
      } catch (error) {
        console.error('Erro ao criar cômodo:', room.name, error)
        failed++
      }
    }

    setIsCreatingRoomsByVoice(false)

    if (created > 0) {
      toast.success(`${created} cômodo(s) criado(s) com sucesso!`)
    }
    if (failed > 0) {
      toast.error(`${failed} cômodo(s) não puderam ser criados`)
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

  const handleVideoSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files
    if (!files || files.length === 0 || !selectedRoom) return

    const file = files[0]

    // Validar duração do vídeo (max 30s)
    const video = document.createElement('video')
    video.preload = 'metadata'

    video.onloadedmetadata = async () => {
      window.URL.revokeObjectURL(video.src)

      if (video.duration > 30) {
        toast.error('Vídeo muito longo! Máximo 30 segundos.')
        if (videoInputRef.current) {
          videoInputRef.current.value = ''
        }
        return
      }

      setIsUploadingVideo(true)

      try {
        const room = rooms.find((r) => r.id === selectedRoom)
        if (!room) throw new Error('Room not found')

        const formData = new FormData()
        formData.append('video', file)
        formData.append('room_id', selectedRoom)
        formData.append('room_name', room.name.trim())
        formData.append('room_type', room.type)

        const response = await fetch(`/api/inspections/${id}/video-analysis`, {
          method: 'POST',
          body: formData,
        })

        if (!response.ok) throw new Error('Failed to upload video')
        const data = await response.json()

        toast.success(
          `Vídeo processado! ${data.framesProcessed} frames analisados e salvos como fotos.${
            data.totalProblems > 0 ? ` ${data.totalProblems} problema(s) detectado(s).` : ''
          }`,
          { duration: 6000 }
        )

        // Refresh photos to show frames extracted from video
        fetchPhotos()
        fetchRooms()
      } catch (error) {
        console.error('Error uploading video:', error)
        toast.error('Erro ao processar vídeo')
      } finally {
        setIsUploadingVideo(false)
        if (videoInputRef.current) {
          videoInputRef.current.value = ''
        }
      }
    }

    video.src = URL.createObjectURL(file)
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
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3 sm:gap-4 min-w-0">
          <Button variant="ghost" size="icon" asChild className="flex-shrink-0">
            <Link href={`/dashboard/inspections/${id}`}>
              <ArrowLeft className="h-5 w-5" />
            </Link>
          </Button>
          <div className="min-w-0">
            <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-neutral-900 truncate">Captura de Fotos</h1>
            <p className="text-xs sm:text-sm md:text-base text-neutral-600 mt-1 hidden sm:block">
              Tire fotos dos cômodos e receba análise de IA
            </p>
          </div>
        </div>

        {/* Desktop buttons */}
        <div className="hidden sm:flex gap-2">
          <Button onClick={() => router.push(`/dashboard/inspections/${id}/review`)} variant="outline">
            <FileText className="mr-2 h-4 w-4" />
            Revisar Laudo
          </Button>
          <Button
            onClick={() => setShowConfirmDialog(true)}
            disabled={isCompleting}
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

        {/* Mobile menu button */}
        <div className="sm:hidden relative">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setShowMobileMenu(!showMobileMenu)}
            className="h-10 w-10"
          >
            <MoreVertical className="h-5 w-5" />
          </Button>

          {/* Mobile dropdown menu */}
          {showMobileMenu && (
            <>
              <div
                className="fixed inset-0 z-40"
                onClick={() => setShowMobileMenu(false)}
              />
              <div className="absolute right-0 top-12 z-50 w-56 bg-white border border-neutral-200 rounded-lg shadow-lg p-2 animate-in fade-in-0 zoom-in-95">
                <button
                  onClick={() => {
                    router.push(`/dashboard/inspections/${id}/review`)
                    setShowMobileMenu(false)
                  }}
                  className="w-full flex items-center gap-3 px-3 py-2.5 text-sm text-neutral-700 hover:bg-neutral-100 rounded-md transition-colors"
                >
                  <FileText className="h-4 w-4" />
                  Revisar Laudo
                </button>
                <button
                  onClick={() => {
                    setShowConfirmDialog(true)
                    setShowMobileMenu(false)
                  }}
                  disabled={isCompleting}
                  className="w-full flex items-center gap-3 px-3 py-2.5 text-sm text-primary-600 hover:bg-primary-50 rounded-md transition-colors disabled:opacity-50"
                >
                  <Check className="h-4 w-4" />
                  Concluir Vistoria
                </button>
              </div>
            </>
          )}
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
                      <Badge variant="outline">
                        {photoCount} {photoCount === 1 ? 'foto' : 'fotos'}
                      </Badge>
                    </div>
                  </button>
                )
              })}
            </div>

            {/* Suggested Rooms from Move-In Inspection */}
            {suggestedRooms.length > 0 && rooms.length === 0 && (
              <div className="pt-4 border-t space-y-3">
                <div className="flex items-center gap-2 text-sm font-medium text-neutral-700">
                  <Sparkles className="h-4 w-4 text-primary-600" />
                  <span>Cômodos da Vistoria de Entrada</span>
                </div>

                {/* BOTÃO PRINCIPAL: Importar todos de uma vez */}
                <Button
                  onClick={handleImportAllRooms}
                  disabled={isCreatingRoom}
                  className="w-full bg-primary-600 hover:bg-primary-700"
                >
                  {isCreatingRoom ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Importando...
                    </>
                  ) : (
                    <>
                      <Plus className="mr-2 h-4 w-4" />
                      Importar {suggestedRooms.length} cômodos
                    </>
                  )}
                </Button>

                <p className="text-xs text-neutral-500 text-center">
                  Todos os cômodos da vistoria de entrada serão criados automaticamente
                </p>
              </div>
            )}

            {/* Add Room */}
            <div className="pt-4 border-t space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-sm font-medium text-neutral-700">
                  <Plus className="h-4 w-4" />
                  <span>{suggestedRooms.length > 0 ? 'Ou adicionar novo cômodo' : 'Adicionar Cômodo'}</span>
                </div>
                <VoiceInput
                  onTranscript={handleVoiceRooms}
                  disabled={isCreatingRoomsByVoice}
                />
              </div>
              <p className="text-xs text-neutral-500">
                Use o microfone para falar todos os cômodos de uma vez
              </p>
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
                    {/* Input de foto */}
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      capture="environment"
                      onChange={handleFileSelect}
                      className="hidden"
                      aria-label="Capturar foto"
                    />

                    {/* Input de vídeo */}
                    <input
                      ref={videoInputRef}
                      type="file"
                      accept="video/*"
                      capture="environment"
                      onChange={handleVideoSelect}
                      className="hidden"
                      aria-label="Gravar vídeo"
                    />

                    {/* Grid com 2 botões */}
                    <div className="grid grid-cols-2 gap-3">
                      <Button
                        onClick={() => fileInputRef.current?.click()}
                        disabled={isUploading || isUploadingVideo}
                        size="lg"
                        className="h-16 sm:h-20 text-sm sm:text-base"
                        aria-label="Abrir câmera para tirar foto"
                      >
                        {isUploading ? (
                          <>
                            <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                            <span className="hidden sm:inline">Analisando...</span>
                          </>
                        ) : (
                          <>
                            <Camera className="mr-2 h-5 w-5" />
                            <span>Foto</span>
                          </>
                        )}
                      </Button>

                      <Button
                        onClick={() => videoInputRef.current?.click()}
                        disabled={isUploading || isUploadingVideo}
                        size="lg"
                        variant="outline"
                        className="h-16 sm:h-20 text-sm sm:text-base border-primary-600 text-primary-600 hover:bg-primary-50"
                        aria-label="Gravar vídeo de até 30 segundos"
                      >
                        {isUploadingVideo ? (
                          <>
                            <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                            <span className="hidden sm:inline">Processando...</span>
                          </>
                        ) : (
                          <>
                            <Video className="mr-2 h-5 w-5" />
                            <span>Vídeo</span>
                          </>
                        )}
                      </Button>
                    </div>

                    <p className="text-xs sm:text-sm text-center text-neutral-600">
                      Tire fotos ou grave um vídeo (máx 30s) para análise automática com IA
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

                            {/* User Notes - Editable with Voice */}
                            <div className="space-y-2">
                              {editingNotes === photo.id ? (
                                <div className="p-3 bg-neutral-50 rounded-lg border border-neutral-200 space-y-3">
                                  <div className="relative">
                                    <textarea
                                      value={notesText}
                                      onChange={(e) => setNotesText(e.target.value)}
                                      placeholder="Digite ou fale suas observações..."
                                      rows={3}
                                      className="w-full px-3 py-2 pr-12 text-sm border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent resize-none"
                                    />
                                    <div className="absolute bottom-2 right-2">
                                      <VoiceInput
                                        onTranscript={handleVoiceTranscript}
                                        className="h-8 w-8"
                                      />
                                    </div>
                                  </div>
                                  <div className="flex gap-2">
                                    <Button
                                      type="button"
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => {
                                        setEditingNotes(null)
                                        setNotesText('')
                                      }}
                                      className="flex-1"
                                    >
                                      Cancelar
                                    </Button>
                                    <Button
                                      type="button"
                                      size="sm"
                                      onClick={() => handleSaveNotes(photo.id)}
                                      disabled={isSavingNotes}
                                      className="flex-1"
                                    >
                                      {isSavingNotes ? (
                                        <Loader2 className="h-4 w-4 animate-spin" />
                                      ) : (
                                        'Salvar'
                                      )}
                                    </Button>
                                  </div>
                                </div>
                              ) : (
                                <button
                                  onClick={() => handleEditNotes(photo.id, photo.user_notes)}
                                  className="w-full p-2 bg-neutral-50 hover:bg-neutral-100 rounded-lg border border-neutral-200 border-dashed text-left transition-colors group"
                                >
                                  {photo.user_notes ? (
                                    <p className="text-xs text-neutral-600">
                                      <span className="font-semibold">Observações:</span> {photo.user_notes}
                                      <span className="text-primary-600 opacity-0 group-hover:opacity-100 ml-2 text-xs">(editar)</span>
                                    </p>
                                  ) : (
                                    <div className="flex items-center gap-2 text-xs text-neutral-400">
                                      <Mic className="h-3.5 w-3.5" />
                                      <span>Adicionar observação por voz ou texto...</span>
                                    </div>
                                  )}
                                </button>
                              )}
                            </div>
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

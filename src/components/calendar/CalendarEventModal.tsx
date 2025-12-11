'use client'

import { useState, useEffect } from 'react'
import { X, Calendar, Home, FileSearch, Trash2, ExternalLink, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
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
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Switch } from '@/components/ui/switch'
import { cn } from '@/lib/utils'
import { useCalendar } from '@/hooks/use-calendar'
import type { CalendarItem, EventColor, CalendarEventType } from '@/lib/validations/calendar'
import type { Property } from '@/types/database'

interface CalendarEventModalProps {
  isOpen: boolean
  onClose: () => void
  selectedDate: Date | null
  selectedEvent: CalendarItem | null
  properties: Property[]
  onEventCreated: () => void
  onEventDeleted: (id: string) => void
}

const eventTypeLabels: Record<CalendarEventType, string> = {
  appointment: 'Compromisso',
  reminder: 'Lembrete',
  maintenance: 'Manutenção',
  meeting: 'Reunião',
  other: 'Outro',
}

const colorOptions: { value: EventColor; label: string; className: string }[] = [
  { value: 'blue', label: 'Azul', className: 'bg-blue-500' },
  { value: 'green', label: 'Verde', className: 'bg-green-500' },
  { value: 'purple', label: 'Roxo', className: 'bg-purple-500' },
  { value: 'orange', label: 'Laranja', className: 'bg-orange-500' },
  { value: 'red', label: 'Vermelho', className: 'bg-red-500' },
  { value: 'yellow', label: 'Amarelo', className: 'bg-yellow-500' },
  { value: 'pink', label: 'Rosa', className: 'bg-pink-500' },
  { value: 'teal', label: 'Turquesa', className: 'bg-teal-500' },
]

export function CalendarEventModal({
  isOpen,
  onClose,
  selectedDate,
  selectedEvent,
  properties,
  onEventCreated,
  onEventDeleted,
}: CalendarEventModalProps) {
  const { createEvent, updateEvent } = useCalendar({ autoFetch: false })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  
  // Form states
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [eventType, setEventType] = useState<CalendarEventType>('appointment')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [startTime, setStartTime] = useState('')
  const [endTime, setEndTime] = useState('')
  const [allDay, setAllDay] = useState(true)
  const [propertyId, setPropertyId] = useState('')
  const [color, setColor] = useState<EventColor>('blue')

  // Determine if viewing an existing event or creating new
  const isViewMode = selectedEvent && selectedEvent.type !== 'event'
  const isEditMode = selectedEvent && selectedEvent.type === 'event'
  const isCreateMode = !selectedEvent

  // Initialize form when modal opens
  useEffect(() => {
    if (isOpen) {
      if (selectedEvent) {
        // Editing/viewing existing event
        setTitle(selectedEvent.title)
        setDescription(selectedEvent.description || '')
        setStartDate(selectedEvent.startDate)
        setEndDate(selectedEvent.endDate)
        setStartTime(selectedEvent.startTime || '')
        setEndTime(selectedEvent.endTime || '')
        setAllDay(selectedEvent.allDay)
        setPropertyId(selectedEvent.propertyId || '')
        setColor(selectedEvent.color)
        setEventType('appointment')
      } else if (selectedDate) {
        // Creating new event
        const dateStr = selectedDate.toISOString().split('T')[0]
        setTitle('')
        setDescription('')
        setEventType('appointment')
        setStartDate(dateStr)
        setEndDate(dateStr)
        setStartTime('')
        setEndTime('')
        setAllDay(true)
        setPropertyId('')
        setColor('blue')
      }
    }
  }, [isOpen, selectedEvent, selectedDate])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!title.trim()) return
    
    setIsSubmitting(true)
    
    try {
      const eventData = {
        title: title.trim(),
        description: description.trim() || null,
        event_type: eventType,
        start_date: startDate,
        end_date: endDate,
        start_time: allDay ? null : startTime || null,
        end_time: allDay ? null : endTime || null,
        all_day: allDay,
        property_id: propertyId || null,
        color,
      }
      
      if (isEditMode && selectedEvent) {
        await updateEvent(selectedEvent.id, eventData)
      } else {
        await createEvent(eventData)
      }
      
      onEventCreated()
    } catch (error) {
      console.error('Error saving event:', error)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDelete = async () => {
    if (!selectedEvent || selectedEvent.type !== 'event') return
    
    setIsDeleting(true)
    try {
      onEventDeleted(selectedEvent.id)
    } finally {
      setIsDeleting(false)
    }
  }

  const getEventTypeIcon = () => {
    if (!selectedEvent) return null
    switch (selectedEvent.type) {
      case 'booking':
        return <Home className="h-5 w-5 text-green-600" />
      case 'inspection':
        return <FileSearch className="h-5 w-5 text-purple-600" />
      default:
        return <Calendar className="h-5 w-5 text-blue-600" />
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <div className="flex items-center gap-2">
            {getEventTypeIcon()}
            <DialogTitle>
              {isViewMode ? selectedEvent?.title : isEditMode ? 'Editar Compromisso' : 'Novo Compromisso'}
            </DialogTitle>
          </div>
          {isViewMode && selectedEvent && (
            <DialogDescription>
              {selectedEvent.type === 'booking' ? 'Reserva' : 'Vistoria'} - 
              {new Date(selectedEvent.startDate + 'T00:00:00').toLocaleDateString('pt-BR', {
                weekday: 'long',
                day: 'numeric',
                month: 'long',
              })}
            </DialogDescription>
          )}
        </DialogHeader>

        {/* View Mode - Show event details */}
        {isViewMode && selectedEvent && (
          <div className="space-y-4 py-4">
            <div>
              <Label className="text-neutral-500 text-sm">Descrição</Label>
              <p className="mt-1 text-neutral-900">
                {selectedEvent.description || 'Sem descrição'}
              </p>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-neutral-500 text-sm">Início</Label>
                <p className="mt-1 text-neutral-900">
                  {new Date(selectedEvent.startDate + 'T00:00:00').toLocaleDateString('pt-BR')}
                </p>
              </div>
              <div>
                <Label className="text-neutral-500 text-sm">Término</Label>
                <p className="mt-1 text-neutral-900">
                  {new Date(selectedEvent.endDate + 'T00:00:00').toLocaleDateString('pt-BR')}
                </p>
              </div>
            </div>
            
            {selectedEvent.propertyName && (
              <div>
                <Label className="text-neutral-500 text-sm">Imóvel</Label>
                <p className="mt-1 text-neutral-900">{selectedEvent.propertyName}</p>
              </div>
            )}
            
            {selectedEvent.guestName && (
              <div>
                <Label className="text-neutral-500 text-sm">Hóspede</Label>
                <p className="mt-1 text-neutral-900">{selectedEvent.guestName}</p>
              </div>
            )}
            
            <div className="flex gap-2 pt-4">
              <Button asChild className="flex-1">
                <a href={
                  selectedEvent.type === 'booking' 
                    ? `/dashboard/bookings/${selectedEvent.bookingId}`
                    : `/dashboard/inspections/${selectedEvent.inspectionId}`
                }>
                  <ExternalLink className="h-4 w-4 mr-2" />
                  Ver Detalhes
                </a>
              </Button>
              <Button variant="outline" onClick={onClose}>
                Fechar
              </Button>
            </div>
          </div>
        )}

        {/* Create/Edit Mode - Show form */}
        {(isCreateMode || isEditMode) && (
          <form onSubmit={handleSubmit} className="space-y-4 py-4">
            {/* Title */}
            <div>
              <Label htmlFor="event-title">Título *</Label>
              <Input
                id="event-title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Ex: Manutenção do ar-condicionado"
                required
              />
            </div>

            {/* Description */}
            <div>
              <Label htmlFor="event-description">Descrição</Label>
              <Textarea
                id="event-description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Detalhes do compromisso..."
                rows={2}
              />
            </div>

            {/* Event Type */}
            <div>
              <Label>Tipo</Label>
              <Select value={eventType} onValueChange={(v) => setEventType(v as CalendarEventType)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(eventTypeLabels).map(([value, label]) => (
                    <SelectItem key={value} value={value}>{label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Dates */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="start-date">Data Início *</Label>
                <Input
                  id="start-date"
                  type="date"
                  value={startDate}
                  onChange={(e) => {
                    setStartDate(e.target.value)
                    if (!endDate || e.target.value > endDate) {
                      setEndDate(e.target.value)
                    }
                  }}
                  required
                />
              </div>
              <div>
                <Label htmlFor="end-date">Data Término *</Label>
                <Input
                  id="end-date"
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  min={startDate}
                  required
                />
              </div>
            </div>

            {/* All Day Toggle */}
            <div className="flex items-center justify-between">
              <Label htmlFor="all-day">Dia inteiro</Label>
              <Switch
                id="all-day"
                checked={allDay}
                onCheckedChange={setAllDay}
              />
            </div>

            {/* Time (if not all day) */}
            {!allDay && (
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="start-time">Hora Início</Label>
                  <Input
                    id="start-time"
                    type="time"
                    value={startTime}
                    onChange={(e) => setStartTime(e.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor="end-time">Hora Término</Label>
                  <Input
                    id="end-time"
                    type="time"
                    value={endTime}
                    onChange={(e) => setEndTime(e.target.value)}
                  />
                </div>
              </div>
            )}

            {/* Property */}
            <div>
              <Label>Imóvel (opcional)</Label>
              <Select value={propertyId || '__none__'} onValueChange={(v) => setPropertyId(v === '__none__' ? '' : v)}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione um imóvel" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__none__">Nenhum</SelectItem>
                  {properties.map((property) => (
                    <SelectItem key={property.id} value={property.id}>
                      {property.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Color */}
            <div>
              <Label>Cor</Label>
              <div className="flex gap-2 mt-2">
                {colorOptions.map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    className={cn(
                      'w-8 h-8 rounded-full transition-all',
                      option.className,
                      color === option.value && 'ring-2 ring-offset-2 ring-neutral-400',
                    )}
                    onClick={() => setColor(option.value)}
                    title={option.label}
                  />
                ))}
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-2 pt-4">
              {isEditMode && (
                <Button
                  type="button"
                  variant="destructive"
                  onClick={handleDelete}
                  disabled={isDeleting || isSubmitting}
                >
                  {isDeleting ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Trash2 className="h-4 w-4" />
                  )}
                </Button>
              )}
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                disabled={isSubmitting}
                className="flex-1"
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={isSubmitting} className="flex-1">
                {isSubmitting ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : null}
                {isEditMode ? 'Salvar' : 'Criar'}
              </Button>
            </div>
          </form>
        )}
      </DialogContent>
    </Dialog>
  )
}

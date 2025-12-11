'use client'

import { useState, useEffect, useMemo } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Loader2,
  Save,
  Search,
  DollarSign,
  Sparkles,
  Calculator,
  X,
} from 'lucide-react'
import { toast } from 'sonner'

interface RepairService {
  id: string
  name: string
  description: string | null
  category: {
    id: string
    name: string
  } | null
  unit: string
  base_price_min: number
  base_price_max: number
}

interface Problem {
  id: string
  description: string
  severity: string
  location: string | null
  suggested_action: string | null
  service_id?: string | null
  quantity?: number
  manual_cost?: number | null
  cost_notes?: string | null
  estimatedCost?: {
    min: number
    max: number
    avg: number
    service_name?: string
    unit?: string
  } | null
}

interface CostEditorDialogProps {
  problem: Problem | null
  isOpen: boolean
  onClose: () => void
  onSave: () => void
}

// Helper function to format price
const formatPrice = (value: number): string => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value)
}

// Keyword matching for service suggestions
const SERVICE_KEYWORDS: Record<string, string[]> = {
  pintura: ['pintar', 'pintura', 'tinta', 'parede', 'repintar', 'descascando', 'descascada'],
  hidraulica: ['vazamento', 'vazando', 'torneira', 'cano', 'encanamento', 'hidraulic', 'goteira'],
  eletrica: ['tomada', 'interruptor', 'eletric', 'fio', 'luz', 'lampada', 'curto'],
  piso: ['piso', 'azulejo', 'ceramica', 'rachado', 'quebrado', 'solto', 'trincado'],
  porta: ['porta', 'dobradic', 'fechadura', 'macaneta', 'travando'],
  janela: ['janela', 'vidro', 'vidrac', 'trinco', 'borracha'],
  infiltracao: ['infiltrac', 'umidade', 'mofo', 'bolor', 'manchas'],
  limpeza: ['limpeza', 'limpar', 'sujo', 'sujeira', 'encardido'],
}

export function CostEditorDialog({
  problem,
  isOpen,
  onClose,
  onSave,
}: CostEditorDialogProps) {
  const [services, setServices] = useState<RepairService[]>([])
  const [loadingServices, setLoadingServices] = useState(false)
  const [isSaving, setIsSaving] = useState(false)

  // Form state
  const [selectedServiceId, setSelectedServiceId] = useState<string>('')
  const [quantity, setQuantity] = useState('1')
  const [manualCost, setManualCost] = useState('')
  const [notes, setNotes] = useState('')
  const [searchQuery, setSearchQuery] = useState('')

  // Load services when dialog opens
  useEffect(() => {
    if (isOpen && services.length === 0) {
      fetchServices()
    }
  }, [isOpen])

  // Reset form when problem changes
  useEffect(() => {
    if (problem) {
      setSelectedServiceId(problem.service_id || '')
      setQuantity((problem.quantity || 1).toString())
      setManualCost(problem.manual_cost?.toString() || '')
      setNotes(problem.cost_notes || '')
      setSearchQuery('')
    }
  }, [problem])

  const fetchServices = async () => {
    setLoadingServices(true)
    try {
      const response = await fetch('/api/costs/services')
      if (response.ok) {
        const data = await response.json()
        setServices(data.services || [])
      }
    } catch (error) {
      console.error('Error fetching services:', error)
      toast.error('Erro ao carregar serviços')
    } finally {
      setLoadingServices(false)
    }
  }

  // Get suggested services based on problem description
  const suggestedServices = useMemo(() => {
    if (!problem || services.length === 0) return []

    const description = problem.description.toLowerCase()
    const suggestedAction = (problem.suggested_action || '').toLowerCase()
    const searchText = `${description} ${suggestedAction}`

    const suggestions: RepairService[] = []

    for (const [, keywords] of Object.entries(SERVICE_KEYWORDS)) {
      for (const keyword of keywords) {
        if (searchText.includes(keyword)) {
          const matchingServices = services.filter(
            (s) =>
              s.name.toLowerCase().includes(keyword) ||
              s.description?.toLowerCase().includes(keyword) ||
              s.category?.name?.toLowerCase().includes(keyword)
          )
          suggestions.push(...matchingServices)
        }
      }
    }

    // Remove duplicates and limit to 5
    return [...new Map(suggestions.map((s) => [s.id, s])).values()].slice(0, 5)
  }, [problem, services])

  // Filter services based on search query
  const filteredServices = useMemo(() => {
    if (!searchQuery) return services

    const query = searchQuery.toLowerCase()
    return services.filter(
      (s) =>
        s.name.toLowerCase().includes(query) ||
        s.description?.toLowerCase().includes(query) ||
        s.category?.name?.toLowerCase().includes(query)
    )
  }, [services, searchQuery])

  // Get selected service details
  const selectedService = services.find((s) => s.id === selectedServiceId)

  // Calculate preview cost
  const previewCost = useMemo(() => {
    if (manualCost) {
      const manual = parseFloat(manualCost)
      if (!isNaN(manual) && manual > 0) {
        return { min: manual, max: manual, isManual: true }
      }
    }

    if (selectedService) {
      const qty = parseFloat(quantity) || 1
      return {
        min: selectedService.base_price_min * qty,
        max: selectedService.base_price_max * qty,
        isManual: false,
      }
    }

    if (problem?.estimatedCost) {
      const qty = parseFloat(quantity) || 1
      return {
        min: problem.estimatedCost.min * qty,
        max: problem.estimatedCost.max * qty,
        isManual: false,
      }
    }

    return null
  }, [manualCost, selectedService, quantity, problem])

  const handleSave = async () => {
    if (!problem) return

    setIsSaving(true)
    try {
      const updateData: Record<string, unknown> = {}

      if (selectedServiceId) {
        updateData.service_id = selectedServiceId
      }

      const qty = parseFloat(quantity)
      if (!isNaN(qty) && qty > 0) {
        updateData.quantity = qty
      }

      const manual = parseFloat(manualCost)
      if (!isNaN(manual) && manual > 0) {
        updateData.manual_cost = manual
      } else if (manualCost === '') {
        updateData.manual_cost = null
      }

      if (notes) {
        updateData.cost_notes = notes
      }

      const response = await fetch(`/api/problems/${problem.id}/cost`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updateData),
      })

      if (!response.ok) {
        throw new Error('Falha ao salvar custo')
      }

      toast.success('Custo atualizado com sucesso!')
      onSave()
      onClose()
    } catch (error) {
      console.error('Error saving cost:', error)
      toast.error('Erro ao salvar custo')
    } finally {
      setIsSaving(false)
    }
  }

  const handleClearManualCost = () => {
    setManualCost('')
  }

  const handleQuickAction = (action: 'clear' | 'round' | 'increase' | 'decrease') => {
    if (!previewCost) return

    const baseValue = previewCost.max || 0
    let newValue: number

    switch (action) {
      case 'clear':
        setManualCost('')
        setSelectedServiceId('')
        return
      case 'round':
        newValue = Math.ceil(baseValue / 100) * 100
        break
      case 'increase':
        newValue = Math.round(baseValue * 1.1)
        break
      case 'decrease':
        newValue = Math.round(baseValue * 0.9)
        break
    }

    setManualCost(newValue.toString())
  }

  if (!problem) return null

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <DollarSign className="h-5 w-5 text-emerald-600" />
            Editar Custo do Reparo
          </DialogTitle>
          <DialogDescription className="text-left">
            {problem.description}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-5 py-4">
          {/* AI Suggested Services */}
          {suggestedServices.length > 0 && !selectedServiceId && (
            <div className="space-y-2">
              <Label className="flex items-center gap-2 text-sm">
                <Sparkles className="h-4 w-4 text-amber-500" />
                Serviços Sugeridos
              </Label>
              <div className="flex flex-wrap gap-2">
                {suggestedServices.map((service) => (
                  <Button
                    key={service.id}
                    variant="outline"
                    size="sm"
                    onClick={() => setSelectedServiceId(service.id)}
                    className="text-xs h-auto py-1.5 px-3"
                  >
                    {service.name}
                    <Badge variant="default" className="ml-2 text-[10px]">
                      {formatPrice(service.base_price_min)}
                    </Badge>
                  </Button>
                ))}
              </div>
            </div>
          )}

          {/* Search Input */}
          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              <Search className="h-4 w-4" />
              Buscar Serviço
            </Label>
            <Input
              placeholder="Digite para filtrar serviços..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          {/* Service Selection */}
          <div className="space-y-2">
            <Label>Serviço Selecionado</Label>
            <Select
              value={selectedServiceId || '__auto__'}
              onValueChange={(value) => setSelectedServiceId(value === '__auto__' ? '' : value)}
              disabled={loadingServices}
            >
              <SelectTrigger>
                <SelectValue placeholder={loadingServices ? 'Carregando...' : 'Selecione um serviço'} />
              </SelectTrigger>
              <SelectContent className="max-h-60">
                <SelectItem value="__auto__">Usar estimativa automática</SelectItem>
                {filteredServices.map((service) => (
                  <SelectItem key={service.id} value={service.id}>
                    <div className="flex flex-col">
                      <span>{service.name}</span>
                      <span className="text-xs text-neutral-500">
                        {formatPrice(service.base_price_min)} - {formatPrice(service.base_price_max)} / {service.unit}
                      </span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {selectedService && (
              <p className="text-xs text-neutral-500">
                {selectedService.description}
              </p>
            )}
          </div>

          {/* Quantity */}
          <div className="space-y-2">
            <Label htmlFor="quantity">
              Quantidade {selectedService && `(${selectedService.unit})`}
            </Label>
            <Input
              id="quantity"
              type="number"
              step="0.1"
              min="0.1"
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              placeholder="1"
            />
          </div>

          {/* Manual Cost */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="manualCost">Custo Manual (R$)</Label>
              {manualCost && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleClearManualCost}
                  className="h-6 px-2 text-xs text-neutral-500"
                >
                  <X className="h-3 w-3 mr-1" />
                  Limpar
                </Button>
              )}
            </div>
            <Input
              id="manualCost"
              type="number"
              step="0.01"
              min="0"
              value={manualCost}
              onChange={(e) => setManualCost(e.target.value)}
              placeholder="Deixe vazio para usar estimativa"
            />
            <p className="text-xs text-neutral-500">
              Sobrescreve a estimativa automática
            </p>
          </div>

          {/* Quick Actions */}
          {previewCost && !previewCost.isManual && (
            <div className="flex flex-wrap gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleQuickAction('decrease')}
                className="text-xs"
              >
                -10%
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleQuickAction('round')}
                className="text-xs"
              >
                Arredondar
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleQuickAction('increase')}
                className="text-xs"
              >
                +10%
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleQuickAction('clear')}
                className="text-xs text-neutral-500"
              >
                Sem custo
              </Button>
            </div>
          )}

          {/* Cost Preview */}
          {previewCost && (
            <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <Calculator className="h-4 w-4 text-emerald-600" />
                <Label className="text-sm font-medium text-emerald-800">
                  Preview do Custo
                </Label>
              </div>
              <div className="text-2xl font-bold text-emerald-700">
                {previewCost.isManual ? (
                  formatPrice(previewCost.min)
                ) : previewCost.min === previewCost.max ? (
                  formatPrice(previewCost.min)
                ) : (
                  `${formatPrice(previewCost.min)} - ${formatPrice(previewCost.max)}`
                )}
              </div>
              {previewCost.isManual && (
                <Badge variant="outline" className="mt-2 text-xs">
                  Valor manual
                </Badge>
              )}
              {selectedService && !previewCost.isManual && (
                <p className="text-xs text-emerald-600 mt-1">
                  {selectedService.name} x {quantity} {selectedService.unit}
                </p>
              )}
            </div>
          )}

          {/* Notes */}
          <div className="space-y-2">
            <Label htmlFor="notes">Observações</Label>
            <Input
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Ex: Orçamento do prestador X"
              maxLength={500}
            />
          </div>
        </div>

        <DialogFooter className="flex-col sm:flex-row gap-2">
          <Button variant="outline" onClick={onClose} disabled={isSaving} className="w-full sm:w-auto">
            Cancelar
          </Button>
          <Button onClick={handleSave} disabled={isSaving} className="w-full sm:w-auto">
            {isSaving ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Salvando...
              </>
            ) : (
              <>
                <Save className="mr-2 h-4 w-4" />
                Salvar Custo
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

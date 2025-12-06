'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { ArrowLeft, Search, DollarSign, Edit2, X, Check, RotateCcw, Loader2, Filter } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
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
import { toast } from 'sonner'

interface ServiceCategory {
  id: string
  code: string
  name: string
  icon: string | null
}

interface Service {
  id: string
  code: string
  name: string
  description: string | null
  unit: string
  unit_label: string
  base_price_min: number
  base_price_max: number
  includes_material: boolean
  includes_labor: boolean
  category: ServiceCategory | null
  custom_price: {
    min: number
    max: number
    notes: string | null
    updated_at: string
  } | null
  effective_price: {
    min: number
    max: number
    is_custom: boolean
  }
}

export default function PricesSettingsPage() {
  const [isLoading, setIsLoading] = useState(true)
  const [categories, setCategories] = useState<ServiceCategory[]>([])
  const [services, setServices] = useState<Service[]>([])
  const [selectedCategory, setSelectedCategory] = useState<string>('all')
  const [searchTerm, setSearchTerm] = useState('')

  // Edit modal state
  const [editingService, setEditingService] = useState<Service | null>(null)
  const [editPriceMin, setEditPriceMin] = useState('')
  const [editPriceMax, setEditPriceMax] = useState('')
  const [editNotes, setEditNotes] = useState('')
  const [isSaving, setIsSaving] = useState(false)

  const fetchServices = useCallback(async () => {
    setIsLoading(true)
    try {
      const params = new URLSearchParams()
      if (selectedCategory !== 'all') {
        params.set('category', selectedCategory)
      }
      if (searchTerm) {
        params.set('search', searchTerm)
      }

      const response = await fetch(`/api/costs/services?${params}`)
      if (response.ok) {
        const data = await response.json()
        setCategories(data.categories || [])
        setServices(data.services || [])
      }
    } catch (error) {
      console.error('Error fetching services:', error)
      toast.error('Erro ao carregar serviços')
    } finally {
      setIsLoading(false)
    }
  }, [selectedCategory, searchTerm])

  useEffect(() => {
    fetchServices()
  }, [fetchServices])

  const formatPrice = (value: number): string => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value)
  }

  const handleEditClick = (service: Service) => {
    setEditingService(service)
    setEditPriceMin(service.effective_price.min.toString())
    setEditPriceMax(service.effective_price.max.toString())
    setEditNotes(service.custom_price?.notes || '')
  }

  const handleSavePrice = async () => {
    if (!editingService) return

    const min = parseFloat(editPriceMin)
    const max = parseFloat(editPriceMax)

    if (isNaN(min) || isNaN(max) || min <= 0 || max <= 0) {
      toast.error('Por favor, insira valores válidos')
      return
    }

    if (min > max) {
      toast.error('Preço mínimo não pode ser maior que o máximo')
      return
    }

    setIsSaving(true)
    try {
      const response = await fetch('/api/costs/services', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          service_id: editingService.id,
          custom_price_min: min,
          custom_price_max: max,
          notes: editNotes || null,
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Falha ao salvar')
      }

      toast.success('Preço personalizado salvo!')
      setEditingService(null)
      fetchServices()
    } catch (error) {
      console.error('Error saving price:', error)
      toast.error(error instanceof Error ? error.message : 'Erro ao salvar preço')
    } finally {
      setIsSaving(false)
    }
  }

  const handleResetPrice = async (serviceId: string) => {
    try {
      const response = await fetch(`/api/costs/services?service_id=${serviceId}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        throw new Error('Falha ao resetar')
      }

      toast.success('Preço revertido para o padrão')
      fetchServices()
    } catch (error) {
      console.error('Error resetting price:', error)
      toast.error('Erro ao resetar preço')
    }
  }

  // Filter services by search term locally for quick filtering
  const filteredServices = services.filter(service => {
    if (!searchTerm) return true
    const search = searchTerm.toLowerCase()
    return (
      service.name.toLowerCase().includes(search) ||
      service.description?.toLowerCase().includes(search) ||
      service.code.toLowerCase().includes(search)
    )
  })

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/dashboard/settings">
            <ArrowLeft className="h-5 w-5" />
          </Link>
        </Button>
        <div>
          <h1 className="text-3xl font-bold text-neutral-900">Tabela de Preços</h1>
          <p className="text-sm text-neutral-600 mt-1">
            Personalize os preços dos serviços de reparo para sua região
          </p>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <Label htmlFor="search" className="sr-only">Buscar</Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-400" />
                <Input
                  id="search"
                  placeholder="Buscar serviço..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div className="w-full sm:w-64">
              <Label htmlFor="category" className="sr-only">Categoria</Label>
              <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                <SelectTrigger id="category">
                  <Filter className="h-4 w-4 mr-2" />
                  <SelectValue placeholder="Todas as categorias" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas as categorias</SelectItem>
                  {categories.map((cat) => (
                    <SelectItem key={cat.id} value={cat.code}>
                      {cat.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Services List */}
      {isLoading ? (
        <div className="space-y-4">
          {[1, 2, 3, 4, 5].map((i) => (
            <Skeleton key={i} className="h-24 w-full" />
          ))}
        </div>
      ) : filteredServices.length === 0 ? (
        <Card className="p-12">
          <div className="text-center text-neutral-600">
            <DollarSign className="h-12 w-12 mx-auto mb-4 text-neutral-400" />
            <p>Nenhum serviço encontrado</p>
          </div>
        </Card>
      ) : (
        <div className="space-y-3">
          {filteredServices.map((service) => (
            <Card
              key={service.id}
              className={`transition-all ${
                service.effective_price.is_custom
                  ? 'border-emerald-200 bg-emerald-50/30'
                  : ''
              }`}
            >
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="font-semibold text-neutral-900">{service.name}</h3>
                      {service.effective_price.is_custom && (
                        <Badge variant="outline" className="bg-emerald-100 text-emerald-700 border-emerald-300">
                          Personalizado
                        </Badge>
                      )}
                      {service.category && (
                        <Badge variant="default" className="text-xs bg-neutral-100 text-neutral-700">
                          {service.category.name}
                        </Badge>
                      )}
                    </div>
                    {service.description && (
                      <p className="text-sm text-neutral-600 mt-1 line-clamp-1">
                        {service.description}
                      </p>
                    )}
                    <div className="flex items-center gap-4 mt-2 text-sm">
                      <span className="text-neutral-500">{service.unit_label}</span>
                      {service.includes_material && (
                        <span className="text-neutral-500">+ material</span>
                      )}
                      {service.includes_labor && (
                        <span className="text-neutral-500">+ mão de obra</span>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="text-right">
                      <div className="font-semibold text-lg text-neutral-900">
                        {formatPrice(service.effective_price.min)} - {formatPrice(service.effective_price.max)}
                      </div>
                      {service.effective_price.is_custom && (
                        <div className="text-xs text-neutral-500">
                          Padrão: {formatPrice(service.base_price_min)} - {formatPrice(service.base_price_max)}
                        </div>
                      )}
                    </div>

                    <div className="flex items-center gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleEditClick(service)}
                        title="Editar preço"
                      >
                        <Edit2 className="h-4 w-4" />
                      </Button>
                      {service.effective_price.is_custom && (
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleResetPrice(service.id)}
                          title="Reverter para padrão"
                          className="text-neutral-500 hover:text-neutral-700"
                        >
                          <RotateCcw className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Summary */}
      <Card className="bg-neutral-50">
        <CardContent className="pt-6">
          <div className="flex items-center justify-between text-sm">
            <span className="text-neutral-600">
              {filteredServices.length} serviços
              {filteredServices.filter(s => s.effective_price.is_custom).length > 0 && (
                <span className="ml-2 text-emerald-600">
                  ({filteredServices.filter(s => s.effective_price.is_custom).length} personalizados)
                </span>
              )}
            </span>
            <Link href="/dashboard/settings" className="text-primary-600 hover:underline">
              Voltar para Configurações
            </Link>
          </div>
        </CardContent>
      </Card>

      {/* Edit Price Dialog */}
      <Dialog open={!!editingService} onOpenChange={(open) => !open && setEditingService(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar Preço</DialogTitle>
            <DialogDescription>
              {editingService?.name}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="priceMin">Preço Mínimo (R$)</Label>
                <Input
                  id="priceMin"
                  type="number"
                  step="0.01"
                  min="0"
                  value={editPriceMin}
                  onChange={(e) => setEditPriceMin(e.target.value)}
                  placeholder="0.00"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="priceMax">Preço Máximo (R$)</Label>
                <Input
                  id="priceMax"
                  type="number"
                  step="0.01"
                  min="0"
                  value={editPriceMax}
                  onChange={(e) => setEditPriceMax(e.target.value)}
                  placeholder="0.00"
                />
              </div>
            </div>

            {editingService && (
              <p className="text-sm text-neutral-500">
                Preço padrão: {formatPrice(editingService.base_price_min)} - {formatPrice(editingService.base_price_max)} {editingService.unit_label}
              </p>
            )}

            <div className="space-y-2">
              <Label htmlFor="notes">Observações (opcional)</Label>
              <Input
                id="notes"
                value={editNotes}
                onChange={(e) => setEditNotes(e.target.value)}
                placeholder="Ex: Preço do fornecedor X"
                maxLength={500}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setEditingService(null)} disabled={isSaving}>
              Cancelar
            </Button>
            <Button onClick={handleSavePrice} disabled={isSaving}>
              {isSaving ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Salvando...
                </>
              ) : (
                <>
                  <Check className="mr-2 h-4 w-4" />
                  Salvar
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Building2, MapPin, Home, FileText, Loader2, Upload, X, Image as ImageIcon } from 'lucide-react'
import type { Property } from '@/types/database'
import Image from 'next/image'

/**
 * PropertyForm Component - VistorIA Pro
 * Form for creating/editing properties
 */

const propertyFormSchema = z.object({
  name: z.string().min(3, 'Nome deve ter no mínimo 3 caracteres'),
  address: z.string().min(5, 'Endereço deve ter no mínimo 5 caracteres'),
  city: z.string().optional(),
  state: z.string().optional(),
  zip_code: z.string().optional(),
  type: z.enum(['apartment', 'house', 'commercial', 'land', 'other']),
  bedrooms: z.string().optional(),
  bathrooms: z.string().optional(),
  area: z.string().optional(),
  floor: z.string().optional(),
  parking_spaces: z.string().optional(),
  has_elevator: z.boolean().optional(),
  is_furnished: z.boolean().optional(),
  notes: z.string().optional(),
})

type PropertyFormData = z.infer<typeof propertyFormSchema>

interface PropertyFormProps {
  property?: Property
  onSuccess?: () => void
}

export function PropertyForm({ property, onSuccess }: PropertyFormProps) {
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [thumbnailFile, setThumbnailFile] = useState<File | null>(null)
  const [thumbnailPreview, setThumbnailPreview] = useState<string | null>(property?.thumbnail_url || null)
  const [isUploadingThumbnail, setIsUploadingThumbnail] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
  } = useForm<PropertyFormData>({
    resolver: zodResolver(propertyFormSchema),
    defaultValues: property
      ? {
          name: property.name,
          address: property.address,
          city: property.city || '',
          state: property.state || '',
          zip_code: property.zip_code || '',
          type: property.type,
          bedrooms: property.bedrooms?.toString() || '',
          bathrooms: property.bathrooms?.toString() || '',
          area: property.area?.toString() || '',
          floor: property.floor?.toString() || '',
          parking_spaces: property.parking_spaces?.toString() || '',
          has_elevator: property.has_elevator || false,
          is_furnished: property.is_furnished || false,
          notes: property.notes || '',
        }
      : {
          type: 'apartment',
          has_elevator: false,
          is_furnished: false,
        },
  })

  const selectedType = watch('type')

  const handleThumbnailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      if (!file.type.startsWith('image/')) {
        setError('Por favor, selecione uma imagem válida')
        return
      }
      if (file.size > 5 * 1024 * 1024) {
        setError('A imagem deve ter no máximo 5MB')
        return
      }
      setThumbnailFile(file)
      const reader = new FileReader()
      reader.onloadend = () => {
        setThumbnailPreview(reader.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  const removeThumbnail = () => {
    setThumbnailFile(null)
    setThumbnailPreview(null)
  }

  const onSubmit = async (data: PropertyFormData) => {
    setIsSubmitting(true)
    setError(null)

    try {
      // Convert string numbers to actual numbers
      const payload = {
        ...data,
        bedrooms: data.bedrooms ? parseInt(data.bedrooms) : undefined,
        bathrooms: data.bathrooms ? parseInt(data.bathrooms) : undefined,
        area: data.area ? parseFloat(data.area) : undefined,
        floor: data.floor ? parseInt(data.floor) : undefined,
        parking_spaces: data.parking_spaces ? parseInt(data.parking_spaces) : undefined,
      }

      const url = property ? `/api/properties/${property.id}` : '/api/properties'
      const method = property ? 'PATCH' : 'POST'

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(payload),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to save property')
      }

      const result = await response.json()
      const propertyId = result.property.id

      // Upload thumbnail if provided
      if (thumbnailFile) {
        setIsUploadingThumbnail(true)
        const formData = new FormData()
        formData.append('thumbnail', thumbnailFile)

        const uploadResponse = await fetch(`/api/properties/${propertyId}/thumbnail`, {
          method: 'POST',
          credentials: 'include',
          body: formData,
        })

        if (!uploadResponse.ok) {
          const errorData = await uploadResponse.json()
          console.error('Failed to upload thumbnail:', errorData)
          throw new Error(errorData.error || 'Failed to upload thumbnail')
        }

        const uploadResult = await uploadResponse.json()
        console.log('Thumbnail uploaded successfully:', uploadResult)
      }

      if (onSuccess) {
        onSuccess()
      } else {
        router.push('/dashboard/properties')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setIsSubmitting(false)
      setIsUploadingThumbnail(false)
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {/* Error Message */}
      {error && (
        <div className="p-4 bg-danger-50 border border-danger-200 rounded-lg text-danger-700 text-sm">
          {error}
        </div>
      )}

      {/* Basic Information */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5" />
            Informações Básicas
          </CardTitle>
          <CardDescription>
            Dados principais do imóvel
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="name">Nome do Imóvel *</Label>
            <Input
              id="name"
              {...register('name')}
              placeholder="Ex: Apartamento Jardim Paulista"
            />
            {errors.name && (
              <p className="text-sm text-danger-600 mt-1">{errors.name.message}</p>
            )}
          </div>

          <div>
            <Label htmlFor="type">Tipo de Imóvel *</Label>
            <Select
              value={selectedType}
              onValueChange={(value) => setValue('type', value as any)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="apartment">Apartamento</SelectItem>
                <SelectItem value="house">Casa</SelectItem>
                <SelectItem value="commercial">Comercial</SelectItem>
                <SelectItem value="land">Terreno</SelectItem>
                <SelectItem value="other">Outro</SelectItem>
              </SelectContent>
            </Select>
            {errors.type && (
              <p className="text-sm text-danger-600 mt-1">{errors.type.message}</p>
            )}
          </div>

          <div>
            <Label htmlFor="thumbnail">Foto do Imóvel</Label>
            <p className="text-xs text-neutral-600 mb-3">
              Adicione uma foto de destaque (máx. 5MB)
            </p>

            {thumbnailPreview ? (
              <div className="relative w-full aspect-video rounded-lg overflow-hidden border-2 border-neutral-200 bg-neutral-50">
                <Image
                  src={thumbnailPreview}
                  alt="Thumbnail preview"
                  fill
                  className="object-cover"
                  unoptimized
                />
                <button
                  type="button"
                  onClick={removeThumbnail}
                  className="absolute top-2 right-2 bg-danger-600 hover:bg-danger-700 text-white rounded-full p-2 transition-colors"
                  aria-label="Remover imagem"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            ) : (
              <label
                htmlFor="thumbnail"
                className="flex flex-col items-center justify-center w-full aspect-video rounded-lg border-2 border-dashed border-neutral-300 hover:border-primary-400 bg-neutral-50 hover:bg-primary-50 cursor-pointer transition-all"
              >
                <div className="flex flex-col items-center justify-center py-8">
                  <ImageIcon className="h-12 w-12 text-neutral-400 mb-3" />
                  <p className="text-sm text-neutral-600 mb-1">
                    <span className="font-semibold text-primary-600">Clique para fazer upload</span>
                  </p>
                  <p className="text-xs text-neutral-500">PNG, JPG até 5MB</p>
                </div>
                <input
                  id="thumbnail"
                  type="file"
                  accept="image/*"
                  onChange={handleThumbnailChange}
                  className="hidden"
                />
              </label>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Address */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MapPin className="h-5 w-5" />
            Endereço
          </CardTitle>
          <CardDescription>
            Localização do imóvel
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="address">Endereço Completo *</Label>
            <Input
              id="address"
              {...register('address')}
              placeholder="Rua, número, complemento"
            />
            {errors.address && (
              <p className="text-sm text-danger-600 mt-1">{errors.address.message}</p>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label htmlFor="city">Cidade</Label>
              <Input
                id="city"
                {...register('city')}
                placeholder="São Paulo"
              />
            </div>

            <div>
              <Label htmlFor="state">Estado</Label>
              <Input
                id="state"
                {...register('state')}
                placeholder="SP"
                maxLength={2}
              />
            </div>

            <div>
              <Label htmlFor="zip_code">CEP</Label>
              <Input
                id="zip_code"
                {...register('zip_code')}
                placeholder="00000-000"
                maxLength={9}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Property Details */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Home className="h-5 w-5" />
            Características
          </CardTitle>
          <CardDescription>
            Detalhes do imóvel
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label htmlFor="bedrooms">Quartos</Label>
              <Input
                id="bedrooms"
                type="number"
                min="0"
                {...register('bedrooms')}
                placeholder="0"
              />
            </div>

            <div>
              <Label htmlFor="bathrooms">Banheiros</Label>
              <Input
                id="bathrooms"
                type="number"
                min="0"
                {...register('bathrooms')}
                placeholder="0"
              />
            </div>

            <div>
              <Label htmlFor="area">Área (m²)</Label>
              <Input
                id="area"
                type="number"
                min="0"
                step="0.01"
                {...register('area')}
                placeholder="0"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="floor">Andar</Label>
              <Input
                id="floor"
                type="number"
                {...register('floor')}
                placeholder="0"
              />
            </div>

            <div>
              <Label htmlFor="parking_spaces">Vagas de Garagem</Label>
              <Input
                id="parking_spaces"
                type="number"
                min="0"
                {...register('parking_spaces')}
                placeholder="0"
              />
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="has_elevator"
                checked={watch('has_elevator')}
                onCheckedChange={(checked) => setValue('has_elevator', checked as boolean)}
              />
              <Label htmlFor="has_elevator" className="cursor-pointer">
                Possui elevador
              </Label>
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="is_furnished"
                checked={watch('is_furnished')}
                onCheckedChange={(checked) => setValue('is_furnished', checked as boolean)}
              />
              <Label htmlFor="is_furnished" className="cursor-pointer">
                Mobiliado
              </Label>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Additional Notes */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Observações
          </CardTitle>
          <CardDescription>
            Informações adicionais (opcional)
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Textarea
            {...register('notes')}
            placeholder="Digite observações sobre o imóvel..."
            rows={4}
          />
        </CardContent>
      </Card>

      {/* Actions */}
      <div className="flex gap-4 justify-end">
        <Button
          type="button"
          variant="outline"
          onClick={() => router.back()}
          disabled={isSubmitting}
        >
          Cancelar
        </Button>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {property ? 'Salvar Alterações' : 'Criar Imóvel'}
        </Button>
      </div>
    </form>
  )
}

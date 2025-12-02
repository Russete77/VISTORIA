'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Save, Loader2, AlertCircle, Calendar as CalendarIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { toast } from 'sonner'
import { format } from 'date-fns'
import type { Inspection } from '@/types/database'

export default function EditInspectionPage() {
  const params = useParams()
  const router = useRouter()
  const inspectionId = params.id as string

  const [inspection, setInspection] = useState<Inspection | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Form state
  const [formData, setFormData] = useState({
    inspector_name: '',
    inspector_email: '',
    tenant_name: '',
    tenant_email: '',
    landlord_name: '',
    landlord_email: '',
    scheduled_date: '',
    notes: '',
  })

  useEffect(() => {
    fetchInspection()
  }, [inspectionId])

  const fetchInspection = async () => {
    try {
      setIsLoading(true)
      const response = await fetch(`/api/inspections/${inspectionId}`, {
        credentials: 'include',
      })

      if (!response.ok) {
        throw new Error('Vistoria não encontrada')
      }

      const data = await response.json()
      const insp = data.inspection

      setInspection(insp)

      // Populate form with existing data
      setFormData({
        inspector_name: insp.inspector_name || '',
        inspector_email: insp.inspector_email || '',
        tenant_name: insp.tenant_name || '',
        tenant_email: insp.tenant_email || '',
        landlord_name: insp.landlord_name || '',
        landlord_email: insp.landlord_email || '',
        scheduled_date: insp.scheduled_date ? format(new Date(insp.scheduled_date), "yyyy-MM-dd'T'HH:mm") : '',
        notes: insp.notes || '',
      })
    } catch (err) {
      console.error('Error fetching inspection:', err)
      setError(err instanceof Error ? err.message : 'Erro ao carregar vistoria')
      toast.error('Erro ao carregar vistoria')
    } finally {
      setIsLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    // Validate required fields
    if (!formData.inspector_name.trim()) {
      toast.error('Nome do vistoriador é obrigatório')
      return
    }

    // Validate email formats if provided
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (formData.inspector_email && !emailRegex.test(formData.inspector_email)) {
      toast.error('E-mail do vistoriador inválido')
      return
    }
    if (formData.tenant_email && !emailRegex.test(formData.tenant_email)) {
      toast.error('E-mail do locatário inválido')
      return
    }
    if (formData.landlord_email && !emailRegex.test(formData.landlord_email)) {
      toast.error('E-mail do proprietário inválido')
      return
    }

    setIsSaving(true)

    try {
      // Prepare data for submission
      const updateData = {
        inspector_name: formData.inspector_name.trim(),
        inspector_email: formData.inspector_email.trim() || null,
        tenant_name: formData.tenant_name.trim() || null,
        tenant_email: formData.tenant_email.trim() || null,
        landlord_name: formData.landlord_name.trim() || null,
        landlord_email: formData.landlord_email.trim() || null,
        scheduled_date: formData.scheduled_date ? new Date(formData.scheduled_date).toISOString() : null,
        notes: formData.notes.trim() || null,
      }

      const response = await fetch(`/api/inspections/${inspectionId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(updateData),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Erro ao atualizar vistoria')
      }

      toast.success('Vistoria atualizada com sucesso!')
      router.push(`/dashboard/inspections/${inspectionId}`)
    } catch (err) {
      console.error('Error updating inspection:', err)
      toast.error('Erro ao atualizar vistoria', {
        description: err instanceof Error ? err.message : 'Tente novamente',
      })
    } finally {
      setIsSaving(false)
    }
  }

  const handleCancel = () => {
    router.push(`/dashboard/inspections/${inspectionId}`)
  }

  if (isLoading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Carregando vistoria...</p>
          </div>
        </div>
      </div>
    )
  }

  if (error || !inspection) {
    return (
      <div className="container mx-auto p-6">
        <Card className="border-destructive">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-destructive">
              <AlertCircle className="h-5 w-5" />
              Erro ao carregar vistoria
            </CardTitle>
            <CardDescription>{error || 'Vistoria não encontrada'}</CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={() => router.push('/dashboard/inspections')}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Voltar para Vistorias
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={handleCancel}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold">Editar Vistoria</h1>
            <p className="text-muted-foreground">
              Vistoria #{inspection.id.slice(0, 8)}
            </p>
          </div>
        </div>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit}>
        <Card>
          <CardHeader>
            <CardTitle>Informações da Vistoria</CardTitle>
            <CardDescription>
              Edite os dados da vistoria. Tipo e propriedade não podem ser alterados.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Vistoriador Section */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold border-b pb-2">Vistoriador</h3>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="inspector_name">
                    Nome do Vistoriador <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="inspector_name"
                    type="text"
                    value={formData.inspector_name}
                    onChange={(e) => setFormData({ ...formData, inspector_name: e.target.value })}
                    placeholder="João Silva"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="inspector_email">E-mail do Vistoriador</Label>
                  <Input
                    id="inspector_email"
                    type="email"
                    value={formData.inspector_email}
                    onChange={(e) => setFormData({ ...formData, inspector_email: e.target.value })}
                    placeholder="joao@exemplo.com"
                  />
                </div>
              </div>
            </div>

            {/* Locatário Section */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold border-b pb-2">Locatário</h3>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="tenant_name">Nome do Locatário</Label>
                  <Input
                    id="tenant_name"
                    type="text"
                    value={formData.tenant_name}
                    onChange={(e) => setFormData({ ...formData, tenant_name: e.target.value })}
                    placeholder="Maria Santos"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="tenant_email">E-mail do Locatário</Label>
                  <Input
                    id="tenant_email"
                    type="email"
                    value={formData.tenant_email}
                    onChange={(e) => setFormData({ ...formData, tenant_email: e.target.value })}
                    placeholder="maria@exemplo.com"
                  />
                </div>
              </div>
            </div>

            {/* Proprietário Section */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold border-b pb-2">Proprietário</h3>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="landlord_name">Nome do Proprietário</Label>
                  <Input
                    id="landlord_name"
                    type="text"
                    value={formData.landlord_name}
                    onChange={(e) => setFormData({ ...formData, landlord_name: e.target.value })}
                    placeholder="Carlos Oliveira"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="landlord_email">E-mail do Proprietário</Label>
                  <Input
                    id="landlord_email"
                    type="email"
                    value={formData.landlord_email}
                    onChange={(e) => setFormData({ ...formData, landlord_email: e.target.value })}
                    placeholder="carlos@exemplo.com"
                  />
                </div>
              </div>
            </div>

            {/* Agendamento Section */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold border-b pb-2">Agendamento</h3>

              <div className="space-y-2">
                <Label htmlFor="scheduled_date">
                  <CalendarIcon className="h-4 w-4 inline mr-2" />
                  Data Agendada
                </Label>
                <Input
                  id="scheduled_date"
                  type="datetime-local"
                  value={formData.scheduled_date}
                  onChange={(e) => setFormData({ ...formData, scheduled_date: e.target.value })}
                />
              </div>
            </div>

            {/* Observações Section */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold border-b pb-2">Observações</h3>

              <div className="space-y-2">
                <Label htmlFor="notes">Observações Gerais</Label>
                <Textarea
                  id="notes"
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  placeholder="Adicione observações gerais sobre a vistoria..."
                  rows={5}
                  maxLength={2000}
                />
                <p className="text-sm text-muted-foreground">
                  {formData.notes.length} / 2000 caracteres
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Actions */}
        <div className="flex items-center justify-end gap-3 mt-6">
          <Button
            type="button"
            variant="outline"
            onClick={handleCancel}
            disabled={isSaving}
          >
            Cancelar
          </Button>
          <Button type="submit" disabled={isSaving}>
            {isSaving ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Salvando...
              </>
            ) : (
              <>
                <Save className="h-4 w-4 mr-2" />
                Salvar Alterações
              </>
            )}
          </Button>
        </div>
      </form>
    </div>
  )
}

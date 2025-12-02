/**
 * New Comparison Page - VistorIA Pro
 * Wizard multi-step para criar nova comparação
 * Steps: 1. Selecionar Propriedade -> 2. Vistoria de Entrada -> 3. Vistoria de Saída -> 4. Revisar e Confirmar
 */

'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { GitCompare, ArrowLeft, ArrowRight, Check, Loader2, AlertCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Breadcrumbs } from '@/components/ui/breadcrumbs'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { useProperties } from '@/hooks/use-properties'
import { useInspections } from '@/hooks/use-inspections'
import { useComparisons } from '@/hooks/use-comparisons'
import { toast } from 'sonner'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import type { Property, Inspection } from '@/types/database'

interface FormData {
  propertyId: string
  moveInInspectionId: string
  moveOutInspectionId: string
}

export default function NewComparisonPage() {
  const router = useRouter()
  const { properties, isLoading: isLoadingProperties } = useProperties()
  const [currentStep, setCurrentStep] = useState(1)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [formData, setFormData] = useState<FormData>({
    propertyId: '',
    moveInInspectionId: '',
    moveOutInspectionId: '',
  })

  // Buscar vistorias da propriedade selecionada
  const { inspections, isLoading: isLoadingInspections } = useInspections({
    autoFetch: !!formData.propertyId,
    propertyId: formData.propertyId,
  })

  const { createComparison } = useComparisons({ autoFetch: false })

  const totalSteps = 4

  const updateFormData = (field: keyof FormData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  const canProceedFromStep = (step: number): boolean => {
    switch (step) {
      case 1:
        return !!formData.propertyId
      case 2:
        return !!formData.moveInInspectionId
      case 3:
        return !!formData.moveOutInspectionId
      case 4:
        return true
      default:
        return false
    }
  }

  const handleNext = () => {
    if (canProceedFromStep(currentStep) && currentStep < totalSteps) {
      setCurrentStep(currentStep + 1)
    }
  }

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1)
    }
  }

  const handleSubmit = async () => {
    if (!canProceedFromStep(currentStep)) {
      toast.error('Preencha todos os campos obrigatórios')
      return
    }

    setIsSubmitting(true)

    try {
      const comparison = await createComparison({
        property_id: formData.propertyId,
        move_in_inspection_id: formData.moveInInspectionId,
        move_out_inspection_id: formData.moveOutInspectionId,
      })

      toast.success('Comparação criada com sucesso!', {
        description: 'Redirecionando...',
      })

      setTimeout(() => {
        router.push(`/dashboard/comparisons/${comparison.id}`)
      }, 1000)
    } catch (error) {
      console.error('Error creating comparison:', error)
      setIsSubmitting(false)
    }
  }

  // Filtrar vistorias por tipo
  const moveInInspections = inspections.filter((i) => i.type === 'move_in')
  const moveOutInspections = inspections.filter((i) => i.type === 'move_out')

  // Obter propriedade selecionada
  const selectedProperty = properties.find((p) => p.id === formData.propertyId)
  const selectedMoveIn = inspections.find((i) => i.id === formData.moveInInspectionId)
  const selectedMoveOut = inspections.find((i) => i.id === formData.moveOutInspectionId)

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <Breadcrumbs
          items={[
            { label: 'Dashboard', href: '/dashboard' },
            { label: 'Comparações', href: '/dashboard/comparisons' },
            { label: 'Nova Comparação' },
          ]}
        />
        <div className="flex items-center gap-3 mt-4">
          <div className="flex items-center justify-center w-12 h-12 rounded-lg bg-primary/10">
            <GitCompare className="w-6 h-6 text-primary" />
          </div>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Nova Comparação</h1>
            <p className="text-muted-foreground">
              Compare vistorias de entrada e saída com IA
            </p>
          </div>
        </div>
      </div>

      {/* Progress */}
      <div className="flex items-center justify-between">
        {[1, 2, 3, 4].map((step) => (
          <div key={step} className="flex items-center flex-1">
            <div
              className={`flex items-center justify-center w-10 h-10 rounded-full border-2 ${
                step <= currentStep
                  ? 'border-primary bg-primary text-primary-foreground'
                  : 'border-muted bg-background text-muted-foreground'
              }`}
            >
              {step < currentStep ? (
                <Check className="w-5 h-5" />
              ) : (
                <span className="text-sm font-semibold">{step}</span>
              )}
            </div>
            {step < 4 && (
              <div
                className={`flex-1 h-0.5 mx-2 ${
                  step < currentStep ? 'bg-primary' : 'bg-muted'
                }`}
              />
            )}
          </div>
        ))}
      </div>

      {/* Step Content */}
      <Card>
        <CardHeader>
          <CardTitle>
            {currentStep === 1 && 'Selecione a Propriedade'}
            {currentStep === 2 && 'Vistoria de Entrada'}
            {currentStep === 3 && 'Vistoria de Saída'}
            {currentStep === 4 && 'Revisar e Confirmar'}
          </CardTitle>
          <CardDescription>
            {currentStep === 1 && 'Escolha o imóvel que deseja comparar'}
            {currentStep === 2 && 'Selecione a vistoria realizada na ENTRADA do inquilino'}
            {currentStep === 3 && 'Selecione a vistoria realizada na SAÍDA do inquilino'}
            {currentStep === 4 && 'Revise os dados antes de criar a comparação'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {/* Step 1: Selecionar Propriedade */}
          {currentStep === 1 && (
            <RadioGroup
              value={formData.propertyId}
              onValueChange={(value) => {
                updateFormData('propertyId', value)
                // Resetar seleções de vistorias quando mudar propriedade
                updateFormData('moveInInspectionId', '')
                updateFormData('moveOutInspectionId', '')
              }}
            >
              {isLoadingProperties ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
                </div>
              ) : properties.length === 0 ? (
                <div className="text-center py-12">
                  <AlertCircle className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
                  <p className="text-muted-foreground mb-4">Você ainda não possui propriedades cadastradas</p>
                  <Button asChild>
                    <Link href="/dashboard/properties/new">Cadastrar Propriedade</Link>
                  </Button>
                </div>
              ) : (
                <div className="space-y-3">
                  {properties.map((property) => (
                    <div key={property.id} className="flex items-center space-x-3 border rounded-lg p-4 cursor-pointer hover:bg-accent">
                      <RadioGroupItem value={property.id} id={property.id} />
                      <Label htmlFor={property.id} className="flex-1 cursor-pointer">
                        <div className="font-medium">{property.name}</div>
                        <div className="text-sm text-muted-foreground">{property.address}</div>
                      </Label>
                    </div>
                  ))}
                </div>
              )}
            </RadioGroup>
          )}

          {/* Step 2: Selecionar Vistoria de Entrada */}
          {currentStep === 2 && (
            <RadioGroup
              value={formData.moveInInspectionId}
              onValueChange={(value) => updateFormData('moveInInspectionId', value)}
            >
              {isLoadingInspections ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
                </div>
              ) : moveInInspections.length === 0 ? (
                <div className="text-center py-12">
                  <AlertCircle className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
                  <p className="text-muted-foreground mb-2">
                    Nenhuma vistoria de entrada encontrada para este imóvel
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Crie uma vistoria de entrada primeiro para poder comparar
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {moveInInspections.map((inspection) => (
                    <div key={inspection.id} className="flex items-start space-x-3 border rounded-lg p-4 cursor-pointer hover:bg-accent transition-colors">
                      <RadioGroupItem value={inspection.id} id={inspection.id} className="mt-1" />
                      <Label htmlFor={inspection.id} className="flex-1 cursor-pointer">
                        <div className="space-y-3">
                          {/* Header com badges */}
                          <div className="flex items-center justify-between flex-wrap gap-2">
                            <Badge variant="outline" className="bg-green-100 text-green-700 border-green-300">
                              Entrada
                            </Badge>
                            <Badge
                              variant={inspection.status === 'completed' ? 'success' : 'warning'}
                              className={
                                inspection.status === 'completed'
                                  ? 'bg-green-600 text-white'
                                  : 'bg-yellow-100 text-yellow-800'
                              }
                            >
                              {inspection.status === 'completed' ? 'Concluída' :
                               inspection.status === 'in_progress' ? 'Em Andamento' :
                               inspection.status === 'draft' ? 'Rascunho' : inspection.status}
                            </Badge>
                          </div>

                          {/* Data GRANDE e visível */}
                          <div className="text-lg font-bold text-foreground">
                            {format(new Date(inspection.created_at), "dd/MM/yyyy 'às' HH:mm")}
                          </div>

                          {/* Informações adicionais */}
                          <div className="space-y-1 text-sm text-muted-foreground">
                            {inspection.tenant_name && (
                              <div className="flex items-center gap-2">
                                <span className="font-medium text-foreground">Locatário:</span>
                                <span>{inspection.tenant_name}</span>
                              </div>
                            )}
                            {inspection.inspector_name && (
                              <div className="flex items-center gap-2">
                                <span className="font-medium text-foreground">Vistoriador:</span>
                                <span>{inspection.inspector_name}</span>
                              </div>
                            )}
                            <div className="flex items-center gap-2">
                              <span className="font-medium text-foreground">Fotos:</span>
                              <span className={inspection.photos_count && inspection.photos_count > 0 ? 'text-green-600 font-medium' : 'text-orange-600'}>
                                {inspection.photos_count || 0}
                                {(!inspection.photos_count || inspection.photos_count === 0) && ' ⚠️ Nenhuma foto'}
                              </span>
                            </div>
                            {inspection.scheduled_date && (
                              <div className="flex items-center gap-2">
                                <span className="font-medium text-foreground">Agendada:</span>
                                <span>{format(new Date(inspection.scheduled_date), 'dd/MM/yyyy')}</span>
                              </div>
                            )}
                          </div>
                        </div>
                      </Label>
                    </div>
                  ))}
                </div>
              )}
            </RadioGroup>
          )}

          {/* Step 3: Selecionar Vistoria de Saída */}
          {currentStep === 3 && (
            <RadioGroup
              value={formData.moveOutInspectionId}
              onValueChange={(value) => updateFormData('moveOutInspectionId', value)}
            >
              {isLoadingInspections ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
                </div>
              ) : moveOutInspections.length === 0 ? (
                <div className="text-center py-12">
                  <AlertCircle className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
                  <p className="text-muted-foreground mb-2">
                    Nenhuma vistoria de saída encontrada para este imóvel
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Crie uma vistoria de saída primeiro para poder comparar
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {moveOutInspections.map((inspection) => (
                    <div key={inspection.id} className="flex items-start space-x-3 border rounded-lg p-4 cursor-pointer hover:bg-accent transition-colors">
                      <RadioGroupItem value={inspection.id} id={inspection.id} className="mt-1" />
                      <Label htmlFor={inspection.id} className="flex-1 cursor-pointer">
                        <div className="space-y-3">
                          {/* Header com badges */}
                          <div className="flex items-center justify-between flex-wrap gap-2">
                            <Badge variant="outline" className="bg-orange-100 text-orange-700 border-orange-300">
                              Saída
                            </Badge>
                            <Badge
                              variant={inspection.status === 'completed' ? 'success' : 'warning'}
                              className={
                                inspection.status === 'completed'
                                  ? 'bg-green-600 text-white'
                                  : 'bg-yellow-100 text-yellow-800'
                              }
                            >
                              {inspection.status === 'completed' ? 'Concluída' :
                               inspection.status === 'in_progress' ? 'Em Andamento' :
                               inspection.status === 'draft' ? 'Rascunho' : inspection.status}
                            </Badge>
                          </div>

                          {/* Data GRANDE e visível */}
                          <div className="text-lg font-bold text-foreground">
                            {format(new Date(inspection.created_at), "dd/MM/yyyy 'às' HH:mm")}
                          </div>

                          {/* Informações adicionais */}
                          <div className="space-y-1 text-sm text-muted-foreground">
                            {inspection.tenant_name && (
                              <div className="flex items-center gap-2">
                                <span className="font-medium text-foreground">Locatário:</span>
                                <span>{inspection.tenant_name}</span>
                              </div>
                            )}
                            {inspection.inspector_name && (
                              <div className="flex items-center gap-2">
                                <span className="font-medium text-foreground">Vistoriador:</span>
                                <span>{inspection.inspector_name}</span>
                              </div>
                            )}
                            <div className="flex items-center gap-2">
                              <span className="font-medium text-foreground">Fotos:</span>
                              <span className={inspection.photos_count && inspection.photos_count > 0 ? 'text-green-600 font-medium' : 'text-orange-600'}>
                                {inspection.photos_count || 0}
                                {(!inspection.photos_count || inspection.photos_count === 0) && ' ⚠️ Nenhuma foto'}
                              </span>
                            </div>
                            {inspection.scheduled_date && (
                              <div className="flex items-center gap-2">
                                <span className="font-medium text-foreground">Agendada:</span>
                                <span>{format(new Date(inspection.scheduled_date), 'dd/MM/yyyy')}</span>
                              </div>
                            )}
                          </div>
                        </div>
                      </Label>
                    </div>
                  ))}
                </div>
              )}
            </RadioGroup>
          )}

          {/* Step 4: Revisar */}
          {currentStep === 4 && (
            <div className="space-y-6">
              <div className="rounded-lg border p-4">
                <h3 className="font-semibold mb-3">Resumo da Comparação</h3>
                <div className="space-y-3">
                  <div>
                    <Label className="text-muted-foreground">Propriedade</Label>
                    <p className="font-medium">{selectedProperty?.name}</p>
                    <p className="text-sm text-muted-foreground">{selectedProperty?.address}</p>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label className="text-muted-foreground">Vistoria de Entrada</Label>
                      <p className="font-medium">
                        {selectedMoveIn ? format(new Date(selectedMoveIn.created_at), "dd/MM/yyyy") : '-'}
                      </p>
                    </div>
                    <div>
                      <Label className="text-muted-foreground">Vistoria de Saída</Label>
                      <p className="font-medium">
                        {selectedMoveOut ? format(new Date(selectedMoveOut.created_at), "dd/MM/yyyy") : '-'}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="rounded-lg border border-blue-200 bg-blue-50 p-4">
                <div className="flex gap-3">
                  <AlertCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <p className="font-medium text-blue-900 mb-1">Como funciona a comparação?</p>
                    <ul className="text-sm text-blue-800 space-y-1">
                      <li>• Nossa IA comparará as fotos dos mesmos cômodos</li>
                      <li>• Identificará diferenças, danos novos e desgaste natural</li>
                      <li>• Estimará o custo de reparo para cada dano</li>
                      <li>• O processamento leva alguns minutos</li>
                      <li>• Custo: 1 crédito</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Actions */}
      <div className="flex items-center justify-between">
        <Button
          variant="outline"
          onClick={handleBack}
          disabled={currentStep === 1 || isSubmitting}
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Voltar
        </Button>

        {currentStep < totalSteps ? (
          <Button
            onClick={handleNext}
            disabled={!canProceedFromStep(currentStep)}
          >
            Próximo
            <ArrowRight className="w-4 h-4 ml-2" />
          </Button>
        ) : (
          <Button
            onClick={handleSubmit}
            disabled={isSubmitting || !canProceedFromStep(currentStep)}
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Criando...
              </>
            ) : (
              <>
                <Check className="w-4 h-4 mr-2" />
                Criar Comparação
              </>
            )}
          </Button>
        )}
      </div>
    </div>
  )
}

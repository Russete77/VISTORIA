'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Camera, Download, FileText, MapPin, Calendar, User, AlertCircle, Loader2, Edit } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { toast } from 'sonner'
import type { Inspection, Property, InspectionPhoto, PhotoProblem } from '@/types/database'

interface InspectionWithDetails extends Inspection {
  property: Property
  photos: Array<InspectionPhoto & { problems: PhotoProblem[] }>
}

export default function InspectionDetailsPage() {
  const params = useParams()
  const router = useRouter()
  const inspectionId = params.id as string

  const [inspection, setInspection] = useState<InspectionWithDetails | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false)

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
        throw new Error('Failed to fetch inspection')
      }

      const data = await response.json()
      setInspection(data.inspection)
    } catch (err) {
      console.error('Error fetching inspection:', err)
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setIsLoading(false)
    }
  }

  const handleGeneratePDF = async () => {
    try {
      setIsGeneratingPDF(true)
      const response = await fetch(`/api/inspections/${inspectionId}/generate-report`, {
        method: 'POST',
        credentials: 'include',
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to generate report')
      }

      const data = await response.json()

      toast.success('Laudo PDF gerado com sucesso!')

      // Update inspection with report URL
      if (inspection) {
        setInspection({ ...inspection, report_url: data.report_url })
      }

      // Download the PDF
      window.open(data.report_url, '_blank')
    } catch (err) {
      console.error('Error generating PDF:', err)
      toast.error('Erro ao gerar laudo PDF', {
        description: err instanceof Error ? err.message : 'Tente novamente',
      })
    } finally {
      setIsGeneratingPDF(false)
    }
  }


  const getStatusColor = (status: string) => {
    const colors = {
      draft: 'bg-gray-500',
      in_progress: 'bg-blue-500',
      completed: 'bg-green-500',
      signed: 'bg-purple-500',
    }
    return colors[status as keyof typeof colors] || 'bg-gray-500'
  }

  const getStatusLabel = (status: string) => {
    const labels = {
      draft: 'Rascunho',
      in_progress: 'Em Andamento',
      completed: 'Concluída',
      signed: 'Assinada',
    }
    return labels[status as keyof typeof labels] || status
  }

  const getTypeLabel = (type: string) => {
    const labels = {
      move_in: 'Entrada',
      move_out: 'Saída',
      periodic: 'Periódica',
    }
    return labels[type as keyof typeof labels] || type
  }

  if (isLoading) {
    return (
      <div className="px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
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
      <div className="px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
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
    <div className="px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex items-start sm:items-center gap-3 sm:gap-4">
          <Button variant="ghost" size="icon" onClick={() => router.back()} className="shrink-0">
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="min-w-0">
            <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold truncate">
              Vistoria #{inspection.id.slice(0, 8)}
            </h1>
            <p className="text-sm sm:text-base text-muted-foreground truncate">
              {inspection.property.name} - {inspection.property.address}
            </p>
          </div>
        </div>
        <div className="flex flex-wrap gap-2 sm:gap-3">
          <Button variant="outline" asChild size="sm" className="sm:size-default">
            <Link href={`/dashboard/inspections/${inspection.id}/edit`}>
              <Edit className="h-4 w-4 sm:mr-2" />
              <span className="hidden sm:inline">Editar Vistoria</span>
            </Link>
          </Button>
          {inspection.status !== 'completed' && inspection.status !== 'signed' && (
            <Button asChild size="sm" className="sm:size-default">
              <Link href={`/dashboard/inspections/${inspection.id}/capture`}>
                <Camera className="h-4 w-4 sm:mr-2" />
                <span className="hidden sm:inline">Capturar Fotos</span>
              </Link>
            </Button>
          )}
          {inspection.report_url && (
            <Button variant="outline" asChild size="sm" className="sm:size-default">
              <a href={inspection.report_url} target="_blank" rel="noopener noreferrer">
                <Download className="h-4 w-4 sm:mr-2" />
                <span className="hidden sm:inline">Baixar Laudo</span>
              </a>
            </Button>
          )}
          {inspection.status === 'completed' && !inspection.report_url && (
            <Button variant="default" onClick={handleGeneratePDF} disabled={isGeneratingPDF} size="sm" className="sm:size-default">
              {isGeneratingPDF ? (
                <Loader2 className="h-4 w-4 sm:mr-2 animate-spin" />
              ) : (
                <FileText className="h-4 w-4 sm:mr-2" />
              )}
              <span className="hidden sm:inline">{isGeneratingPDF ? 'Gerando...' : 'Gerar Laudo PDF'}</span>
              <span className="sm:hidden">{isGeneratingPDF ? '...' : 'PDF'}</span>
            </Button>
          )}
        </div>
      </div>

      {/* Info Cards */}
      <div className="grid gap-4 sm:gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Status</CardTitle>
          </CardHeader>
          <CardContent>
            <Badge className={getStatusColor(inspection.status)}>
              {getStatusLabel(inspection.status)}
            </Badge>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Tipo</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{getTypeLabel(inspection.type)}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Problemas Encontrados</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-1">
              <p className="text-2xl font-bold">{inspection.total_problems}</p>
              <div className="flex gap-2 text-sm">
                <span className="text-red-500">🔴 {inspection.urgent_problems}</span>
                <span className="text-orange-500">🟠 {inspection.high_problems}</span>
                <span className="text-yellow-500">🟡 {inspection.medium_problems}</span>
                <span className="text-green-500">🟢 {inspection.low_problems}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="details" className="space-y-6">
        <TabsList>
          <TabsTrigger value="details">Detalhes</TabsTrigger>
          <TabsTrigger value="photos">
            Fotos ({inspection.photos?.length || 0})
          </TabsTrigger>
          <TabsTrigger value="problems">
            Problemas ({inspection.total_problems})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="details" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Informações da Vistoria</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-6">
                {/* Data Agendada */}
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Calendar className="h-4 w-4" />
                    <span>Data Agendada</span>
                  </div>
                  <p className="font-medium">
                    {inspection.scheduled_date
                      ? new Date(inspection.scheduled_date).toLocaleDateString('pt-BR')
                      : 'Não agendada'}
                  </p>
                </div>

                {/* Participantes */}
                <div className="space-y-4">
                  <h3 className="text-sm font-semibold text-neutral-900 border-b pb-2">
                    Participantes
                  </h3>

                  {/* Vistoriador */}
                  <div className="space-y-2 pl-4 border-l-4 border-primary-600">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <User className="h-4 w-4" />
                      <span className="font-medium">Vistoriador</span>
                    </div>
                    <p className="font-medium">{inspection.inspector_name || 'Não informado'}</p>
                    {inspection.inspector_email && (
                      <p className="text-sm text-muted-foreground">{inspection.inspector_email}</p>
                    )}
                  </div>

                  {/* Locatário */}
                  <div className="space-y-2 pl-4 border-l-4 border-blue-500">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <User className="h-4 w-4" />
                      <span className="font-medium">Locatário</span>
                    </div>
                    <p className="font-medium">{inspection.tenant_name || 'Não informado'}</p>
                    {inspection.tenant_email && (
                      <p className="text-sm text-muted-foreground">{inspection.tenant_email}</p>
                    )}
                  </div>

                  {/* Proprietário */}
                  <div className="space-y-2 pl-4 border-l-4 border-amber-500">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <User className="h-4 w-4" />
                      <span className="font-medium">Proprietário</span>
                    </div>
                    <p className="font-medium">{inspection.landlord_name || 'Não informado'}</p>
                    {inspection.landlord_email && (
                      <p className="text-sm text-muted-foreground">{inspection.landlord_email}</p>
                    )}
                  </div>
                </div>
              </div>

              {inspection.notes && (
                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground">Observações</p>
                  <p className="text-sm">{inspection.notes}</p>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Propriedade</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-start gap-3">
                <MapPin className="h-5 w-5 text-muted-foreground mt-0.5" />
                <div>
                  <p className="font-medium">{inspection.property.name}</p>
                  <p className="text-sm text-muted-foreground">
                    {inspection.property.address}, {inspection.property.city} - {inspection.property.state}
                  </p>
                  {inspection.property.zip_code && (
                    <p className="text-sm text-muted-foreground">CEP: {inspection.property.zip_code}</p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="photos" className="space-y-6">
          {inspection.photos && inspection.photos.length > 0 ? (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {inspection.photos.map((photo: any) => (
                <Card key={photo.id}>
                  <CardContent className="p-4">
                    <img
                      src={photo.photo_url}
                      alt={photo.room_name}
                      className="w-full h-48 object-cover rounded-lg mb-3"
                      loading="lazy"
                    />
                    <h3 className="font-medium mb-1">{photo.room_name}</h3>
                    {photo.ai_analyzed && (
                      <Badge variant={photo.ai_has_problems ? 'danger' : 'success'}>
                        {photo.ai_has_problems ? '⚠️ Problemas detectados' : '✅ OK'}
                      </Badge>
                    )}
                    {photo.problems && photo.problems.length > 0 && (
                      <p className="text-sm text-muted-foreground mt-2">
                        {photo.problems.length} problema(s)
                      </p>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <Camera className="h-12 w-12 text-muted-foreground mb-4" />
                <p className="text-muted-foreground mb-4">Nenhuma foto capturada ainda</p>
                <Button asChild>
                  <Link href={`/dashboard/inspections/${inspection.id}/capture`}>
                    Capturar Fotos
                  </Link>
                </Button>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="problems" className="space-y-6">
          {inspection.photos && inspection.photos.some(p => p.problems && p.problems.length > 0) ? (
            <div className="space-y-4">
              {inspection.photos.map((photo) =>
                photo.problems && photo.problems.length > 0 ? (
                  <Card key={photo.id}>
                    <CardHeader>
                      <CardTitle className="text-base">{photo.room_name}</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      {photo.problems.map((problem) => (
                        <div
                          key={problem.id}
                          className="flex gap-3 p-3 bg-muted rounded-lg"
                        >
                          <div className="flex-1">
                            <p className="font-medium mb-1">{problem.description}</p>
                            {problem.location && (
                              <p className="text-sm text-muted-foreground mb-1">
                                Localização: {problem.location}
                              </p>
                            )}
                            {problem.suggested_action && (
                              <p className="text-sm text-blue-600">
                                💡 {problem.suggested_action}
                              </p>
                            )}
                          </div>
                          <Badge className={
                            problem.severity === 'urgent' ? 'bg-red-500' :
                            problem.severity === 'high' ? 'bg-orange-500' :
                            problem.severity === 'medium' ? 'bg-yellow-500' :
                            'bg-green-500'
                          }>
                            {problem.severity}
                          </Badge>
                        </div>
                      ))}
                    </CardContent>
                  </Card>
                ) : null
              )}
            </div>
          ) : (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <AlertCircle className="h-12 w-12 text-muted-foreground mb-4" />
                <p className="text-muted-foreground">Nenhum problema detectado</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}

'use client'

import { useState } from 'react'
import { Star, Send, X, Loader2, CheckCircle2, ArrowRight, ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'

interface AppSatisfactionSurveyProps {
  isOpen: boolean
  onClose: () => void
}

const FEATURES = [
  { id: 'ai_analysis', label: 'Análise de IA' },
  { id: 'comparisons', label: 'Comparações Entrada/Saída' },
  { id: 'pdfs', label: 'Geração de PDFs' },
  { id: 'disputes', label: 'Sistema de Disputas' },
  { id: 'team', label: 'Gerenciamento de Equipe' },
  { id: 'costs', label: 'Estimativa de Custos' },
  { id: 'mobile', label: 'App Mobile/PWA' },
  { id: 'other', label: 'Outros' },
] as const

export function AppSatisfactionSurvey({ isOpen, onClose }: AppSatisfactionSurveyProps) {
  const [step, setStep] = useState(1)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isSubmitted, setIsSubmitted] = useState(false)

  // Form state
  const [npsScore, setNpsScore] = useState<number | null>(null)
  const [npsHover, setNpsHover] = useState<number | null>(null)
  const [aiSatisfaction, setAiSatisfaction] = useState(0)
  const [aiHover, setAiHover] = useState(0)
  const [uxSatisfaction, setUxSatisfaction] = useState(0)
  const [uxHover, setUxHover] = useState(0)
  const [openFeedback, setOpenFeedback] = useState('')
  const [usefulFeatures, setUsefulFeatures] = useState<string[]>([])

  const totalSteps = 4

  const handleNpsClick = (score: number) => {
    setNpsScore(score)
  }

  const toggleFeature = (featureId: string) => {
    setUsefulFeatures(prev =>
      prev.includes(featureId)
        ? prev.filter(f => f !== featureId)
        : [...prev, featureId]
    )
  }

  const canProceed = () => {
    if (step === 1) return npsScore !== null
    if (step === 2) return aiSatisfaction > 0 && uxSatisfaction > 0
    if (step === 3) return true // Optional step
    if (step === 4) return true // Review step
    return false
  }

  const handleSubmit = async () => {
    if (npsScore === null) {
      toast.error('Por favor, complete todas as perguntas obrigatórias')
      return
    }

    setIsSubmitting(true)

    try {
      const response = await fetch('/api/satisfaction-survey', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          npsScore,
          aiSatisfaction: aiSatisfaction > 0 ? aiSatisfaction : undefined,
          uxSatisfaction: uxSatisfaction > 0 ? uxSatisfaction : undefined,
          openFeedback: openFeedback.trim() || undefined,
          usefulFeatures: usefulFeatures.length > 0 ? usefulFeatures : undefined,
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to submit survey')
      }

      setIsSubmitted(true)
      toast.success('Obrigado pelo seu feedback!')
      
      // Close after 2 seconds
      setTimeout(() => {
        onClose()
      }, 2000)
    } catch (error) {
      console.error('Error submitting survey:', error)
      toast.error(error instanceof Error ? error.message : 'Erro ao enviar pesquisa')
    } finally {
      setIsSubmitting(false)
    }
  }

  if (!isOpen) return null

  if (isSubmitted) {
    return (
      <>
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm" onClick={onClose} />
        <div className="fixed inset-x-4 top-1/2 -translate-y-1/2 z-50 max-w-md mx-auto bg-white rounded-2xl shadow-2xl p-8 text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100 text-emerald-600 mx-auto mb-4">
            <CheckCircle2 className="h-8 w-8" />
          </div>
          <h3 className="text-xl font-semibold text-neutral-900 mb-2">
            Obrigado!
          </h3>
          <p className="text-neutral-600">
            Seu feedback é muito importante para nós.
          </p>
        </div>
      </>
    )
  }

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm" onClick={onClose} />

      {/* Modal */}
      <div className="fixed inset-x-4 top-1/2 -translate-y-1/2 z-50 max-w-lg mx-auto bg-white rounded-2xl shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-100 bg-neutral-50">
          <div>
            <h3 className="font-semibold text-neutral-900">Pesquisa de Satisfação</h3>
            <p className="text-xs text-neutral-500 mt-0.5">
              Passo {step} de {totalSteps}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-full hover:bg-neutral-200"
          >
            <X className="h-5 w-5 text-neutral-500" />
          </button>
        </div>

        {/* Progress bar */}
        <div className="h-1 bg-neutral-100">
          <div 
            className="h-full bg-primary-600 transition-all duration-300"
            style={{ width: `${(step / totalSteps) * 100}%` }}
          />
        </div>

        <div className="p-6">
          {/* Step 1: NPS Score */}
          {step === 1 && (
            <div className="space-y-4">
              <div>
                <h4 className="font-medium text-neutral-900 mb-2">
                  Qual a probabilidade de você recomendar o VistorIA Pro?
                </h4>
                <p className="text-sm text-neutral-600 mb-4">
                  0 = Não recomendaria, 10 = Com certeza recomendaria
                </p>
              </div>

              <div className="flex gap-2 flex-wrap justify-center">
                {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((score) => (
                  <button
                    key={score}
                    onClick={() => handleNpsClick(score)}
                    onMouseEnter={() => setNpsHover(score)}
                    onMouseLeave={() => setNpsHover(null)}
                    className={cn(
                      'h-12 w-12 rounded-lg font-semibold transition-all',
                      npsScore === score
                        ? 'bg-primary-600 text-white scale-110 shadow-md'
                        : (npsHover !== null && npsHover === score)
                        ? 'bg-primary-100 text-primary-700'
                        : 'bg-neutral-100 text-neutral-700 hover:bg-neutral-200'
                    )}
                  >
                    {score}
                  </button>
                ))}
              </div>

              <div className="flex justify-between text-xs text-neutral-500 mt-2">
                <span>Não recomendaria</span>
                <span>Com certeza</span>
              </div>
            </div>
          )}

          {/* Step 2: Satisfaction Ratings */}
          {step === 2 && (
            <div className="space-y-6">
              {/* AI Satisfaction */}
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-2">
                  Satisfação com as análises de IA
                </label>
                <div className="flex items-center gap-1 justify-center">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      onClick={() => setAiSatisfaction(star)}
                      onMouseEnter={() => setAiHover(star)}
                      onMouseLeave={() => setAiHover(0)}
                      className="p-1 transition-transform hover:scale-110"
                    >
                      <Star
                        className={cn(
                          'h-8 w-8 transition-colors',
                          (aiHover || aiSatisfaction) >= star
                            ? 'fill-amber-400 text-amber-400'
                            : 'text-neutral-300'
                        )}
                      />
                    </button>
                  ))}
                </div>
              </div>

              {/* UX Satisfaction */}
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-2">
                  Satisfação com a facilidade de uso
                </label>
                <div className="flex items-center gap-1 justify-center">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      onClick={() => setUxSatisfaction(star)}
                      onMouseEnter={() => setUxHover(star)}
                      onMouseLeave={() => setUxHover(0)}
                      className="p-1 transition-transform hover:scale-110"
                    >
                      <Star
                        className={cn(
                          'h-8 w-8 transition-colors',
                          (uxHover || uxSatisfaction) >= star
                            ? 'fill-amber-400 text-amber-400'
                            : 'text-neutral-300'
                        )}
                      />
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Step 3: Useful Features */}
          {step === 3 && (
            <div className="space-y-4">
              <div>
                <h4 className="font-medium text-neutral-900 mb-2">
                  Quais recursos você acha mais úteis?
                </h4>
                <p className="text-sm text-neutral-600 mb-4">
                  Selecione todos que se aplicam
                </p>
              </div>

              <div className="grid grid-cols-2 gap-2">
                {FEATURES.map((feature) => (
                  <button
                    key={feature.id}
                    onClick={() => toggleFeature(feature.id)}
                    className={cn(
                      'px-4 py-2.5 rounded-lg text-sm font-medium transition-all',
                      usefulFeatures.includes(feature.id)
                        ? 'bg-primary-100 text-primary-700 ring-1 ring-primary-300'
                        : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200'
                    )}
                  >
                    {feature.label}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Step 4: Open Feedback */}
          {step === 4 && (
            <div className="space-y-4">
              <div>
                <h4 className="font-medium text-neutral-900 mb-2">
                  O que podemos melhorar?
                </h4>
                <p className="text-sm text-neutral-600 mb-4">
                  Compartilhe suas sugestões (opcional)
                </p>
              </div>

              <Textarea
                value={openFeedback}
                onChange={(e) => setOpenFeedback(e.target.value)}
                placeholder="Descreva o que poderia ser melhorado no VistorIA Pro..."
                rows={5}
                maxLength={2000}
                className="resize-none"
              />
              <p className="text-xs text-neutral-400 text-right">
                {openFeedback.length}/2000
              </p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between gap-2 px-6 py-4 border-t border-neutral-100 bg-neutral-50">
          <Button
            variant="ghost"
            onClick={() => step > 1 ? setStep(step - 1) : onClose()}
            disabled={isSubmitting}
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            {step === 1 ? 'Cancelar' : 'Voltar'}
          </Button>

          {step < totalSteps ? (
            <Button
              onClick={() => setStep(step + 1)}
              disabled={!canProceed() || isSubmitting}
            >
              Próximo
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          ) : (
            <Button
              onClick={handleSubmit}
              disabled={!canProceed() || isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Enviando...
                </>
              ) : (
                <>
                  <Send className="mr-2 h-4 w-4" />
                  Enviar
                </>
              )}
            </Button>
          )}
        </div>
      </div>
    </>
  )
}

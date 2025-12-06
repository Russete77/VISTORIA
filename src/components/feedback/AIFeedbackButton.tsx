'use client'

import { useState } from 'react'
import {
  ThumbsUp,
  ThumbsDown,
  MessageSquare,
  Star,
  Send,
  X,
  Loader2,
  CheckCircle2,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'

type FeedbackType =
  | 'problem_detection'
  | 'problem_description'
  | 'severity_rating'
  | 'recommendation'
  | 'cost_estimate'
  | 'room_detection'
  | 'general'

type IssueCategory =
  | 'wrong_severity'
  | 'missed_problem'
  | 'false_positive'
  | 'wrong_description'
  | 'wrong_recommendation'
  | 'wrong_cost'
  | 'wrong_room'
  | 'other'

interface AIFeedbackButtonProps {
  feedbackType: FeedbackType
  inspectionId?: string
  photoId?: string
  problemId?: string
  aiContent: Record<string, unknown>
  className?: string
  compact?: boolean
}

const ISSUE_LABELS: Record<IssueCategory, string> = {
  wrong_severity: 'Severidade incorreta',
  missed_problem: 'Problema não detectado',
  false_positive: 'Falso positivo',
  wrong_description: 'Descrição incorreta',
  wrong_recommendation: 'Recomendação incorreta',
  wrong_cost: 'Custo incorreto',
  wrong_room: 'Cômodo incorreto',
  other: 'Outro',
}

export function AIFeedbackButton({
  feedbackType,
  inspectionId,
  photoId,
  problemId,
  aiContent,
  className,
  compact = false,
}: AIFeedbackButtonProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isSubmitted, setIsSubmitted] = useState(false)

  // Feedback state
  const [isAccurate, setIsAccurate] = useState<boolean | null>(null)
  const [rating, setRating] = useState(0)
  const [hoverRating, setHoverRating] = useState(0)
  const [selectedIssues, setSelectedIssues] = useState<IssueCategory[]>([])
  const [comment, setComment] = useState('')

  const handleQuickFeedback = async (accurate: boolean) => {
    if (isSubmitted) return

    setIsAccurate(accurate)

    if (accurate) {
      // Se for positivo, enviar direto com rating 5
      await submitFeedback(accurate, 5, [], '')
    } else {
      // Se for negativo, abrir modal para detalhes
      setIsOpen(true)
    }
  }

  const submitFeedback = async (
    accurate: boolean,
    finalRating: number,
    issues: IssueCategory[],
    userComment: string
  ) => {
    setIsSubmitting(true)

    try {
      const response = await fetch('/api/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          feedbackType,
          rating: finalRating,
          isAccurate: accurate,
          inspectionId,
          photoId,
          problemId,
          aiOriginalContent: aiContent,
          userComment: userComment || undefined,
          issueCategories: issues.length > 0 ? issues : undefined,
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to submit feedback')
      }

      setIsSubmitted(true)
      setIsOpen(false)
      toast.success('Obrigado pelo feedback!')
    } catch (error) {
      console.error('Error submitting feedback:', error)
      toast.error('Erro ao enviar feedback')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleSubmitDetailed = async () => {
    if (rating === 0) {
      toast.error('Por favor, dê uma nota')
      return
    }

    await submitFeedback(isAccurate ?? false, rating, selectedIssues, comment)
  }

  const toggleIssue = (issue: IssueCategory) => {
    setSelectedIssues(prev =>
      prev.includes(issue)
        ? prev.filter(i => i !== issue)
        : [...prev, issue]
    )
  }

  if (isSubmitted) {
    return (
      <div className={cn('flex items-center gap-1 text-emerald-600', className)}>
        <CheckCircle2 className="h-4 w-4" />
        {!compact && <span className="text-xs">Feedback enviado</span>}
      </div>
    )
  }

  return (
    <div className={cn('relative', className)}>
      {/* Quick feedback buttons */}
      <div className="flex items-center gap-1">
        <button
          onClick={() => handleQuickFeedback(true)}
          disabled={isSubmitting}
          className={cn(
            'p-1.5 rounded-lg transition-all hover:bg-emerald-50 active:scale-95',
            isAccurate === true && 'bg-emerald-100 text-emerald-600'
          )}
          title="Análise correta"
        >
          <ThumbsUp className="h-4 w-4" />
        </button>

        <button
          onClick={() => handleQuickFeedback(false)}
          disabled={isSubmitting}
          className={cn(
            'p-1.5 rounded-lg transition-all hover:bg-red-50 active:scale-95',
            isAccurate === false && 'bg-red-100 text-red-600'
          )}
          title="Análise incorreta"
        >
          <ThumbsDown className="h-4 w-4" />
        </button>

        {!compact && (
          <button
            onClick={() => setIsOpen(true)}
            disabled={isSubmitting}
            className="p-1.5 rounded-lg transition-all hover:bg-neutral-100 active:scale-95"
            title="Feedback detalhado"
          >
            <MessageSquare className="h-4 w-4" />
          </button>
        )}
      </div>

      {/* Detailed feedback modal */}
      {isOpen && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm"
            onClick={() => setIsOpen(false)}
          />

          {/* Modal */}
          <div className="fixed inset-x-4 top-1/2 -translate-y-1/2 z-50 max-w-md mx-auto bg-white rounded-2xl shadow-2xl overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-neutral-100 bg-neutral-50">
              <h3 className="font-semibold text-neutral-900">Avaliar análise da IA</h3>
              <button
                onClick={() => setIsOpen(false)}
                className="p-1 rounded-full hover:bg-neutral-200"
              >
                <X className="h-5 w-5 text-neutral-500" />
              </button>
            </div>

            <div className="p-4 space-y-4 max-h-[60vh] overflow-y-auto">
              {/* Star rating */}
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-2">
                  Nota geral
                </label>
                <div className="flex items-center gap-1">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      onClick={() => setRating(star)}
                      onMouseEnter={() => setHoverRating(star)}
                      onMouseLeave={() => setHoverRating(0)}
                      className="p-1 transition-transform hover:scale-110"
                    >
                      <Star
                        className={cn(
                          'h-7 w-7 transition-colors',
                          (hoverRating || rating) >= star
                            ? 'fill-amber-400 text-amber-400'
                            : 'text-neutral-300'
                        )}
                      />
                    </button>
                  ))}
                  {rating > 0 && (
                    <span className="ml-2 text-sm text-neutral-500">
                      {rating === 1 && 'Muito ruim'}
                      {rating === 2 && 'Ruim'}
                      {rating === 3 && 'Regular'}
                      {rating === 4 && 'Bom'}
                      {rating === 5 && 'Excelente'}
                    </span>
                  )}
                </div>
              </div>

              {/* Issue categories */}
              {isAccurate === false && (
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-2">
                    O que estava errado?
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {(Object.keys(ISSUE_LABELS) as IssueCategory[]).map((issue) => (
                      <button
                        key={issue}
                        onClick={() => toggleIssue(issue)}
                        className={cn(
                          'px-3 py-1.5 rounded-full text-sm font-medium transition-all',
                          selectedIssues.includes(issue)
                            ? 'bg-primary-100 text-primary-700 ring-1 ring-primary-300'
                            : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200'
                        )}
                      >
                        {ISSUE_LABELS[issue]}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Comment */}
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-2">
                  Comentário (opcional)
                </label>
                <Textarea
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  placeholder="Descreva o que poderia ser melhorado..."
                  rows={3}
                  maxLength={500}
                  className="resize-none"
                />
                <p className="mt-1 text-xs text-neutral-400 text-right">
                  {comment.length}/500
                </p>
              </div>
            </div>

            {/* Footer */}
            <div className="flex items-center justify-end gap-2 px-4 py-3 border-t border-neutral-100 bg-neutral-50">
              <Button
                variant="ghost"
                onClick={() => setIsOpen(false)}
                disabled={isSubmitting}
              >
                Cancelar
              </Button>
              <Button
                onClick={handleSubmitDetailed}
                disabled={isSubmitting || rating === 0}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Enviando...
                  </>
                ) : (
                  <>
                    <Send className="mr-2 h-4 w-4" />
                    Enviar feedback
                  </>
                )}
              </Button>
            </div>
          </div>
        </>
      )}
    </div>
  )
}

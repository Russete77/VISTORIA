'use client'

import { useState } from 'react'
import { Mic, MicOff, Loader2, AlertCircle, Square } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { useWhisperTranscription } from '@/hooks/use-whisper-transcription'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'

interface VoiceInputProps {
  onTranscript: (text: string) => void
  className?: string
  disabled?: boolean
  size?: 'icon' | 'sm' | 'lg'
  showLabel?: boolean
}

/**
 * Botão de entrada por voz usando OpenAI Whisper
 * Mais confiável que Web Speech API
 */
export function VoiceInput({
  onTranscript,
  className,
  disabled = false,
  size = 'icon',
  showLabel = false,
}: VoiceInputProps) {
  const {
    isRecording,
    isTranscribing,
    isSupported,
    error,
    startRecording,
    stopRecording,
    cancelRecording,
  } = useWhisperTranscription({
    onTranscript,
    onError: (err) => console.error('[VoiceInput]', err),
  })

  const iconSize = size === 'lg' ? 'h-6 w-6' : 'h-5 w-5'

  // Não suportado
  if (!isSupported) {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              disabled
              className={cn('text-neutral-400', className)}
            >
              <MicOff className="h-5 w-5" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>Gravação de áudio não suportada neste navegador</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    )
  }

  const handleClick = async () => {
    if (isRecording) {
      await stopRecording()
    } else {
      await startRecording()
    }
  }

  // Determinar estado visual
  const isLoading = isTranscribing
  const isActive = isRecording

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            type="button"
            variant={isActive ? 'default' : 'outline'}
            size={size === 'icon' ? 'icon' : size}
            onClick={handleClick}
            disabled={disabled || isLoading}
            className={cn(
              'relative transition-all',
              isActive && 'bg-primary-600 hover:bg-primary-700 animate-pulse',
              error && 'border-danger-500',
              size === 'lg' && 'h-16 sm:h-20 text-base sm:text-lg',
              className
            )}
            aria-label={
              isLoading
                ? 'Transcrevendo...'
                : isActive
                  ? 'Parar gravação'
                  : 'Iniciar gravação de voz'
            }
          >
            {isLoading ? (
              <>
                <Loader2 className={cn(iconSize, 'animate-spin', showLabel && 'mr-2')} />
                {showLabel && <span>Transcrevendo...</span>}
              </>
            ) : isActive ? (
              <>
                <Square className={cn(iconSize, 'text-white fill-white', showLabel && 'mr-2')} />
                {showLabel && <span>Parar</span>}
              </>
            ) : error ? (
              <>
                <AlertCircle className={cn(iconSize, 'text-danger-500', showLabel && 'mr-2')} />
                {showLabel && <span>Erro</span>}
              </>
            ) : (
              <>
                <Mic className={cn(iconSize, showLabel && 'mr-2')} />
                {showLabel && <span>Falar</span>}
              </>
            )}

            {/* Indicador de gravação pulsante */}
            {isActive && (
              <span className="absolute -top-1 -right-1 flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-white"></span>
              </span>
            )}
          </Button>
        </TooltipTrigger>
        <TooltipContent side="top">
          {error ? (
            <p className="text-danger-600 max-w-xs">{error}</p>
          ) : isLoading ? (
            <p>Transcrevendo com IA...</p>
          ) : isActive ? (
            <p>Gravando... Clique para parar e transcrever</p>
          ) : (
            <p>Clique para gravar observação por voz</p>
          )}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
}

/**
 * Campo de texto com suporte a entrada por voz
 */
interface VoiceTextareaProps {
  value: string
  onChange: (value: string) => void
  placeholder?: string
  className?: string
  rows?: number
  disabled?: boolean
  label?: string
}

export function VoiceTextarea({
  value,
  onChange,
  placeholder = 'Digite ou use o microfone para ditar...',
  className,
  rows = 3,
  disabled = false,
  label,
}: VoiceTextareaProps) {
  const handleTranscript = (text: string) => {
    const newValue = value ? `${value} ${text}` : text
    onChange(newValue)
  }

  return (
    <div className={cn('space-y-2', className)}>
      {label && (
        <label className="text-sm font-medium text-neutral-700">{label}</label>
      )}
      <div className="relative">
        <textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          rows={rows}
          disabled={disabled}
          className={cn(
            'w-full px-3 py-2 pr-12 border border-neutral-300 rounded-lg',
            'focus:ring-2 focus:ring-primary-500 focus:border-transparent',
            'resize-none',
            disabled && 'bg-neutral-100 cursor-not-allowed'
          )}
        />
        <div className="absolute bottom-2 right-2">
          <VoiceInput onTranscript={handleTranscript} disabled={disabled} />
        </div>
      </div>
    </div>
  )
}

/**
 * Componente para descrição de problemas por voz
 */
interface VoiceProblemDescriptionProps {
  onDescribe: (description: string) => void
  className?: string
}

export function VoiceProblemDescription({
  onDescribe,
  className,
}: VoiceProblemDescriptionProps) {
  const [preview, setPreview] = useState('')

  const {
    isRecording,
    isTranscribing,
    isSupported,
    error,
    startRecording,
    stopRecording,
    cancelRecording,
  } = useWhisperTranscription({
    onTranscript: (text) => {
      setPreview(text)
      onDescribe(text)
    },
  })

  if (!isSupported) {
    return null
  }

  const handleStart = async () => {
    setPreview('')
    await startRecording()
  }

  const handleStop = async () => {
    await stopRecording()
  }

  const handleCancel = () => {
    cancelRecording()
    setPreview('')
  }

  return (
    <div className={cn('space-y-3', className)}>
      {!isRecording && !isTranscribing ? (
        <Button
          type="button"
          variant="outline"
          onClick={handleStart}
          className="w-full"
        >
          <Mic className="mr-2 h-4 w-4" />
          Descrever problema por voz
        </Button>
      ) : (
        <div className="space-y-3">
          {/* Preview ou status */}
          <div className="bg-neutral-50 border border-neutral-200 rounded-lg p-4 min-h-[100px]">
            {isTranscribing ? (
              <div className="flex items-center justify-center gap-2 text-primary-600">
                <Loader2 className="h-5 w-5 animate-spin" />
                <span>Transcrevendo com IA...</span>
              </div>
            ) : preview ? (
              <p className="text-neutral-900">{preview}</p>
            ) : (
              <p className="text-neutral-400 italic">Fale agora...</p>
            )}
          </div>

          {/* Indicador de gravação */}
          {isRecording && (
            <div className="flex items-center justify-center gap-2 text-primary-600">
              <span className="relative flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-primary-500"></span>
              </span>
              <span className="text-sm font-medium">Gravando...</span>
            </div>
          )}

          {/* Ações */}
          {isRecording && (
            <div className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={handleCancel}
                className="flex-1"
              >
                Cancelar
              </Button>
              <Button
                type="button"
                onClick={handleStop}
                className="flex-1 bg-primary-600 hover:bg-primary-700"
              >
                <Square className="mr-2 h-4 w-4 fill-current" />
                Parar e Transcrever
              </Button>
            </div>
          )}

          {error && (
            <p className="text-sm text-danger-600 text-center">{error}</p>
          )}
        </div>
      )}
    </div>
  )
}

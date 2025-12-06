'use client'

import { useState, useEffect, useCallback, useRef } from 'react'

interface UseSpeechRecognitionOptions {
  continuous?: boolean
  interimResults?: boolean
  language?: string
  onResult?: (transcript: string, isFinal: boolean) => void
  onError?: (error: string) => void
  onEnd?: () => void
}

interface UseSpeechRecognitionReturn {
  transcript: string
  isListening: boolean
  isSupported: boolean
  error: string | null
  start: () => void
  stop: () => void
  toggle: () => void
  reset: () => void
}

// Tipos para Web Speech API (não incluídos no TypeScript padrão)
interface SpeechRecognitionEvent extends Event {
  results: SpeechRecognitionResultList
  resultIndex: number
}

interface SpeechRecognitionResultList {
  length: number
  item(index: number): SpeechResult
  [index: number]: SpeechResult
}

interface SpeechResult {
  isFinal: boolean
  length: number
  item(index: number): SpeechRecognitionAlternative
  [index: number]: SpeechRecognitionAlternative
}

interface SpeechRecognitionAlternative {
  transcript: string
  confidence: number
}

interface SpeechRecognitionErrorEvent extends Event {
  error: string
  message?: string
}

/**
 * Hook para reconhecimento de voz usando Web Speech API
 * Suporte para português brasileiro por padrão
 */
export function useSpeechRecognition(
  options: UseSpeechRecognitionOptions = {}
): UseSpeechRecognitionReturn {
  const {
    continuous = true,
    interimResults = true,
    language = 'pt-BR',
    onResult,
    onError,
    onEnd,
  } = options

  const [transcript, setTranscript] = useState('')
  const [isListening, setIsListening] = useState(false)
  const [isSupported, setIsSupported] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const recognitionRef = useRef<any>(null)
  const finalTranscriptRef = useRef('')

  // Verifica suporte
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const SpeechRecognition =
        (window as any).SpeechRecognition ||
        (window as any).webkitSpeechRecognition

      setIsSupported(!!SpeechRecognition)

      if (SpeechRecognition) {
        recognitionRef.current = new SpeechRecognition()
        recognitionRef.current.continuous = continuous
        recognitionRef.current.interimResults = interimResults
        recognitionRef.current.lang = language

        recognitionRef.current.onresult = (event: SpeechRecognitionEvent) => {
          let interimTranscript = ''
          let finalTranscript = finalTranscriptRef.current

          for (let i = event.resultIndex; i < event.results.length; i++) {
            const result = event.results[i]
            if (result.isFinal) {
              finalTranscript += result[0].transcript + ' '
              finalTranscriptRef.current = finalTranscript
            } else {
              interimTranscript += result[0].transcript
            }
          }

          const fullTranscript = finalTranscript + interimTranscript
          setTranscript(fullTranscript)
          onResult?.(fullTranscript, !interimTranscript)
        }

        recognitionRef.current.onerror = (event: SpeechRecognitionErrorEvent) => {
          const errorMessage = getErrorMessage(event.error)
          setError(errorMessage)
          onError?.(errorMessage)
          setIsListening(false)
        }

        recognitionRef.current.onend = () => {
          setIsListening(false)
          onEnd?.()
        }
      }
    }

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.abort()
      }
    }
  }, [continuous, interimResults, language, onResult, onError, onEnd])

  const start = useCallback(() => {
    if (!recognitionRef.current) return

    setError(null)
    try {
      recognitionRef.current.start()
      setIsListening(true)
    } catch (err) {
      // Já está rodando, ignorar
      if ((err as Error).message?.includes('already started')) {
        setIsListening(true)
      }
    }
  }, [])

  const stop = useCallback(() => {
    if (!recognitionRef.current) return

    recognitionRef.current.stop()
    setIsListening(false)
  }, [])

  const toggle = useCallback(() => {
    if (isListening) {
      stop()
    } else {
      start()
    }
  }, [isListening, start, stop])

  const reset = useCallback(() => {
    finalTranscriptRef.current = ''
    setTranscript('')
    setError(null)
  }, [])

  return {
    transcript,
    isListening,
    isSupported,
    error,
    start,
    stop,
    toggle,
    reset,
  }
}

/**
 * Traduz erros da Web Speech API para português
 */
function getErrorMessage(error: string): string {
  const errorMessages: Record<string, string> = {
    'no-speech': 'Nenhuma fala detectada. Tente novamente.',
    'audio-capture': 'Microfone não encontrado. Verifique as permissões.',
    'not-allowed': 'Permissão de microfone negada. Habilite nas configurações.',
    'network': 'Erro de rede. Verifique sua conexão.',
    'aborted': 'Reconhecimento cancelado.',
    'language-not-supported': 'Idioma não suportado.',
    'service-not-allowed': 'Serviço de reconhecimento não disponível.',
  }

  return errorMessages[error] || `Erro desconhecido: ${error}`
}

/**
 * Hook simplificado para ditar em campos de texto
 */
export function useDictation(
  onTranscript: (text: string) => void,
  options: Omit<UseSpeechRecognitionOptions, 'onResult'> = {}
) {
  return useSpeechRecognition({
    ...options,
    onResult: (transcript, isFinal) => {
      if (isFinal) {
        onTranscript(transcript)
      }
    },
  })
}

'use client'

import { useState, useRef, useCallback } from 'react'

interface UseWhisperTranscriptionOptions {
  onTranscript?: (text: string) => void
  onError?: (error: string) => void
  onRecordingStart?: () => void
  onRecordingStop?: () => void
  maxDuration?: number // Duração máxima em segundos (default: 60)
}

interface UseWhisperTranscriptionReturn {
  isRecording: boolean
  isTranscribing: boolean
  isSupported: boolean
  error: string | null
  startRecording: () => Promise<void>
  stopRecording: () => Promise<string | null>
  cancelRecording: () => void
}

/**
 * Hook para gravação e transcrição de áudio usando OpenAI Whisper
 * Mais confiável que Web Speech API
 */
export function useWhisperTranscription(
  options: UseWhisperTranscriptionOptions = {}
): UseWhisperTranscriptionReturn {
  const {
    onTranscript,
    onError,
    onRecordingStart,
    onRecordingStop,
    maxDuration = 60,
  } = options

  const [isRecording, setIsRecording] = useState(false)
  const [isTranscribing, setIsTranscribing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isSupported, setIsSupported] = useState(true)

  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const audioChunksRef = useRef<Blob[]>([])
  const streamRef = useRef<MediaStream | null>(null)
  const timeoutRef = useRef<NodeJS.Timeout | null>(null)

  // Verificar suporte
  const checkSupport = useCallback(() => {
    if (typeof window === 'undefined') return false
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      setIsSupported(false)
      return false
    }
    return true
  }, [])

  // Iniciar gravação
  const startRecording = useCallback(async () => {
    if (!checkSupport()) {
      const msg = 'Seu navegador não suporta gravação de áudio'
      setError(msg)
      onError?.(msg)
      return
    }

    try {
      setError(null)

      // Solicitar permissão do microfone
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
      })

      streamRef.current = stream
      audioChunksRef.current = []

      // Criar MediaRecorder
      // Tentar webm primeiro, fallback para outros formatos
      let mimeType = 'audio/webm;codecs=opus'
      if (!MediaRecorder.isTypeSupported(mimeType)) {
        mimeType = 'audio/webm'
        if (!MediaRecorder.isTypeSupported(mimeType)) {
          mimeType = 'audio/mp4'
          if (!MediaRecorder.isTypeSupported(mimeType)) {
            mimeType = '' // Deixar o navegador escolher
          }
        }
      }

      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: mimeType || undefined,
      })

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data)
        }
      }

      mediaRecorder.onerror = (event: any) => {
        console.error('[Whisper] Erro no MediaRecorder:', event)
        const msg = 'Erro durante a gravação'
        setError(msg)
        onError?.(msg)
      }

      mediaRecorderRef.current = mediaRecorder
      mediaRecorder.start(1000) // Coletar dados a cada 1 segundo

      setIsRecording(true)
      onRecordingStart?.()

      // Timeout de segurança para não gravar eternamente
      timeoutRef.current = setTimeout(() => {
        if (isRecording) {
          console.log('[Whisper] Tempo máximo atingido, parando gravação')
          stopRecording()
        }
      }, maxDuration * 1000)

      console.log('[Whisper] Gravação iniciada')
    } catch (err: any) {
      console.error('[Whisper] Erro ao iniciar gravação:', err)

      let msg = 'Erro ao acessar microfone'
      if (err.name === 'NotAllowedError') {
        msg = 'Permissão de microfone negada. Habilite nas configurações do navegador.'
      } else if (err.name === 'NotFoundError') {
        msg = 'Nenhum microfone encontrado'
      }

      setError(msg)
      onError?.(msg)
    }
  }, [checkSupport, maxDuration, onError, onRecordingStart])

  // Parar gravação e transcrever
  const stopRecording = useCallback(async (): Promise<string | null> => {
    if (!mediaRecorderRef.current || !isRecording) {
      return null
    }

    // Limpar timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
      timeoutRef.current = null
    }

    return new Promise((resolve) => {
      const mediaRecorder = mediaRecorderRef.current!

      mediaRecorder.onstop = async () => {
        // Parar stream
        if (streamRef.current) {
          streamRef.current.getTracks().forEach((track) => track.stop())
          streamRef.current = null
        }

        setIsRecording(false)
        onRecordingStop?.()

        // Criar blob do áudio
        const audioBlob = new Blob(audioChunksRef.current, {
          type: mediaRecorder.mimeType || 'audio/webm',
        })

        console.log('[Whisper] Áudio gravado:', {
          size: audioBlob.size,
          type: audioBlob.type,
        })

        // Verificar se tem áudio
        if (audioBlob.size < 1000) {
          const msg = 'Áudio muito curto. Fale por mais tempo.'
          setError(msg)
          onError?.(msg)
          resolve(null)
          return
        }

        // Enviar para transcrição
        setIsTranscribing(true)
        setError(null)

        try {
          const formData = new FormData()
          formData.append('audio', audioBlob, 'recording.webm')

          const response = await fetch('/api/transcribe', {
            method: 'POST',
            body: formData,
          })

          const data = await response.json()

          if (!response.ok) {
            throw new Error(data.error || 'Erro na transcrição')
          }

          const text = data.text?.trim()

          if (text) {
            console.log('[Whisper] Transcrição:', text)
            onTranscript?.(text)
            resolve(text)
          } else {
            const msg = 'Nenhuma fala detectada'
            setError(msg)
            onError?.(msg)
            resolve(null)
          }
        } catch (err: any) {
          console.error('[Whisper] Erro na transcrição:', err)
          const msg = err.message || 'Erro ao transcrever áudio'
          setError(msg)
          onError?.(msg)
          resolve(null)
        } finally {
          setIsTranscribing(false)
        }
      }

      mediaRecorder.stop()
    })
  }, [isRecording, onError, onRecordingStop, onTranscript])

  // Cancelar gravação sem transcrever
  const cancelRecording = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
      timeoutRef.current = null
    }

    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop()
    }

    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop())
      streamRef.current = null
    }

    audioChunksRef.current = []
    setIsRecording(false)
    setIsTranscribing(false)
    setError(null)
  }, [isRecording])

  return {
    isRecording,
    isTranscribing,
    isSupported,
    error,
    startRecording,
    stopRecording,
    cancelRecording,
  }
}

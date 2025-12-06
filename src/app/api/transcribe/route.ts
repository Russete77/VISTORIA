/**
 * API Route: Transcrição rápida de áudio
 * POST /api/transcribe
 *
 * Usa OpenAI Whisper para transcrever áudios curtos (observações de vistoria)
 * Otimizado para áudios de 5-60 segundos
 */

import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import OpenAI from 'openai'
import { quickRateLimit } from '@/lib/api-utils'

// Cliente OpenAI
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
  timeout: 30000, // 30 segundos
  maxRetries: 2,
})

export async function POST(request: NextRequest) {
  try {
    // Verificar autenticação
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    // Rate limiting (AI-intensive operation)
    const rateLimited = await quickRateLimit(request, 'ai')
    if (rateLimited) return rateLimited

    // Verificar se API key existe
    if (!process.env.OPENAI_API_KEY) {
      console.error('[Transcribe] OPENAI_API_KEY não configurada')
      return NextResponse.json(
        { error: 'Serviço de transcrição não configurado' },
        { status: 503 }
      )
    }

    // Pegar o arquivo de áudio do form data
    const formData = await request.formData()
    const audioFile = formData.get('audio') as File

    if (!audioFile) {
      return NextResponse.json(
        { error: 'Arquivo de áudio não enviado' },
        { status: 400 }
      )
    }

    // Validar tamanho (máximo 10MB para áudios curtos)
    const MAX_SIZE = 10 * 1024 * 1024 // 10MB
    if (audioFile.size > MAX_SIZE) {
      return NextResponse.json(
        { error: 'Arquivo muito grande. Máximo 10MB.' },
        { status: 400 }
      )
    }

    // Validar tipo de arquivo
    const validTypes = ['audio/webm', 'audio/mp3', 'audio/mpeg', 'audio/wav', 'audio/ogg', 'audio/mp4', 'audio/m4a']
    if (!validTypes.some(type => audioFile.type.includes(type.split('/')[1]))) {
      console.log('[Transcribe] Tipo de arquivo:', audioFile.type)
      // Aceitar mesmo assim, Whisper é flexível
    }

    console.log('[Transcribe] Processando áudio:', {
      name: audioFile.name,
      type: audioFile.type,
      size: audioFile.size,
    })

    // Transcrever com OpenAI Whisper
    const transcription = await openai.audio.transcriptions.create({
      file: audioFile,
      model: 'whisper-1',
      language: 'pt', // Português brasileiro
      response_format: 'json',
      prompt: 'Transcrição de observações de vistoria imobiliária. Termos comuns: infiltração, rachadura, mofo, piso, azulejo, pintura, tomada, interruptor, vazamento, mancha.',
    })

    console.log('[Transcribe] Transcrição concluída:', {
      chars: transcription.text.length,
      preview: transcription.text.substring(0, 100),
    })

    return NextResponse.json({
      text: transcription.text,
      success: true,
    })
  } catch (error: any) {
    console.error('[Transcribe] Erro:', error)

    // Erros específicos da OpenAI
    if (error?.status === 401) {
      return NextResponse.json(
        { error: 'API key inválida' },
        { status: 503 }
      )
    }

    if (error?.status === 429) {
      return NextResponse.json(
        { error: 'Limite de requisições atingido. Tente novamente em alguns segundos.' },
        { status: 429 }
      )
    }

    return NextResponse.json(
      { error: 'Erro ao transcrever áudio' },
      { status: 500 }
    )
  }
}

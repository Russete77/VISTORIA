/**
 * API: Análise de Vídeo de Vistoria (REFATORADO)
 * POST /api/inspections/[id]/video-analysis
 *
 * Novo fluxo:
 * 1. Recebe vídeo
 * 2. Transcreve áudio (Whisper)
 * 3. Extrai frames (2 fps)
 * 4. Analisa cada frame (Claude Vision)
 * 5. Salva em inspection_photos (tabela correta!)
 */

import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { createAdminClient } from '@/lib/supabase/server'
import { extractFramesFromVideo, saveTemporaryFile, removeTemporaryFile, checkFFmpegInstalled } from '@/services/video-frame-extractor'
import { analyzeVideoFrame, PhotoAnalysisResult } from '@/services/ai-analysis'
import { saveTrainingData } from '@/services/ai-training-collector'

// Type for analysis result with frame info
interface FrameAnalysisResult {
  frameIndex: number
  framePath: string
  analysis: PhotoAnalysisResult
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  let tempVideoPath: string | null = null

  try {
    console.log('[Video Analysis] START')

    // 0. VERIFICAR FFMPEG INSTALADO
    const ffmpegCheck = checkFFmpegInstalled()
    if (!ffmpegCheck.installed) {
      console.error('[Video Analysis] ✗ FFmpeg not installed:', ffmpegCheck.error)
      return NextResponse.json(
        { 
          error: 'FFmpeg não está instalado no servidor',
          details: ffmpegCheck.error,
          help: 'Instale FFmpeg: https://ffmpeg.org/download.html'
        },
        { status: 500 }
      )
    }
    console.log(`[Video Analysis] ✓ FFmpeg detected: ${ffmpegCheck.version}`)

    // 1. AUTENTICAÇÃO
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id: inspectionId } = await params
    console.log('[Video Analysis] inspectionId:', inspectionId)

    const supabase = createAdminClient()

    // 2. BUSCAR USUÁRIO
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('id, clerk_id, email')
      .eq('clerk_id', userId)
      .single()

    if (userError || !user) {
      console.error('[Video Analysis] User not found')
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // 3. VERIFICAR VISTORIA
    const { data: inspection, error: inspectionError } = await supabase
      .from('inspections')
      .select('id, property_id, user_id')
      .eq('id', inspectionId)
      .eq('user_id', user.id)
      .single()

    if (inspectionError || !inspection) {
      console.error('[Video Analysis] Inspection not found')
      return NextResponse.json({ error: 'Inspection not found' }, { status: 404 })
    }

    // 4. RECEBER VÍDEO
    const formData = await request.formData()
    const videoFile = formData.get('video') as File
    const roomName = formData.get('room_name') as string
    const roomType = formData.get('room_type') as string

    if (!videoFile) {
      return NextResponse.json({ error: 'No video file provided' }, { status: 400 })
    }

    console.log('[Video Analysis] Processing video:', {
      fileName: videoFile.name,
      size: videoFile.size,
      type: videoFile.type,
      roomName,
      roomType,
    })

    // 5. VALIDAR TAMANHO
    const MAX_VIDEO_SIZE = 128 * 1024 * 1024 // 128MB
    if (videoFile.size > MAX_VIDEO_SIZE) {
      return NextResponse.json(
        {
          error: `Video file too large. Maximum size: 128MB, received: ${(videoFile.size / 1024 / 1024).toFixed(2)}MB`,
        },
        { status: 400 }
      )
    }

    // 6. SALVAR VÍDEO TEMPORARIAMENTE
    const buffer = Buffer.from(await videoFile.arrayBuffer())
    tempVideoPath = saveTemporaryFile(buffer, 'mp4')

    // 7. TRANSCREVER ÁUDIO
    console.log('[Video Analysis] Transcribing audio...')
    let transcription = ''
    try {
      const transcribeFormData = new FormData()
      transcribeFormData.append('audio', videoFile)

      const transcribeResponse = await fetch('http://localhost:3002/api/transcribe', {
        method: 'POST',
        body: transcribeFormData,
        headers: {
          'Authorization': `Bearer ${process.env.CLERK_SECRET_KEY}`,
        },
      })

      if (transcribeResponse.ok) {
        const transcribeData = await transcribeResponse.json()
        transcription = transcribeData.text || ''
        console.log('[Video Analysis] ✓ Transcription completed:', transcription.substring(0, 100) + '...')
      } else {
        console.warn('[Video Analysis] ⚠️ TRANSCRIPTION UNAVAILABLE - Whisper API returned error. Video analysis will continue without audio transcription. Make sure the Whisper service is running on http://localhost:3002')
      }
    } catch (transcribeError) {
      console.error('[Video Analysis] ⚠️ TRANSCRIPTION SERVICE ERROR - Could not connect to Whisper API:', transcribeError instanceof Error ? transcribeError.message : transcribeError)
      console.warn('[Video Analysis] → Continuing without transcription. To enable: start Whisper service on http://localhost:3002')
    }

    // 8. EXTRAIR FRAMES
    console.log('[Video Analysis] Extracting frames...')
    let frames: Buffer[] = []
    try {
      const extractStartTime = Date.now()
      frames = await extractFramesFromVideo(tempVideoPath, 1) // 1 fps (otimizado)
      const extractTime = ((Date.now() - extractStartTime) / 1000).toFixed(2)
      console.log(`[Video Analysis] Frame extraction completed in ${extractTime}s, got ${frames.length} frames`)
    } catch (extractError) {
      console.error('[Video Analysis] Frame extraction failed:', extractError instanceof Error ? extractError.message : extractError)
      removeTemporaryFile(tempVideoPath)
      return NextResponse.json(
        { error: 'Failed to extract frames from video', details: extractError instanceof Error ? extractError.message : 'Unknown error' },
        { status: 500 }
      )
    }

    if (frames.length === 0) {
      console.error('[Video Analysis] No frames extracted')
      removeTemporaryFile(tempVideoPath)
      return NextResponse.json(
        { error: 'No frames could be extracted from video' },
        { status: 400 }
      )
    }

    // 9. ANALISAR FRAMES EM PARALELO (OTIMIZADO)
    console.log(`[Video Analysis] Analyzing ${frames.length} frames in parallel...`)
    const photoIds: string[] = []
    let totalProblems = 0
    const BATCH_SIZE = 3 // Processar 3 frames em paralelo (evita rate limiting da Claude API)

    for (let batchStart = 0; batchStart < frames.length; batchStart += BATCH_SIZE) {
      const batchEnd = Math.min(batchStart + BATCH_SIZE, frames.length)
      const batchFrames = frames.slice(batchStart, batchEnd)

      console.log(`[Video Analysis] Processing batch ${Math.floor(batchStart / BATCH_SIZE) + 1}/${Math.ceil(frames.length / BATCH_SIZE)}...`)

      // 9.1 Upload frames em paralelo
      const uploadPromises = batchFrames.map((frame, idx) => {
        const frameIndex = batchStart + idx
        const framePath = `${inspectionId}/frame_${frameIndex}_${Date.now()}.png`

        return supabase.storage
          .from('inspection-photos')
          .upload(framePath, frame, {
            contentType: 'image/png',
            upsert: false,
          })
          .then(() => {
            const { data: urlData } = supabase.storage
              .from('inspection-photos')
              .getPublicUrl(framePath)
            return { frameIndex, framePath, frameUrl: urlData.publicUrl }
          })
          .catch((error) => {
            console.error(`[Video Analysis] Frame ${frameIndex} upload error:`, error)
            return null
          })
      })

      const uploadResults = await Promise.all(uploadPromises)

      // 9.2 Analisar frames com função específica para vídeo
      const analysisPromises = uploadResults
        .filter((r): r is { frameIndex: number; framePath: string; frameUrl: string } => r !== null)
        .map(({ frameIndex, framePath }) => {
          // Converter frame para base64 para enviar direto para Claude
          const frameBase64 = batchFrames[frameIndex % BATCH_SIZE].toString('base64')
          
          // Usar função otimizada para frames de vídeo (inclui transcrição no primeiro frame)
          return analyzeVideoFrame(
            frameBase64, 
            roomName, 
            roomType, 
            frameIndex, 
            frameIndex === 0 ? transcription : undefined
          )
            .then((analysis) => ({ frameIndex, framePath, analysis }))
            .catch((error: Error) => {
              console.error(`[Video Analysis] Frame ${frameIndex} analysis error:`, error)
              return null
            })
        })

      const analysisResults = await Promise.all(analysisPromises)

      // 9.3 Salvar fotos em paralelo
      const savePhotoPromises = analysisResults
        .filter((r): r is FrameAnalysisResult => r !== null)
        .map(async ({ frameIndex, framePath, analysis }) => {
          const { data: photoData, error: photoError } = await supabase
            .from('inspection_photos')
            .insert({
              inspection_id: inspectionId,
              user_id: user.id,
              room_name: roomName,
              room_category: roomType,
              storage_path: framePath,
              ai_summary: analysis.summary,
              ai_has_problems: analysis.hasProblems,
              ai_confidence: analysis.confidence,
              from_video: true,
              frame_number: frameIndex,
              video_transcription: frameIndex === 0 ? transcription : null,
            })
            .select()
          
          if (photoError) {
            console.error(`[Video Analysis] Photo save error for frame ${frameIndex}:`, photoError)
            return null
          }

          const photoId = photoData?.[0]?.id || null

          // Save training data for this video frame
          if (photoId) {
            try {
              const { data: urlData } = supabase.storage
                .from('inspection-photos')
                .getPublicUrl(framePath)
              
              await saveTrainingData({
                photoId,
                photoUrl: urlData.publicUrl,
                claudeAnalysis: analysis,
                roomName,
                roomCategory: roomType,
                fromVideo: true,
              })
              console.log(`[AI Training] Training data saved for video frame ${frameIndex}`)
            } catch (trainingError) {
              console.warn(`[AI Training] Failed to save training data for frame ${frameIndex}:`, trainingError)
              // Don't fail - photo was saved successfully
            }
          }

          return photoId
        })

      const photoResults = await Promise.all(savePhotoPromises)

      // 9.4 Salvar problemas em paralelo
      const problemPromises = analysisResults
        .filter((r): r is FrameAnalysisResult => r !== null)
        .map(({ frameIndex, analysis }, idx: number) => {
          const photoId = photoResults[idx]
          if (!photoId || !analysis.problems || analysis.problems.length === 0) {
            return Promise.resolve(0)
          }

          totalProblems += analysis.problems.length

          const problemsToInsert = analysis.problems.map((problem: PhotoAnalysisResult['problems'][0]) => ({
            inspection_id: inspectionId,
            photo_id: photoId,
            description: problem.description,
            severity: problem.severity,
            location: problem.location,
            suggested_action: problem.suggestedAction,
            ai_confidence: problem.confidence,
          }))

          return supabase
            .from('photo_problems')
            .insert(problemsToInsert)
            .then(({ error: problemsError }) => {
              if (problemsError) {
                console.error(`[Video Analysis] Problems save error for frame ${frameIndex}:`, problemsError)
                return 0
              }
              return analysis.problems.length
            })
        })

      await Promise.all(problemPromises)

      // Adicionar IDs de fotos processadas
      photoResults.forEach((id: string | null) => {
        if (id) photoIds.push(id)
      })
    }

    // 10. LIMPAR ARQUIVOS TEMPOR��RIOS
    removeTemporaryFile(tempVideoPath)
    tempVideoPath = null

    console.log('[Video Analysis] ✓ Complete', {
      framesExtracted: frames.length,
      framesProcessed: photoIds.length,
      totalProblems,
    })

    // 11. RETORNAR RESPOSTA
    return NextResponse.json({
      success: true,
      framesExtracted: frames.length,
      framesProcessed: photoIds.length,
      transcription: transcription || null,
      totalProblems,
      message: `Vídeo analisado com sucesso! ${photoIds.length} frames processados, ${totalProblems} problema(s) detectado(s).`,
    })
  } catch (error) {
    console.error('[Video Analysis] ✗ Error:', error)

    if (tempVideoPath) {
      removeTemporaryFile(tempVideoPath)
    }

    return NextResponse.json(
      {
        error: 'Failed to process video',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}

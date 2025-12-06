/**
 * API: Análise de Vídeo de Vistoria
 * POST /api/inspections/[id]/video-analysis
 *
 * Recebe vídeo → Extrai frames → Transcreve áudio → Analisa com IA
 */

import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { createAdminClient } from '@/lib/supabase/server'
import { analyzePhoto } from '@/services/ai-analysis'
import OpenAI from 'openai'
import { writeFile, unlink, mkdir, readdir } from 'fs/promises'
import { join } from 'path'
import { existsSync } from 'fs'
import ffmpeg from 'fluent-ffmpeg'

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // 1. Autenticação
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id: inspectionId } = await params
    const supabase = createAdminClient()

    const { data: user, error: userError } = await supabase
      .from('users')
      .select('id, clerk_id, email')
      .eq('clerk_id', userId)
      .single()

    if (userError || !user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // 2. Verificar se a vistoria existe e pertence ao usuário
    const { data: inspection, error: inspectionError } = await supabase
      .from('inspections')
      .select('id, property_id, user_id')
      .eq('id', inspectionId)
      .eq('user_id', user.id)
      .single()

    if (inspectionError || !inspection) {
      return NextResponse.json({ error: 'Inspection not found' }, { status: 404 })
    }

    // 3. Receber o vídeo
    const formData = await request.formData()
    const videoFile = formData.get('video') as File
    const roomId = formData.get('room_id') as string
    const roomName = formData.get('room_name') as string
    const roomType = formData.get('room_type') as string

    if (!videoFile) {
      return NextResponse.json({ error: 'No video file provided' }, { status: 400 })
    }

    // 4. Salvar vídeo temporariamente
    const bytes = await videoFile.arrayBuffer()
    const buffer = Buffer.from(bytes)

    const tempDir = join(process.cwd(), '.tmp')
    if (!existsSync(tempDir)) {
      await mkdir(tempDir, { recursive: true })
    }

    const timestamp = Date.now()
    const videoPath = join(tempDir, `video_${timestamp}.mp4`)
    await writeFile(videoPath, buffer)

    const framesDir = join(tempDir, `frames_${timestamp}`)
    await mkdir(framesDir, { recursive: true })

    let transcription = ''
    let framesAnalyzed = 0
    let totalProblems = 0

    try {
      // 5. Transcrever áudio do vídeo com Whisper
      try {
        const audioBuffer = Buffer.from(bytes)
        const transcriptionResponse = await openai.audio.transcriptions.create({
          file: new File([audioBuffer], 'video.mp4', { type: videoFile.type }),
          model: 'whisper-1',
          language: 'pt',
        })
        transcription = transcriptionResponse.text
        console.log('[Video Analysis] Transcription:', transcription)
      } catch (err) {
        console.log('[Video Analysis] Transcription failed:', err)
        // Continua sem transcrição
      }

      // 6. Extrair frames do vídeo (2 frames por segundo)
      await new Promise<void>((resolve, reject) => {
        ffmpeg(videoPath)
          .outputOptions(['-vf fps=2']) // 2 frames/segundo
          .output(join(framesDir, 'frame_%03d.jpg'))
          .on('end', () => resolve())
          .on('error', (err) => reject(err))
          .run()
      })

      // 7. Buscar frames extraídos
      const frameFiles = (await readdir(framesDir)).filter(f => f.endsWith('.jpg')).sort()
      console.log(`[Video Analysis] Extracted ${frameFiles.length} frames`)

      // 8. Upload e análise de cada frame
      for (let i = 0; i < frameFiles.length; i++) {
        const frameFile = frameFiles[i]
        const framePath = join(framesDir, frameFile)
        const frameBuffer = await readFile(framePath)

        // Upload para Supabase Storage
        const fileName = `${inspectionId}/${roomName}_frame_${i + 1}_${timestamp}.jpg`
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('inspection-photos')
          .upload(fileName, frameBuffer, {
            contentType: 'image/jpeg',
            upsert: false,
          })

        if (uploadError) {
          console.error(`[Video Analysis] Upload error frame ${i}:`, uploadError)
          continue
        }

        const { data: { publicUrl } } = supabase.storage
          .from('inspection-photos')
          .getPublicUrl(fileName)

        // Análise com IA (reusa sistema existente)
        const aiAnalysis = await analyzePhoto(publicUrl, roomName, roomType)

        // Salvar foto no banco
        const { error: photoError } = await supabase.from('inspection_photos').insert({
          inspection_id: inspectionId,
          user_id: user.id,
          room_name: roomName,
          room_category: roomType,
          storage_path: fileName,
          photo_url: publicUrl,
          ai_analyzed: true,
          ai_has_problems: aiAnalysis.hasProblems,
          ai_summary: aiAnalysis.summary,
          ai_confidence: aiAnalysis.confidence,
          from_video: true,
          frame_number: i + 1,
          video_transcription: i === 0 ? transcription : null, // Só salva no primeiro frame
        })

        if (photoError) {
          console.error(`[Video Analysis] Save photo error:`, photoError)
          continue
        }

        // Salvar problemas detectados
        if (aiAnalysis.hasProblems && aiAnalysis.problems.length > 0) {
          const { data: photoData } = await supabase
            .from('inspection_photos')
            .select('id')
            .eq('storage_path', fileName)
            .single()

          if (photoData) {
            const problemsToInsert = aiAnalysis.problems.map((p: any) => ({
              photo_id: photoData.id,
              inspection_id: inspectionId,
              description: p.description,
              severity: p.severity,
              location: p.location,
              suggested_action: p.suggestedAction,
              ai_confidence: p.confidence,
            }))

            await supabase.from('photo_problems').insert(problemsToInsert)
            totalProblems += aiAnalysis.problems.length
          }
        }

        framesAnalyzed++

        // Limpar frame local
        await unlink(framePath)
      }

      // 9. Limpar arquivos temporários
      await unlink(videoPath)
      await rmdir(framesDir)

      return NextResponse.json({
        success: true,
        framesAnalyzed,
        totalProblems,
        transcription: transcription || null,
        message: `Vídeo processado! ${framesAnalyzed} frames analisados, ${totalProblems} problema(s) detectado(s).`,
      })

    } catch (error) {
      // Limpar em caso de erro
      try {
        await unlink(videoPath)
        if (existsSync(framesDir)) {
          const files = await readdir(framesDir)
          for (const file of files) {
            await unlink(join(framesDir, file))
          }
          await rmdir(framesDir)
        }
      } catch (cleanupError) {
        console.error('[Video Analysis] Cleanup error:', cleanupError)
      }

      throw error
    }

  } catch (error) {
    console.error('Video analysis error:', error)
    return NextResponse.json(
      {
        error: 'Failed to process video',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}

// Helper para ler arquivo
async function readFile(path: string): Promise<Buffer> {
  const { readFile: fsReadFile } = await import('fs/promises')
  return fsReadFile(path)
}

// Helper para remover diretório
async function rmdir(path: string): Promise<void> {
  const { rmdir: fsRmdir } = await import('fs/promises')
  return fsRmdir(path)
}

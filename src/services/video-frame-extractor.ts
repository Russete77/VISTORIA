/**
 * Extrator de Frames de Vídeo
 * Usa FFmpeg para extrair frames de vídeos
 */

import ffmpeg from 'fluent-ffmpeg'
import fs from 'fs'
import path from 'path'
import os from 'os'
import { execSync } from 'child_process'

/**
 * Verifica se FFmpeg está instalado no sistema
 * @returns true se FFmpeg está disponível, false caso contrário
 */
export function checkFFmpegInstalled(): { installed: boolean; version?: string; error?: string } {
  try {
    const version = execSync('ffmpeg -version', { encoding: 'utf-8', stdio: ['pipe', 'pipe', 'pipe'] })
    const versionMatch = version.match(/ffmpeg version ([^\s]+)/)
    return {
      installed: true,
      version: versionMatch ? versionMatch[1] : 'unknown'
    }
  } catch (error) {
    return {
      installed: false,
      error: 'FFmpeg não encontrado. Instale FFmpeg: https://ffmpeg.org/download.html'
    }
  }
}

export async function extractFramesFromVideo(
  videoPath: string,
  fps: number = 1
): Promise<Buffer[]> {
  return new Promise((resolve, reject) => {
    // Criar diretório temporário para frames
    const tempDir = os.tmpdir()
    const framesDir = path.join(tempDir, `frames_${Date.now()}`)
    
    try {
      fs.mkdirSync(framesDir, { recursive: true })
    } catch (err) {
      reject(new Error(`Failed to create temp directory: ${err}`))
      return
    }

    const framePattern = path.join(framesDir, 'frame_%04d.png')
    
    console.log(`[FrameExtractor] Extracting frames at ${fps} fps from ${videoPath}`)
    console.log(`[FrameExtractor] Saving frames to: ${framesDir}`)

    // Timeout de 120 segundos para vídeos mais longos
    const timeout = setTimeout(() => {
      // Limpar diretório temporário
      try {
        fs.rmSync(framesDir, { recursive: true, force: true })
      } catch {}
      reject(new Error('Frame extraction timeout (120s)'))
    }, 120000)

    try {
      ffmpeg(videoPath)
        .outputOptions([
          `-vf fps=${fps}`,
          '-loglevel error',
        ])
        .output(framePattern)
        .on('end', () => {
          clearTimeout(timeout)
          
          // Ler todos os frames gerados
          try {
            const frameFiles = fs.readdirSync(framesDir)
              .filter(file => file.startsWith('frame_') && file.endsWith('.png'))
              .sort() // Garantir ordem correta
            
            console.log(`[FrameExtractor] Found ${frameFiles.length} frame files`)
            
            const frames: Buffer[] = []
            for (const file of frameFiles) {
              const framePath = path.join(framesDir, file)
              const frameBuffer = fs.readFileSync(framePath)
              frames.push(frameBuffer)
            }
            
            // Limpar diretório temporário
            try {
              fs.rmSync(framesDir, { recursive: true, force: true })
            } catch (cleanupErr) {
              console.warn('[FrameExtractor] Failed to cleanup temp directory:', cleanupErr)
            }
            
            console.log(`[FrameExtractor] Successfully extracted ${frames.length} frames`)
            resolve(frames)
          } catch (readErr) {
            // Limpar diretório temporário
            try {
              fs.rmSync(framesDir, { recursive: true, force: true })
            } catch {}
            reject(new Error(`Failed to read frame files: ${readErr}`))
          }
        })
        .on('error', (err: Error) => {
          clearTimeout(timeout)
          // Limpar diretório temporário
          try {
            fs.rmSync(framesDir, { recursive: true, force: true })
          } catch {}
          console.error('[FrameExtractor] Error:', err.message)
          reject(new Error(`FFmpeg error: ${err.message}`))
        })
        .run()
    } catch (error) {
      clearTimeout(timeout)
      // Limpar diretório temporário
      try {
        fs.rmSync(framesDir, { recursive: true, force: true })
      } catch {}
      reject(error)
    }
  })
}

export function saveTemporaryFile(buffer: Buffer, extension: string = 'mp4'): string {
  // Usar os.tmpdir() para compatibilidade com Windows, Linux e Mac
  const tempDir = os.tmpdir()
  const tempPath = path.join(tempDir, `video_${Date.now()}.${extension}`)
  fs.writeFileSync(tempPath, buffer)
  console.log(`[FrameExtractor] Temporary file saved: ${tempPath}`)
  return tempPath
}

export function removeTemporaryFile(filePath: string): void {
  try {
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath)
      console.log(`[FrameExtractor] Temporary file removed: ${filePath}`)
    }
  } catch (error) {
    console.error(`[FrameExtractor] Error removing file: ${error}`)
  }
}


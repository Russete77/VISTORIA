import { createAdminClient } from '@/lib/supabase/server'

export interface UploadResult {
  url: string
  path: string
  size: number
}

export async function uploadInspectionPhoto(
  file: File,
  inspectionId: string,
  roomName: string
): Promise<UploadResult> {
  const supabase = createAdminClient()

  try {
    // Generate unique filename
    const timestamp = Date.now()
    const extension = file.name.split('.').pop()
    const filename = `${roomName.replace(/[^a-zA-Z0-9]/g, '_')}_${timestamp}.${extension}`
    const path = `inspections/${inspectionId}/${filename}`

    // Upload to Supabase Storage
    const { data, error } = await supabase.storage
      .from('inspection-photos')
      .upload(path, file, {
        cacheControl: '3600',
        upsert: false,
      })

    if (error) throw error

    // Get public URL
    const { data: urlData } = supabase.storage
      .from('inspection-photos')
      .getPublicUrl(data.path)

    return {
      url: urlData.publicUrl,
      path: data.path,
      size: file.size,
    }
  } catch (error) {
    console.error('File upload failed:', error)
    throw new Error('Failed to upload photo')
  }
}

export async function deleteInspectionPhoto(path: string): Promise<void> {
  const supabase = createAdminClient()

  try {
    const { error } = await supabase.storage
      .from('inspection-photos')
      .remove([path])

    if (error) throw error
  } catch (error) {
    console.error('File deletion failed:', error)
    throw new Error('Failed to delete photo')
  }
}

export async function uploadSignature(
  signature: Blob,
  inspectionId: string,
  signatureType: 'inspector' | 'tenant' | 'landlord'
): Promise<string> {
  const supabase = createAdminClient()

  try {
    const timestamp = Date.now()
    const path = `signatures/${inspectionId}/${signatureType}_${timestamp}.png`

    const { data, error } = await supabase.storage
      .from('signatures')
      .upload(path, signature, {
        contentType: 'image/png',
        cacheControl: '3600',
        upsert: false,
      })

    if (error) throw error

    const { data: urlData } = supabase.storage
      .from('signatures')
      .getPublicUrl(data.path)

    return urlData.publicUrl
  } catch (error) {
    console.error('Signature upload failed:', error)
    throw new Error('Failed to upload signature')
  }
}

export function validateImageFile(file: File): { valid: boolean; error?: string } {
  const maxSize = 10 * 1024 * 1024 // 10MB
  const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/heic']

  if (!allowedTypes.includes(file.type)) {
    return {
      valid: false,
      error: 'Tipo de arquivo não suportado. Use JPEG, PNG, WebP ou HEIC.',
    }
  }

  if (file.size > maxSize) {
    return {
      valid: false,
      error: 'Arquivo muito grande. Tamanho máximo: 10MB.',
    }
  }

  return { valid: true }
}

export async function compressImage(file: File, maxWidth = 1920): Promise<File> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()

    reader.onload = (e) => {
      const img = new Image()

      img.onload = () => {
        const canvas = document.createElement('canvas')
        let width = img.width
        let height = img.height

        // Calculate new dimensions
        if (width > maxWidth) {
          height = (height * maxWidth) / width
          width = maxWidth
        }

        canvas.width = width
        canvas.height = height

        const ctx = canvas.getContext('2d')
        if (!ctx) {
          reject(new Error('Failed to get canvas context'))
          return
        }

        ctx.drawImage(img, 0, 0, width, height)

        canvas.toBlob(
          (blob) => {
            if (!blob) {
              reject(new Error('Failed to compress image'))
              return
            }

            const compressedFile = new File([blob], file.name, {
              type: 'image/jpeg',
              lastModified: Date.now(),
            })

            resolve(compressedFile)
          },
          'image/jpeg',
          0.85
        )
      }

      img.onerror = () => reject(new Error('Failed to load image'))
      img.src = e.target?.result as string
    }

    reader.onerror = () => reject(new Error('Failed to read file'))
    reader.readAsDataURL(file)
  })
}

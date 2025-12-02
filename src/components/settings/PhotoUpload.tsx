'use client'

import { useState, useRef } from 'react'
import { Camera, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'

interface PhotoUploadProps {
  currentImageUrl: string | null
  userInitials: string
  onUploadSuccess: (newImageUrl: string) => void
}

export function PhotoUpload({
  currentImageUrl,
  userInitials,
  onUploadSuccess,
}: PhotoUploadProps) {
  const [isUploading, setIsUploading] = useState(false)
  const [previewUrl, setPreviewUrl] = useState<string | null>(currentImageUrl)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    // Validate file type
    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
    if (!validTypes.includes(file.type)) {
      toast.error('Formato inválido. Use JPG, PNG ou WEBP.')
      return
    }

    // Validate file size (2MB)
    const maxSize = 2 * 1024 * 1024
    if (file.size > maxSize) {
      toast.error('Arquivo muito grande. Tamanho máximo: 2MB.')
      return
    }

    // Show preview
    const reader = new FileReader()
    reader.onloadend = () => {
      setPreviewUrl(reader.result as string)
    }
    reader.readAsDataURL(file)

    // Upload file
    setIsUploading(true)

    try {
      const formData = new FormData()
      formData.append('file', file)

      const response = await fetch('/api/user/upload-photo', {
        method: 'POST',
        body: formData,
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Upload failed')
      }

      const data = await response.json()

      setPreviewUrl(data.image_url)
      onUploadSuccess(data.image_url)
      toast.success('Foto atualizada com sucesso!')
    } catch (error) {
      console.error('Upload error:', error)
      toast.error(error instanceof Error ? error.message : 'Erro ao fazer upload da foto')
      // Revert preview
      setPreviewUrl(currentImageUrl)
    } finally {
      setIsUploading(false)
      // Reset input
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    }
  }

  const handleButtonClick = () => {
    fileInputRef.current?.click()
  }

  return (
    <div className="flex items-center gap-6">
      {/* Avatar Preview */}
      <div className="relative">
        {previewUrl ? (
          <img
            src={previewUrl}
            alt="Foto de perfil"
            className="h-20 w-20 rounded-full object-cover ring-2 ring-neutral-200"
          />
        ) : (
          <div className="flex h-20 w-20 items-center justify-center rounded-full bg-primary-100 text-2xl font-semibold text-primary-700 ring-2 ring-neutral-200">
            {userInitials}
          </div>
        )}

        {/* Loading overlay */}
        {isUploading && (
          <div className="absolute inset-0 flex items-center justify-center rounded-full bg-black/50">
            <Loader2 className="h-6 w-6 animate-spin text-white" />
          </div>
        )}
      </div>

      {/* Upload Info and Button */}
      <div>
        <p className="text-sm font-medium text-neutral-900 mb-1">Foto de Perfil</p>
        <p className="text-xs text-neutral-500 mb-3">
          JPG, PNG ou WEBP, máximo 2MB
        </p>

        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/jpg,image/png,image/webp"
          onChange={handleFileSelect}
          className="hidden"
          aria-label="Selecionar foto de perfil"
        />

        <Button
          variant="outline"
          size="sm"
          onClick={handleButtonClick}
          disabled={isUploading}
        >
          {isUploading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Enviando...
            </>
          ) : (
            <>
              <Camera className="mr-2 h-4 w-4" />
              Alterar Foto
            </>
          )}
        </Button>
      </div>
    </div>
  )
}

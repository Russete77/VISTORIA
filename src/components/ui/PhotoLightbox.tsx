'use client'

import { useEffect } from 'react'
import { X, Download } from 'lucide-react'
import { Button } from './button'

interface PhotoLightboxProps {
  isOpen: boolean
  photoUrl: string
  photoAlt?: string
  onClose: () => void
}

export function PhotoLightbox({ isOpen, photoUrl, photoAlt = 'Foto', onClose }: PhotoLightboxProps) {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = 'unset'
    }
    return () => {
      document.body.style.overflow = 'unset'
    }
  }, [isOpen])

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    if (isOpen) {
      window.addEventListener('keydown', handleEscape)
      return () => window.removeEventListener('keydown', handleEscape)
    }
  }, [isOpen, onClose])

  if (!isOpen) return null

  const handleDownload = () => {
    const link = document.createElement('a')
    link.href = photoUrl
    const timestamp = new Date().getTime()
    link.download = `foto-vistoria-${timestamp}.jpg`
    link.click()
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4"
      onClick={onClose}
    >
      {/* Header com botões */}
      <div className="absolute top-0 left-0 right-0 z-10 flex items-center justify-between p-4 bg-gradient-to-b from-black/50 to-transparent">
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={(e) => {
              e.stopPropagation()
              handleDownload()
            }}
            className="text-white hover:bg-white/20"
          >
            <Download className="h-5 w-5" />
          </Button>
        </div>
        <Button
          variant="ghost"
          size="icon"
          onClick={onClose}
          className="text-white hover:bg-white/20"
        >
          <X className="h-6 w-6" />
        </Button>
      </div>

      {/* Imagem */}
      <div
        className="relative max-w-7xl max-h-full"
        onClick={(e) => e.stopPropagation()}
      >
        <img
          src={photoUrl}
          alt={photoAlt}
          className="max-w-full max-h-[90vh] w-auto h-auto object-contain rounded-lg shadow-2xl"
        />
      </div>

      {/* Hint de fechar */}
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 text-white/70 text-sm">
        Clique fora da imagem ou pressione ESC para fechar
      </div>
    </div>
  )
}

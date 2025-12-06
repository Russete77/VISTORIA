'use client'

import { useState, useEffect } from 'react'
import { Check, FileText, Loader2, Palette, Settings2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { cn } from '@/lib/utils'
import { PDFTemplate } from '@/types/pdf-template'

interface TemplateSelectorProps {
  onSelect: (templateId: string | null) => void
  selectedTemplateId?: string | null
  trigger?: React.ReactNode
  disabled?: boolean
}

export function TemplateSelector({
  onSelect,
  selectedTemplateId,
  trigger,
  disabled = false,
}: TemplateSelectorProps) {
  const [open, setOpen] = useState(false)
  const [templates, setTemplates] = useState<PDFTemplate[]>([])
  const [loading, setLoading] = useState(false)
  const [selected, setSelected] = useState<string | null>(selectedTemplateId || null)

  useEffect(() => {
    if (open) {
      fetchTemplates()
    }
  }, [open])

  useEffect(() => {
    setSelected(selectedTemplateId || null)
  }, [selectedTemplateId])

  const fetchTemplates = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/templates')
      if (response.ok) {
        const data = await response.json()
        setTemplates(data.templates || [])
      }
    } catch (error) {
      console.error('Erro ao carregar templates:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleConfirm = () => {
    onSelect(selected)
    setOpen(false)
  }

  // Group templates by system/user
  const systemTemplates = templates.filter(t => t.is_system)
  const userTemplates = templates.filter(t => !t.is_system)

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="outline" size="sm" disabled={disabled}>
            <Palette className="mr-2 h-4 w-4" />
            Template
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Escolher Template do Laudo</DialogTitle>
          <DialogDescription>
            Selecione um template para personalizar a aparência do PDF
          </DialogDescription>
        </DialogHeader>

        {loading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-primary-600" />
          </div>
        ) : (
          <div className="space-y-4 max-h-[400px] overflow-y-auto">
            {/* Templates do Sistema */}
            {systemTemplates.length > 0 && (
              <div>
                <h4 className="text-sm font-medium text-neutral-500 mb-2">Templates Padrão</h4>
                <div className="grid grid-cols-2 gap-3">
                  {systemTemplates.map((template) => (
                    <TemplateCard
                      key={template.id}
                      template={template}
                      selected={selected === template.id}
                      onSelect={() => setSelected(template.id)}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Templates do Usuário */}
            {userTemplates.length > 0 && (
              <div>
                <h4 className="text-sm font-medium text-neutral-500 mb-2">Meus Templates</h4>
                <div className="grid grid-cols-2 gap-3">
                  {userTemplates.map((template) => (
                    <TemplateCard
                      key={template.id}
                      template={template}
                      selected={selected === template.id}
                      onSelect={() => setSelected(template.id)}
                    />
                  ))}
                </div>
              </div>
            )}

            {templates.length === 0 && (
              <div className="text-center py-8 text-neutral-500">
                <FileText className="h-12 w-12 mx-auto mb-2 opacity-50" />
                <p>Nenhum template disponível</p>
              </div>
            )}
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancelar
          </Button>
          <Button onClick={handleConfirm} disabled={loading}>
            Confirmar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

interface TemplateCardProps {
  template: PDFTemplate
  selected: boolean
  onSelect: () => void
}

function TemplateCard({ template, selected, onSelect }: TemplateCardProps) {
  const colors = template.config?.colors || {}

  return (
    <button
      onClick={onSelect}
      className={cn(
        'relative p-4 rounded-lg border-2 text-left transition-all',
        'hover:border-primary-400 hover:shadow-sm',
        selected
          ? 'border-primary-600 bg-primary-50'
          : 'border-neutral-200 bg-white'
      )}
    >
      {/* Preview de cores */}
      <div className="flex gap-1 mb-3">
        <div
          className="w-6 h-6 rounded-full border border-neutral-200"
          style={{ backgroundColor: colors.primary || '#1a56db' }}
          title="Cor primária"
        />
        <div
          className="w-6 h-6 rounded-full border border-neutral-200"
          style={{ backgroundColor: colors.secondary || '#f3f4f6' }}
          title="Cor secundária"
        />
        <div
          className="w-6 h-6 rounded-full border border-neutral-200"
          style={{ backgroundColor: colors.accent || '#7c3aed' }}
          title="Cor de destaque"
        />
      </div>

      <h5 className="font-medium text-neutral-900">{template.name}</h5>
      {template.description && (
        <p className="text-xs text-neutral-500 mt-1 line-clamp-2">
          {template.description}
        </p>
      )}

      {template.is_system && (
        <span className="absolute top-2 right-2 text-xs px-2 py-0.5 bg-neutral-100 text-neutral-600 rounded">
          Sistema
        </span>
      )}

      {selected && (
        <div className="absolute top-2 right-2">
          <Check className="h-5 w-5 text-primary-600" />
        </div>
      )}
    </button>
  )
}

/**
 * Hook para usar template selection
 */
export function useTemplateSelection() {
  const [selectedTemplateId, setSelectedTemplateId] = useState<string | null>(null)

  return {
    selectedTemplateId,
    setSelectedTemplateId,
    TemplateSelector: (props: Omit<TemplateSelectorProps, 'onSelect' | 'selectedTemplateId'>) => (
      <TemplateSelector
        {...props}
        selectedTemplateId={selectedTemplateId}
        onSelect={setSelectedTemplateId}
      />
    ),
  }
}

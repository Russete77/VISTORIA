'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Trash2, AlertTriangle, Loader2 } from 'lucide-react'
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
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import { toast } from 'sonner'

interface DeleteAccountDialogProps {
  userEmail: string
}

export function DeleteAccountDialog({ userEmail }: DeleteAccountDialogProps) {
  const router = useRouter()
  const [isOpen, setIsOpen] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [confirmEmail, setConfirmEmail] = useState('')
  const [confirmChecked, setConfirmChecked] = useState(false)

  const canDelete = confirmEmail.toLowerCase() === userEmail.toLowerCase() && confirmChecked

  const handleDelete = async () => {
    if (!canDelete) return

    setIsDeleting(true)

    try {
      const response = await fetch('/api/user/delete', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          confirmEmail,
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to delete account')
      }

      toast.success('Conta deletada com sucesso')

      // Close dialog and redirect
      setIsOpen(false)

      // Redirect to home page after a short delay
      setTimeout(() => {
        router.push('/')
      }, 1000)
    } catch (error) {
      console.error('Delete error:', error)
      toast.error(error instanceof Error ? error.message : 'Erro ao deletar conta')
      setIsDeleting(false)
    }
  }

  const handleOpenChange = (open: boolean) => {
    if (!isDeleting) {
      setIsOpen(open)
      // Reset form when closing
      if (!open) {
        setConfirmEmail('')
        setConfirmChecked(false)
      }
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button
          variant="outline"
          className="border-red-300 text-red-600 hover:bg-red-50 hover:text-red-700"
        >
          <Trash2 className="mr-2 h-4 w-4" />
          Deletar Minha Conta
        </Button>
      </DialogTrigger>

      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <div className="flex items-center gap-3 mb-2">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-red-100">
              <AlertTriangle className="h-6 w-6 text-red-600" />
            </div>
            <DialogTitle className="text-xl">Deletar Conta Permanentemente</DialogTitle>
          </div>
          <DialogDescription className="space-y-3 pt-2">
            <p className="text-sm text-neutral-600">
              Esta ação é <span className="font-semibold text-red-600">irreversível</span>.
              Ao deletar sua conta:
            </p>
            <ul className="list-disc list-inside text-sm text-neutral-600 space-y-1 ml-2">
              <li>Todos os seus imóveis serão removidos</li>
              <li>Todas as vistorias serão excluídas</li>
              <li>Todas as fotos e relatórios serão perdidos</li>
              <li>Você não poderá recuperar esses dados</li>
            </ul>
            <p className="text-sm font-semibold text-red-600 pt-2">
              Seu histórico de transações será mantido por questões legais e de auditoria.
            </p>
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Email confirmation */}
          <div className="space-y-2">
            <Label htmlFor="confirmEmail">
              Digite seu email para confirmar:{' '}
              <span className="font-semibold text-neutral-900">{userEmail}</span>
            </Label>
            <Input
              id="confirmEmail"
              type="email"
              placeholder="Digite seu email"
              value={confirmEmail}
              onChange={(e) => setConfirmEmail(e.target.value)}
              disabled={isDeleting}
              aria-label="Confirmar email para deletar conta"
            />
          </div>

          {/* Confirmation checkbox */}
          <div className="flex items-start gap-3 pt-2">
            <Checkbox
              id="confirmDelete"
              checked={confirmChecked}
              onCheckedChange={(checked) => setConfirmChecked(checked as boolean)}
              disabled={isDeleting}
            />
            <Label
              htmlFor="confirmDelete"
              className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
            >
              Entendo que esta ação é permanente e não pode ser desfeita
            </Label>
          </div>
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button
            variant="outline"
            onClick={() => handleOpenChange(false)}
            disabled={isDeleting}
          >
            Cancelar
          </Button>
          <Button
            variant="destructive"
            onClick={handleDelete}
            disabled={!canDelete || isDeleting}
            className="bg-red-600 hover:bg-red-700"
          >
            {isDeleting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Deletando...
              </>
            ) : (
              <>
                <Trash2 className="mr-2 h-4 w-4" />
                Sim, Deletar Minha Conta
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

/**
 * Comparisons List Page - VistorIA Pro
 * Lista todas as comparações do usuário
 */

'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Plus, Filter, RefreshCw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Select } from '@/components/ui/select'
import { ComparisonCard } from '@/components/comparison/ComparisonCard'
import { useComparisons } from '@/hooks/use-comparisons'
import { Skeleton } from '@/components/ui/skeleton'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'

export default function ComparisonsPage() {
  const { comparisons, isLoading, fetchComparisons, deleteComparison } = useComparisons()
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [statusFilter, setStatusFilter] = useState('all')

  const handleDelete = async () => {
    if (deleteId) {
      await deleteComparison(deleteId)
      setDeleteId(null)
    }
  }

  const filteredComparisons = comparisons.filter((comparison) => {
    if (statusFilter === 'all') return true
    return comparison.status === statusFilter
  })

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Comparações</h1>
          <p className="text-muted-foreground">
            Compare vistorias de entrada e saída para identificar danos
          </p>
        </div>
        <Button asChild>
          <Link href="/dashboard/comparisons/new">
            <Plus className="w-4 h-4 mr-2" />
            Nova Comparação
          </Link>
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-base">Filtros</CardTitle>
              <CardDescription className="text-sm">
                {filteredComparisons.length} comparação(ões) encontrada(s)
              </CardDescription>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => fetchComparisons()}
              disabled={isLoading}
            >
              <RefreshCw className={`w-4 h-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
              Atualizar
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-3">
            <Filter className="w-4 h-4 text-muted-foreground" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="flex h-9 w-full max-w-xs rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
            >
              <option value="all">Todos os status</option>
              <option value="pending">Pendente</option>
              <option value="processing">Processando</option>
              <option value="completed">Concluída</option>
              <option value="failed">Falhou</option>
            </select>
          </div>
        </CardContent>
      </Card>

      {/* Comparisons Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Card key={i}>
              <CardHeader>
                <Skeleton className="h-6 w-3/4" />
                <Skeleton className="h-4 w-1/2" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-24 w-full" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : filteredComparisons.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <div className="rounded-full bg-muted p-6 mb-4">
              <Filter className="w-12 h-12 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-semibold mb-1">Nenhuma comparação encontrada</h3>
            <p className="text-muted-foreground text-center mb-4 max-w-md">
              {statusFilter === 'all'
                ? 'Comece criando sua primeira comparação entre vistorias de entrada e saída.'
                : 'Nenhuma comparação com esse status.'}
            </p>
            {statusFilter === 'all' && (
              <Button asChild>
                <Link href="/dashboard/comparisons/new">
                  <Plus className="w-4 h-4 mr-2" />
                  Criar Primeira Comparação
                </Link>
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredComparisons.map((comparison) => (
            <ComparisonCard
              key={comparison.id}
              comparison={comparison as any}
              onDelete={setDeleteId}
            />
          ))}
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteId !== null} onOpenChange={(open) => !open && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir esta comparação? Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

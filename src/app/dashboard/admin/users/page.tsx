'use client'

import { useEffect, useState, useCallback } from 'react'
import Link from 'next/link'
import { 
  ArrowLeft, 
  Search, 
  Loader2, 
  Users,
  Edit,
  MoreHorizontal,
  CreditCard,
  Shield,
  Ban,
  CheckCircle,
  Plus,
  Minus,
  Eye,
  Mail,
  Calendar,
  FileText,
  RefreshCw,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Label } from '@/components/ui/label'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { toast } from 'sonner'

interface User {
  id: string
  clerk_id: string
  email: string
  full_name: string | null
  first_name: string | null
  last_name: string | null
  tier: string
  role: string
  credits: number
  total_vistorias: number
  created_at: string
  updated_at: string
  last_login_at: string | null
  deleted_at: string | null
  inspection_count: number
  image_url: string | null
}

export default function AdminUsersPage() {
  const [users, setUsers] = useState<User[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [tierFilter, setTierFilter] = useState('')
  const [roleFilter, setRoleFilter] = useState('')
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [total, setTotal] = useState(0)

  // Edit dialog state
  const [editingUser, setEditingUser] = useState<User | null>(null)
  const [editCredits, setEditCredits] = useState(0)
  const [editTier, setEditTier] = useState('')
  const [editRole, setEditRole] = useState('')
  const [isSaving, setIsSaving] = useState(false)
  const [creditsToAdd, setCreditsToAdd] = useState(10)

  // View dialog
  const [viewingUser, setViewingUser] = useState<User | null>(null)

  const fetchUsers = useCallback(async () => {
    setIsLoading(true)
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '20',
        ...(search && { search }),
        ...(tierFilter && tierFilter !== '__all__' && { tier: tierFilter }),
        ...(roleFilter && roleFilter !== '__all__' && { role: roleFilter }),
      })

      const res = await fetch(`/api/admin/users?${params}`)
      if (!res.ok) throw new Error('Failed to fetch')
      
      const data = await res.json()
      setUsers(data.users || [])
      setTotalPages(data.totalPages || 1)
      setTotal(data.total || 0)
    } catch (err) {
      toast.error('Erro ao carregar usuários')
      console.error(err)
    } finally {
      setIsLoading(false)
    }
  }, [page, search, tierFilter, roleFilter])

  useEffect(() => {
    fetchUsers()
  }, [fetchUsers])

  const handleEdit = (user: User) => {
    setEditingUser(user)
    setEditCredits(user.credits)
    setEditTier(user.tier)
    setEditRole(user.role || 'user')
  }

  const handleSave = async () => {
    if (!editingUser) return

    setIsSaving(true)
    try {
      const res = await fetch('/api/admin/users', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: editingUser.id,
          credits: editCredits,
          tier: editTier,
          role: editRole,
        }),
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Failed to update')
      }

      toast.success('Usuário atualizado!')
      setEditingUser(null)
      fetchUsers()
    } catch (err: any) {
      toast.error(err.message || 'Erro ao atualizar')
    } finally {
      setIsSaving(false)
    }
  }

  const handleQuickAddCredits = async (user: User, amount: number) => {
    try {
      const res = await fetch('/api/admin/users', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user.id,
          credits: user.credits + amount,
        }),
      })

      if (!res.ok) throw new Error('Failed to update')

      toast.success(`${amount > 0 ? '+' : ''}${amount} créditos para ${user.full_name || user.email}`)
      fetchUsers()
    } catch (err) {
      toast.error('Erro ao atualizar créditos')
    }
  }

  const handleBlock = async (user: User, block: boolean) => {
    try {
      const res = await fetch('/api/admin/users', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user.id,
          blocked: block,
        }),
      })

      if (!res.ok) throw new Error('Failed to update')

      toast.success(block ? 'Usuário bloqueado' : 'Usuário desbloqueado')
      fetchUsers()
    } catch (err) {
      toast.error('Erro ao atualizar')
    }
  }

  const tierLabels: Record<string, { label: string; color: string }> = {
    free: { label: 'Gratuito', color: 'bg-neutral-100 text-neutral-700' },
    pay_per_use: { label: 'Pay Per Use', color: 'bg-blue-100 text-blue-700' },
    professional: { label: 'Profissional', color: 'bg-purple-100 text-purple-700' },
    business: { label: 'Business', color: 'bg-amber-100 text-amber-700' },
    enterprise: { label: 'Enterprise', color: 'bg-green-100 text-green-700' },
  }

  const roleLabels: Record<string, { label: string; color: string }> = {
    user: { label: 'Usuário', color: 'bg-neutral-100 text-neutral-700' },
    admin: { label: 'Admin', color: 'bg-blue-100 text-blue-700' },
    super_admin: { label: 'Super Admin', color: 'bg-purple-100 text-purple-700' },
  }

  const formatDate = (dateString: string | null) => {
    if (!dateString) return '-'
    return new Date(dateString).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  return (
    <div className="space-y-6 px-4 sm:px-0">
      {/* Header */}
      <div className="flex flex-col sm:flex-row gap-4 sm:items-center sm:justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/dashboard/admin">
              <ArrowLeft className="h-5 w-5" />
            </Link>
          </Button>
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-neutral-900 flex items-center gap-2">
              <Users className="h-7 w-7 text-primary-600" />
              Gestão de Usuários
            </h1>
            <p className="text-neutral-600 mt-1">
              {total} usuários cadastrados
            </p>
          </div>
        </div>
        <Button onClick={fetchUsers} variant="outline" size="sm">
          <RefreshCw className="h-4 w-4 mr-2" />
          Atualizar
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-4 pb-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-full bg-primary-100">
                <Users className="h-5 w-5 text-primary-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-neutral-900">{total}</p>
                <p className="text-xs text-neutral-500">Total</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-full bg-green-100">
                <CreditCard className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-neutral-900">
                  {users.reduce((acc, u) => acc + u.credits, 0)}
                </p>
                <p className="text-xs text-neutral-500">Créditos Total</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-full bg-blue-100">
                <FileText className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-neutral-900">
                  {users.reduce((acc, u) => acc + u.inspection_count, 0)}
                </p>
                <p className="text-xs text-neutral-500">Vistorias Total</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-full bg-purple-100">
                <Shield className="h-5 w-5 text-purple-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-neutral-900">
                  {users.filter(u => u.role === 'admin' || u.role === 'super_admin').length}
                </p>
                <p className="text-xs text-neutral-500">Admins</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-400" />
              <Input
                placeholder="Buscar por email ou nome..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={tierFilter} onValueChange={setTierFilter}>
              <SelectTrigger className="w-full sm:w-40">
                <SelectValue placeholder="Todos planos" />
              </SelectTrigger>
              <SelectContent className="bg-white">
                <SelectItem value="__all__">Todos planos</SelectItem>
                <SelectItem value="free">Gratuito</SelectItem>
                <SelectItem value="pay_per_use">Pay Per Use</SelectItem>
                <SelectItem value="professional">Profissional</SelectItem>
                <SelectItem value="business">Business</SelectItem>
                <SelectItem value="enterprise">Enterprise</SelectItem>
              </SelectContent>
            </Select>
            <Select value={roleFilter} onValueChange={setRoleFilter}>
              <SelectTrigger className="w-full sm:w-36">
                <SelectValue placeholder="Todas roles" />
              </SelectTrigger>
              <SelectContent className="bg-white">
                <SelectItem value="__all__">Todas roles</SelectItem>
                <SelectItem value="user">Usuário</SelectItem>
                <SelectItem value="admin">Admin</SelectItem>
                <SelectItem value="super_admin">Super Admin</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Users Table */}
      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary-600" />
            </div>
          ) : users.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-neutral-500">
              <Users className="h-12 w-12 mb-4 opacity-50" />
              <p>Nenhum usuário encontrado</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-neutral-50 border-b">
                  <tr>
                    <th className="text-left px-4 py-3 text-sm font-medium text-neutral-600">Usuário</th>
                    <th className="text-left px-4 py-3 text-sm font-medium text-neutral-600">Plano / Role</th>
                    <th className="text-center px-4 py-3 text-sm font-medium text-neutral-600">Créditos</th>
                    <th className="text-center px-4 py-3 text-sm font-medium text-neutral-600">Vistorias</th>
                    <th className="text-left px-4 py-3 text-sm font-medium text-neutral-600">Último Acesso</th>
                    <th className="text-right px-4 py-3 text-sm font-medium text-neutral-600">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-100">
                  {users.map((user) => (
                    <tr key={user.id} className={user.deleted_at ? 'bg-red-50 opacity-60' : 'hover:bg-neutral-50'}>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          {user.image_url ? (
                            <img src={user.image_url} alt="" className="w-10 h-10 rounded-full object-cover" />
                          ) : (
                            <div className="w-10 h-10 rounded-full bg-primary-100 flex items-center justify-center text-primary-700 font-semibold">
                              {(user.full_name || user.email)[0].toUpperCase()}
                            </div>
                          )}
                          <div>
                            <p className="font-medium text-neutral-900">{user.full_name || 'Sem nome'}</p>
                            <p className="text-sm text-neutral-500">{user.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex flex-col gap-1">
                          <Badge className={tierLabels[user.tier]?.color || 'bg-neutral-100'}>
                            {tierLabels[user.tier]?.label || user.tier}
                          </Badge>
                          <Badge className={roleLabels[user.role]?.color || 'bg-neutral-100'} variant="outline">
                            {roleLabels[user.role]?.label || user.role || 'user'}
                          </Badge>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-center gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6"
                            onClick={() => handleQuickAddCredits(user, -1)}
                          >
                            <Minus className="h-3 w-3" />
                          </Button>
                          <span className="font-semibold text-primary-600 min-w-[40px] text-center">
                            {user.credits}
                          </span>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6"
                            onClick={() => handleQuickAddCredits(user, 1)}
                          >
                            <Plus className="h-3 w-3" />
                          </Button>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-center font-medium">
                        {user.inspection_count}
                      </td>
                      <td className="px-4 py-3 text-sm text-neutral-500">
                        {formatDate(user.last_login_at)}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="bg-white">
                            <DropdownMenuItem onClick={() => setViewingUser(user)}>
                              <Eye className="h-4 w-4 mr-2" />
                              Ver Detalhes
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleEdit(user)}>
                              <Edit className="h-4 w-4 mr-2" />
                              Editar
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleQuickAddCredits(user, 10)}>
                              <Plus className="h-4 w-4 mr-2" />
                              +10 Créditos
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleQuickAddCredits(user, 50)}>
                              <CreditCard className="h-4 w-4 mr-2" />
                              +50 Créditos
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            {user.deleted_at ? (
                              <DropdownMenuItem onClick={() => handleBlock(user, false)}>
                                <CheckCircle className="h-4 w-4 mr-2" />
                                Desbloquear
                              </DropdownMenuItem>
                            ) : (
                              <DropdownMenuItem 
                                onClick={() => handleBlock(user, true)}
                                className="text-red-600"
                              >
                                <Ban className="h-4 w-4 mr-2" />
                                Bloquear
                              </DropdownMenuItem>
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPage(p => Math.max(1, p - 1))}
            disabled={page === 1}
          >
            Anterior
          </Button>
          <span className="text-sm text-neutral-600">
            Página {page} de {totalPages}
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPage(p => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
          >
            Próxima
          </Button>
        </div>
      )}

      {/* View User Dialog */}
      <Dialog open={!!viewingUser} onOpenChange={() => setViewingUser(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-3">
              {viewingUser?.image_url ? (
                <img src={viewingUser.image_url} alt="" className="w-12 h-12 rounded-full object-cover" />
              ) : (
                <div className="w-12 h-12 rounded-full bg-primary-100 flex items-center justify-center text-primary-700 font-bold text-lg">
                  {(viewingUser?.full_name || viewingUser?.email || 'U')[0].toUpperCase()}
                </div>
              )}
              <div>
                <p>{viewingUser?.full_name || 'Sem nome'}</p>
                <p className="text-sm font-normal text-neutral-500">{viewingUser?.email}</p>
              </div>
            </DialogTitle>
          </DialogHeader>
          
          {viewingUser && (
            <div className="space-y-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="p-3 bg-neutral-50 rounded-lg">
                  <p className="text-xs text-neutral-500 mb-1">Plano</p>
                  <Badge className={tierLabels[viewingUser.tier]?.color || 'bg-neutral-100'}>
                    {tierLabels[viewingUser.tier]?.label || viewingUser.tier}
                  </Badge>
                </div>
                <div className="p-3 bg-neutral-50 rounded-lg">
                  <p className="text-xs text-neutral-500 mb-1">Role</p>
                  <Badge className={roleLabels[viewingUser.role]?.color || 'bg-neutral-100'}>
                    {roleLabels[viewingUser.role]?.label || viewingUser.role || 'user'}
                  </Badge>
                </div>
                <div className="p-3 bg-neutral-50 rounded-lg">
                  <p className="text-xs text-neutral-500 mb-1">Créditos</p>
                  <p className="text-2xl font-bold text-primary-600">{viewingUser.credits}</p>
                </div>
                <div className="p-3 bg-neutral-50 rounded-lg">
                  <p className="text-xs text-neutral-500 mb-1">Vistorias</p>
                  <p className="text-2xl font-bold text-neutral-900">{viewingUser.inspection_count}</p>
                </div>
              </div>
              
              <div className="space-y-2 text-sm">
                <div className="flex justify-between py-2 border-b">
                  <span className="text-neutral-500">ID</span>
                  <span className="font-mono text-xs">{viewingUser.id}</span>
                </div>
                <div className="flex justify-between py-2 border-b">
                  <span className="text-neutral-500">Clerk ID</span>
                  <span className="font-mono text-xs">{viewingUser.clerk_id}</span>
                </div>
                <div className="flex justify-between py-2 border-b">
                  <span className="text-neutral-500">Cadastro</span>
                  <span>{formatDate(viewingUser.created_at)}</span>
                </div>
                <div className="flex justify-between py-2 border-b">
                  <span className="text-neutral-500">Último Acesso</span>
                  <span>{formatDate(viewingUser.last_login_at)}</span>
                </div>
                <div className="flex justify-between py-2">
                  <span className="text-neutral-500">Status</span>
                  <Badge className={viewingUser.deleted_at ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}>
                    {viewingUser.deleted_at ? 'Bloqueado' : 'Ativo'}
                  </Badge>
                </div>
              </div>

              {/* Quick Actions */}
              <div className="flex gap-2 pt-4">
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="flex-1"
                  onClick={() => {
                    setViewingUser(null)
                    handleEdit(viewingUser)
                  }}
                >
                  <Edit className="h-4 w-4 mr-2" />
                  Editar
                </Button>
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="flex-1"
                  onClick={() => handleQuickAddCredits(viewingUser, 10)}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  +10 Créditos
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={!!editingUser} onOpenChange={() => setEditingUser(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Editar Usuário</DialogTitle>
            <DialogDescription>
              {editingUser?.full_name || editingUser?.email}
            </DialogDescription>
          </DialogHeader>
          
          <Tabs defaultValue="credits" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="credits">Créditos</TabsTrigger>
              <TabsTrigger value="plan">Plano</TabsTrigger>
              <TabsTrigger value="role">Role</TabsTrigger>
            </TabsList>
            
            <TabsContent value="credits" className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>Créditos Atuais</Label>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => setEditCredits(c => Math.max(0, c - 1))}
                  >
                    <Minus className="h-4 w-4" />
                  </Button>
                  <Input
                    type="number"
                    value={editCredits}
                    onChange={(e) => setEditCredits(Math.max(0, parseInt(e.target.value) || 0))}
                    className="text-center text-xl font-bold"
                  />
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => setEditCredits(c => c + 1)}
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              
              <div className="space-y-2">
                <Label>Adicionar Rápido</Label>
                <div className="grid grid-cols-4 gap-2">
                  {[5, 10, 25, 50].map(amount => (
                    <Button
                      key={amount}
                      variant="outline"
                      size="sm"
                      onClick={() => setEditCredits(c => c + amount)}
                    >
                      +{amount}
                    </Button>
                  ))}
                </div>
              </div>
            </TabsContent>
            
            <TabsContent value="plan" className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>Plano</Label>
                <Select value={editTier} onValueChange={setEditTier}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-white">
                    <SelectItem value="free">Gratuito</SelectItem>
                    <SelectItem value="pay_per_use">Pay Per Use</SelectItem>
                    <SelectItem value="professional">Profissional</SelectItem>
                    <SelectItem value="business">Business</SelectItem>
                    <SelectItem value="enterprise">Enterprise</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </TabsContent>
            
            <TabsContent value="role" className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>Role / Permissão</Label>
                <Select value={editRole} onValueChange={setEditRole}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-white">
                    <SelectItem value="user">Usuário</SelectItem>
                    <SelectItem value="admin">Admin</SelectItem>
                    <SelectItem value="super_admin">Super Admin</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-xs text-neutral-500">
                  Admins podem acessar o painel administrativo
                </p>
              </div>
            </TabsContent>
          </Tabs>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditingUser(null)}>
              Cancelar
            </Button>
            <Button onClick={handleSave} disabled={isSaving}>
              {isSaving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              Salvar Alterações
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

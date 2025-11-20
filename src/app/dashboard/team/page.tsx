'use client'

import { useState } from 'react'
import Link from 'next/link'
import {
  Users, Crown, Shield, Plus, Mail, MoreVertical, Trash2, Search,
  ClipboardCheck, Calendar, Activity,
  FileText, AlertCircle, CheckCircle2
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { useAuth } from '@/hooks/use-auth'
import { useTeam, useTeamActivity } from '@/hooks/use-team'
import { PRICING } from '@/lib/constants'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from '@/components/ui/dropdown-menu'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Progress } from '@/components/ui/progress'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import type { TeamRole } from '@/types/database'

/**
 * Team Page - VistorIA Pro
 * Complete team management interface for all plans (with different limits)
 */

const ROLE_LABELS = {
  owner: 'Gestor Principal',
  admin: 'Gestor',
  member: 'Vistoriador',
  viewer: 'Consultor',
}

const ROLE_DESCRIPTIONS = {
  owner: 'Acesso total incluindo billing e configurações da conta',
  admin: 'Pode gerenciar equipe, imóveis e todas as vistorias',
  member: 'Pode realizar vistorias, adicionar fotos e gerar laudos',
  viewer: 'Apenas consulta de vistorias e laudos, sem edição',
}

const ROLE_COLORS = {
  owner: 'bg-yellow-50 text-yellow-700 border-yellow-200',
  admin: 'bg-blue-50 text-blue-700 border-blue-200',
  member: 'bg-green-50 text-green-700 border-green-200',
  viewer: 'bg-gray-50 text-gray-700 border-gray-200',
}

const ACTION_LABELS: Record<string, string> = {
  invited_team_member: 'convidou para equipe',
  removed_team_member: 'removeu da equipe',
  changed_member_role: 'alterou função de',
  completed_inspection: 'completou vistoria',
  generated_report: 'gerou laudo',
  created_property: 'adicionou imóvel',
  updated_property: 'atualizou imóvel',
  deleted_property: 'removeu imóvel',
}

export default function TeamPage() {
  const { user, isLoading: authLoading, isDeveloper } = useAuth()
  const {
    members,
    stats,
    limits,
    isLoading: teamLoading,
    error: teamError,
    inviteMember,
    removeMember,
    updateMemberRole,
    fetchTeam,
  } = useTeam()

  const {
    activities,
    isLoading: activityLoading,
  } = useTeamActivity({ limit: 10 })

  const [isAddMemberOpen, setIsAddMemberOpen] = useState(false)
  const [newMemberEmail, setNewMemberEmail] = useState('')
  const [newMemberRole, setNewMemberRole] = useState<TeamRole>('member')
  const [searchQuery, setSearchQuery] = useState('')
  const [filterRole, setFilterRole] = useState<string>('all')
  const [filterStatus, setFilterStatus] = useState<string>('all')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const isLoading = authLoading || teamLoading

  const handleAddMember = async () => {
    if (!newMemberEmail || !limits.canAddMore) return

    setIsSubmitting(true)
    try {
      await inviteMember(newMemberEmail, newMemberRole)
      setNewMemberEmail('')
      setNewMemberRole('member')
      setIsAddMemberOpen(false)
    } catch (error) {
      // Error is handled by the hook
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleRemoveMember = async (memberId: string) => {
    if (!confirm('Tem certeza que deseja remover este membro da equipe?')) {
      return
    }

    try {
      await removeMember(memberId)
    } catch (error) {
      // Error is handled by the hook
    }
  }

  const handleChangeRole = async (memberId: string, newRole: TeamRole) => {
    try {
      await updateMemberRole(memberId, newRole)
    } catch (error) {
      // Error is handled by the hook
    }
  }

  // Apply filters
  const applyFilters = () => {
    const filters: { role?: string; status?: string; search?: string } = {}

    if (filterRole !== 'all') filters.role = filterRole
    if (filterStatus !== 'all') filters.status = filterStatus
    if (searchQuery) filters.search = searchQuery

    fetchTeam(filters)
  }

  // Filter members locally for immediate feedback
  const filteredMembers = members.filter(member => {
    const matchesSearch = searchQuery
      ? member.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        member.email.toLowerCase().includes(searchQuery.toLowerCase())
      : true
    const matchesRole = filterRole === 'all' || member.role === filterRole
    const matchesStatus = filterStatus === 'all' || member.status === filterStatus
    return matchesSearch && matchesRole && matchesStatus
  })

  // Upsell for free/pay-per-use users
  const needsUpgrade = user?.tier === 'free' || user?.tier === 'pay_per_use'

  if (needsUpgrade && !isDeveloper) {
    return (
      <div className="space-y-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-neutral-900 mb-2">
            Equipe
          </h1>
          <p className="text-neutral-600">
            Colabore com vistoriadores e gerencie permissões
          </p>
        </div>

        <Card className="border-primary-200 bg-gradient-to-br from-primary-50 to-white">
          <CardContent className="p-8 md:p-12">
            <div className="flex flex-col items-center text-center max-w-3xl mx-auto">
              <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-primary-100">
                <Users className="h-10 w-10 text-primary-600" />
              </div>

              <Badge className="mb-4 bg-primary-600 text-white px-4 py-1">
                Disponível no Plano Professional e superior
              </Badge>

              <h2 className="text-3xl font-bold text-neutral-900 mb-4">
                Trabalhe em Equipe
              </h2>

              <p className="text-lg text-neutral-600 mb-8 max-w-2xl">
                Expanda sua operação! Adicione vistoriadores, delegue vistorias, controle permissões e
                acompanhe a produtividade da sua equipe em tempo real.
              </p>

              <div className="grid gap-4 md:grid-cols-2 w-full mb-8">
                <div className="p-4 border border-neutral-200 rounded-lg text-left">
                  <p className="font-semibold text-neutral-900 mb-1">Plano Professional</p>
                  <p className="text-2xl font-bold text-primary-600 mb-2">Até 3 vistoriadores</p>
                  <p className="text-sm text-neutral-600">R$ 299/mês</p>
                </div>
                <div className="p-4 border-2 border-primary-300 rounded-lg text-left bg-primary-50/30">
                  <p className="font-semibold text-neutral-900 mb-1">Plano Business</p>
                  <p className="text-2xl font-bold text-primary-600 mb-2">Até 10 vistoriadores</p>
                  <p className="text-sm text-neutral-600">R$ 699/mês</p>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-4">
                <Button asChild size="lg" className="min-w-[200px]">
                  <Link href="/dashboard/billing/plans">
                    Ver Planos
                  </Link>
                </Button>
                <Button asChild variant="outline" size="lg" className="min-w-[200px]">
                  <Link href="/dashboard/billing">
                    Gerenciar Assinatura
                  </Link>
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Show team management interface
  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-neutral-900 mb-2">
            Equipe
          </h1>
          <p className="text-neutral-600">
            Gerencie vistoriadores, permissões e acompanhe a produtividade
          </p>
        </div>

        <Dialog open={isAddMemberOpen} onOpenChange={setIsAddMemberOpen}>
          <DialogTrigger asChild>
            <Button size="lg" disabled={!limits.canAddMore || isLoading}>
              <Plus className="h-4 w-4 mr-2" />
              Adicionar Vistoriador
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Adicionar Profissional à Equipe</DialogTitle>
              <DialogDescription>
                Convide um vistoriador ou gestor para colaborar nas vistorias.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="nome@exemplo.com"
                  value={newMemberEmail}
                  onChange={(e) => setNewMemberEmail(e.target.value)}
                  disabled={isSubmitting}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="role">Função</Label>
                <Select
                  value={newMemberRole}
                  onValueChange={(value) => setNewMemberRole(value as TeamRole)}
                  disabled={isSubmitting}
                >
                  <SelectTrigger id="role">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="admin">
                      <div>
                        <div className="font-semibold">{ROLE_LABELS.admin}</div>
                        <div className="text-xs text-neutral-500">{ROLE_DESCRIPTIONS.admin}</div>
                      </div>
                    </SelectItem>
                    <SelectItem value="member">
                      <div>
                        <div className="font-semibold">{ROLE_LABELS.member}</div>
                        <div className="text-xs text-neutral-500">{ROLE_DESCRIPTIONS.member}</div>
                      </div>
                    </SelectItem>
                    <SelectItem value="viewer">
                      <div>
                        <div className="font-semibold">{ROLE_LABELS.viewer}</div>
                        <div className="text-xs text-neutral-500">{ROLE_DESCRIPTIONS.viewer}</div>
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="flex justify-end gap-3">
              <Button
                variant="outline"
                onClick={() => setIsAddMemberOpen(false)}
                disabled={isSubmitting}
              >
                Cancelar
              </Button>
              <Button
                onClick={handleAddMember}
                disabled={!newMemberEmail || isSubmitting}
              >
                {isSubmitting ? 'Enviando...' : 'Enviar Convite'}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Error State */}
      {teamError && (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="p-4">
            <p className="text-red-800">{teamError}</p>
          </CardContent>
        </Card>
      )}

      {/* Plan Limit Banner */}
      <Card className={limits.canAddMore ? "border-neutral-200" : "border-orange-200 bg-orange-50"}>
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2">
                <Users className="h-5 w-5 text-neutral-600" />
                <span className="font-semibold">{limits.current} / {limits.max} Vistoriadores</span>
              </div>
              <Progress value={(limits.current / limits.max) * 100} className="w-32" />
            </div>
            {!limits.canAddMore && (
              <div className="flex items-center gap-3">
                <p className="text-sm text-orange-700">Limite do plano atingido</p>
                <Button asChild size="sm" variant="outline">
                  <Link href="/dashboard/billing/plans">
                    Fazer Upgrade
                  </Link>
                </Button>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary-100">
                <Users className="h-6 w-6 text-primary-600" />
              </div>
              <div>
                <p className="text-sm text-neutral-600">Profissionais</p>
                <p className="text-2xl font-bold text-neutral-900">{stats.active}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-green-100">
                <ClipboardCheck className="h-6 w-6 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-neutral-600">Vistorias</p>
                <p className="text-2xl font-bold text-neutral-900">{stats.totalInspections}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-blue-100">
                <FileText className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-neutral-600">Laudos Gerados</p>
                <p className="text-2xl font-bold text-neutral-900">{stats.totalReports}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-yellow-100">
                <Mail className="h-6 w-6 text-yellow-600" />
              </div>
              <div>
                <p className="text-sm text-neutral-600">Pendentes</p>
                <p className="text-2xl font-bold text-neutral-900">{stats.pending}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="members" className="space-y-4">
        <TabsList>
          <TabsTrigger value="members">
            <Users className="h-4 w-4 mr-2" />
            Vistoriadores
          </TabsTrigger>
          <TabsTrigger value="activity">
            <Activity className="h-4 w-4 mr-2" />
            Atividade Recente
          </TabsTrigger>
        </TabsList>

        {/* Members Tab */}
        <TabsContent value="members" className="space-y-4">
          {/* Filters */}
          <Card>
            <CardContent className="p-4">
              <div className="flex flex-col md:flex-row gap-4">
                <div className="flex-1">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-neutral-400" />
                    <Input
                      placeholder="Buscar por nome ou email..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      onBlur={applyFilters}
                      className="pl-9"
                    />
                  </div>
                </div>
                <Select value={filterRole} onValueChange={(value) => {
                  setFilterRole(value)
                  setTimeout(applyFilters, 0)
                }}>
                  <SelectTrigger className="w-full md:w-[180px]">
                    <SelectValue placeholder="Todas as funções" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todas as funções</SelectItem>
                    <SelectItem value="admin">Gestores</SelectItem>
                    <SelectItem value="member">Vistoriadores</SelectItem>
                    <SelectItem value="viewer">Consultores</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={filterStatus} onValueChange={(value) => {
                  setFilterStatus(value)
                  setTimeout(applyFilters, 0)
                }}>
                  <SelectTrigger className="w-full md:w-[180px]">
                    <SelectValue placeholder="Todos os status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos os status</SelectItem>
                    <SelectItem value="active">Ativos</SelectItem>
                    <SelectItem value="pending">Pendentes</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Members Table */}
          <Card>
            <CardHeader>
              <CardTitle>Equipe de Vistoriadores ({filteredMembers.length})</CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="text-center py-8 text-neutral-600">
                  Carregando equipe...
                </div>
              ) : filteredMembers.length === 0 ? (
                <div className="text-center py-8 text-neutral-600">
                  Nenhum membro encontrado
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Profissional</TableHead>
                      <TableHead>Função</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Vistorias</TableHead>
                      <TableHead className="text-right">Laudos</TableHead>
                      <TableHead>Última Atividade</TableHead>
                      <TableHead className="w-[50px]"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredMembers.map((member) => (
                      <TableRow key={member.id}>
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary-100 text-primary-600 font-semibold">
                              {member.name.charAt(0).toUpperCase()}
                            </div>
                            <div>
                              <p className="font-semibold text-neutral-900">{member.name}</p>
                              <p className="text-sm text-neutral-600">{member.email}</p>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className={ROLE_COLORS[member.role]}>
                            {member.role === 'owner' && <Crown className="h-3 w-3 mr-1" />}
                            {ROLE_LABELS[member.role]}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant={member.status === 'active' ? 'default' : 'secondary'}>
                            {member.status === 'active' ? (
                              <><CheckCircle2 className="h-3 w-3 mr-1" /> Ativo</>
                            ) : (
                              <><AlertCircle className="h-3 w-3 mr-1" /> Pendente</>
                            )}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right font-semibold">{member.inspections_count}</TableCell>
                        <TableCell className="text-right font-semibold">{member.reports_generated}</TableCell>
                        <TableCell>
                          <div className="text-sm">
                            {!member.last_active_at ? (
                              <span className="text-neutral-500">Nunca</span>
                            ) : (
                              <span>{new Date(member.last_active_at).toLocaleDateString('pt-BR')}</span>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          {member.role !== 'owner' && (
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="sm">
                                  <MoreVertical className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuLabel>Alterar Função</DropdownMenuLabel>
                                <DropdownMenuItem onClick={() => handleChangeRole(member.id, 'admin')}>
                                  Tornar Gestor
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => handleChangeRole(member.id, 'member')}>
                                  Tornar Vistoriador
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => handleChangeRole(member.id, 'viewer')}>
                                  Tornar Consultor
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem
                                  className="text-red-600"
                                  onClick={() => handleRemoveMember(member.id)}
                                >
                                  <Trash2 className="h-4 w-4 mr-2" />
                                  Remover da Equipe
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Activity Tab */}
        <TabsContent value="activity" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Atividade Recente da Equipe</CardTitle>
            </CardHeader>
            <CardContent>
              {activityLoading ? (
                <div className="text-center py-8 text-neutral-600">
                  Carregando atividades...
                </div>
              ) : activities.length === 0 ? (
                <div className="text-center py-8 text-neutral-600">
                  Nenhuma atividade registrada ainda
                </div>
              ) : (
                <div className="space-y-4">
                  {activities.map((activity) => (
                    <div key={activity.id} className="flex items-start gap-4 p-4 border border-neutral-200 rounded-lg">
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-neutral-100 flex-shrink-0">
                        <Activity className="h-5 w-5 text-neutral-600" />
                      </div>
                      <div className="flex-1">
                        <p className="text-sm">
                          <span className="font-semibold text-neutral-900">
                            {activity.team_member?.name || 'Usuário'}
                          </span>
                          {' '}{ACTION_LABELS[activity.action] || activity.action}{' '}
                          {activity.entity_type && (
                            <span className="font-medium text-primary-600">
                              {activity.metadata && typeof activity.metadata === 'object' && 'property_name' in activity.metadata
                                ? String(activity.metadata.property_name)
                                : activity.entity_type}
                            </span>
                          )}
                        </p>
                        <p className="text-xs text-neutral-500 mt-1">
                          <Calendar className="h-3 w-3 inline mr-1" />
                          {new Date(activity.created_at).toLocaleString('pt-BR')}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Developer Notice */}
      {isDeveloper && (
        <Card className="border-yellow-200 bg-yellow-50">
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              <Shield className="h-5 w-5 text-yellow-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-yellow-900">Modo Desenvolvedor Ativo</p>
                <p className="text-sm text-yellow-700">
                  Você tem acesso completo e sem limites. Os dados exibidos vêm do banco de dados real.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

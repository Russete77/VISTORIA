'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { User, Bell, Shield, Trash2, Download, Save, Loader2, ExternalLink, Settings2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Checkbox } from '@/components/ui/checkbox'
import { Skeleton } from '@/components/ui/skeleton'
import { Switch } from '@/components/ui/switch'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Badge } from '@/components/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { toast } from 'sonner'
import { useAuth } from '@/hooks/use-auth'
import { useUserSettings, getStrictnessInfo } from '@/hooks/use-user-settings'
import { PhotoUpload } from '@/components/settings/PhotoUpload'
import { DeleteAccountDialog } from '@/components/settings/DeleteAccountDialog'
import type { UserPreferences, AIStrictnessLevel } from '@/types/database'

/**
 * Settings Page - VistorIA Pro
 * User profile, preferences, features configuration, and account management
 */

export default function SettingsPage() {
  const router = useRouter()
  const { user: dbUser, clerkUser, isLoading: isAuthLoading, refreshUser } = useAuth()
  const { settings: userSettings, loading: settingsLoading, updateSettings } = useUserSettings()

  // Loading states
  const [isSavingProfile, setIsSavingProfile] = useState(false)
  const [isSavingPreferences, setIsSavingPreferences] = useState(false)
  const [isExporting, setIsExporting] = useState(false)

  // Profile state
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [imageUrl, setImageUrl] = useState<string | null>(null)

  // Preferences state
  const [language, setLanguage] = useState('pt-BR')
  const [emailNotifications, setEmailNotifications] = useState(true)
  const [pushNotifications, setPushNotifications] = useState(false)
  const [marketingEmails, setMarketingEmails] = useState(false)
  const [weeklyReports, setWeeklyReports] = useState(false)

  // Sync user data to state when loaded
  useEffect(() => {
    if (dbUser) {
      setFirstName(dbUser.first_name || '')
      setLastName(dbUser.last_name || '')
      setImageUrl(dbUser.image_url)

      // Load preferences
      const prefs = dbUser.preferences as UserPreferences | undefined
      if (prefs) {
        setLanguage(prefs.language || 'pt-BR')
        setEmailNotifications(prefs.email_notifications ?? true)
        setPushNotifications(prefs.push_notifications ?? false)
        setMarketingEmails(prefs.marketing_emails ?? false)
        setWeeklyReports(prefs.weekly_reports ?? false)
      }
    }
  }, [dbUser])

  const handleSaveProfile = async () => {
    setIsSavingProfile(true)

    try {
      const response = await fetch('/api/user', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          first_name: firstName,
          last_name: lastName,
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to save profile')
      }

      await refreshUser()
      toast.success('Perfil atualizado com sucesso!')
    } catch (error) {
      console.error('Save profile error:', error)
      toast.error(error instanceof Error ? error.message : 'Erro ao salvar perfil')
    } finally {
      setIsSavingProfile(false)
    }
  }

  const handleSavePreferences = async () => {
    setIsSavingPreferences(true)

    try {
      const preferences: UserPreferences = {
        language,
        email_notifications: emailNotifications,
        push_notifications: pushNotifications,
        marketing_emails: marketingEmails,
        weekly_reports: weeklyReports,
      }

      const response = await fetch('/api/user', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          preferences,
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to save preferences')
      }

      await refreshUser()
      toast.success('Preferências salvas com sucesso!')
    } catch (error) {
      console.error('Save preferences error:', error)
      toast.error(error instanceof Error ? error.message : 'Erro ao salvar preferências')
    } finally {
      setIsSavingPreferences(false)
    }
  }

  const handleExportData = async () => {
    setIsExporting(true)

    try {
      const response = await fetch('/api/user/export', {
        method: 'POST',
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to export data')
      }

      // Download the JSON file
      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `vistoria-pro-data-${Date.now()}.json`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)

      toast.success('Dados exportados com sucesso!')
    } catch (error) {
      console.error('Export error:', error)
      toast.error(error instanceof Error ? error.message : 'Erro ao exportar dados')
    } finally {
      setIsExporting(false)
    }
  }

  const handlePhotoUploadSuccess = (newImageUrl: string) => {
    setImageUrl(newImageUrl)
    refreshUser()
  }

  const handleChangePassword = () => {
    router.push('/user-profile')
  }

  // Show loading skeleton while auth or settings are loading
  if (isAuthLoading || !dbUser || settingsLoading) {
    return (
      <div className="space-y-8">
        <div>
          <Skeleton className="h-9 w-48 mb-2" />
          <Skeleton className="h-5 w-96" />
        </div>
        <Skeleton className="h-96 w-full" />
      </div>
    )
  }

  const userInitials = `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase() || 'U'
  const userEmail = dbUser.email

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-neutral-900 mb-2">
          Configurações
        </h1>
        <p className="text-neutral-600">
          Gerencie suas informações pessoais e preferências
        </p>
      </div>

      {/* Settings Tabs */}
      <Tabs defaultValue="profile" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4 lg:w-[550px]">
          <TabsTrigger value="profile">Perfil</TabsTrigger>
          <TabsTrigger value="preferences">Preferências</TabsTrigger>
          <TabsTrigger value="features">Funcionalidades</TabsTrigger>
          <TabsTrigger value="account">Conta</TabsTrigger>
        </TabsList>

        {/* Profile Tab */}
        <TabsContent value="profile" className="space-y-6">
          <Card className="border-neutral-200 bg-white">
            <CardHeader className="pb-4">
              <div className="flex items-center gap-3">
                <User className="h-5 w-5 text-primary-600" />
                <CardTitle className="text-lg font-semibold">Informações Pessoais</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Profile Photo */}
              <PhotoUpload
                currentImageUrl={imageUrl}
                userInitials={userInitials}
                onUploadSuccess={handlePhotoUploadSuccess}
              />

              {/* Name Fields */}
              <div className="grid gap-6 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="firstName">Nome</Label>
                  <Input
                    id="firstName"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    placeholder="Seu nome"
                    disabled={isSavingProfile}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="lastName">Sobrenome</Label>
                  <Input
                    id="lastName"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    placeholder="Seu sobrenome"
                    disabled={isSavingProfile}
                  />
                </div>
              </div>

              {/* Email (readonly) */}
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={userEmail}
                  disabled
                  className="bg-neutral-50"
                />
                <p className="text-xs text-neutral-500">
                  Email não pode ser alterado. Gerenciado pelo Clerk.
                </p>
              </div>

              {/* Account Info */}
              <div className="pt-4 border-t border-neutral-200 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-neutral-600">Membro desde</span>
                  <span className="font-medium text-neutral-900">
                    {new Intl.DateTimeFormat('pt-BR', {
                      day: 'numeric',
                      month: 'long',
                      year: 'numeric',
                    }).format(new Date(dbUser.created_at))}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-neutral-600">Último acesso</span>
                  <span className="font-medium text-neutral-900">
                    {dbUser.last_login_at
                      ? new Intl.DateTimeFormat('pt-BR', {
                          day: 'numeric',
                          month: 'short',
                          hour: '2-digit',
                          minute: '2-digit',
                        }).format(new Date(dbUser.last_login_at))
                      : 'Nunca'}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-neutral-600">Plano</span>
                  <span className="font-medium text-neutral-900 capitalize">
                    {dbUser.tier === 'pay_per_use' ? 'Pay per Use' : dbUser.tier}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-neutral-600">Créditos</span>
                  <span className="font-semibold text-primary-600">
                    {dbUser.credits} {dbUser.credits === 1 ? 'crédito' : 'créditos'}
                  </span>
                </div>
              </div>

              {/* Save Button */}
              <div className="flex justify-end pt-4">
                <Button onClick={handleSaveProfile} disabled={isSavingProfile}>
                  {isSavingProfile ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Salvando...
                    </>
                  ) : (
                    <>
                      <Save className="mr-2 h-4 w-4" />
                      Salvar Alterações
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Preferences Tab */}
        <TabsContent value="preferences" className="space-y-6">
          {/* Language & Region */}
          <Card className="border-neutral-200 bg-white">
            <CardHeader className="pb-4">
              <CardTitle className="text-lg font-semibold">Idioma e Região</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="language">Idioma</Label>
                <Select value={language} onValueChange={setLanguage} disabled={isSavingPreferences}>
                  <SelectTrigger id="language">
                    <SelectValue placeholder="Selecione o idioma" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pt-BR">Português (Brasil)</SelectItem>
                    <SelectItem value="en-US">English (US)</SelectItem>
                    <SelectItem value="es-ES">Español</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-xs text-neutral-500">
                  Idioma da interface e relatórios
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Notifications */}
          <Card className="border-neutral-200 bg-white">
            <CardHeader className="pb-4">
              <div className="flex items-center gap-3">
                <Bell className="h-5 w-5 text-primary-600" />
                <CardTitle className="text-lg font-semibold">Notificações</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-start gap-3">
                <Checkbox
                  id="emailNotifications"
                  checked={emailNotifications}
                  onCheckedChange={(checked) => setEmailNotifications(checked as boolean)}
                  disabled={isSavingPreferences}
                />
                <div className="space-y-1">
                  <Label
                    htmlFor="emailNotifications"
                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                  >
                    Notificações por Email
                  </Label>
                  <p className="text-xs text-neutral-500">
                    Receber atualizações sobre suas vistorias por email
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <Checkbox
                  id="pushNotifications"
                  checked={pushNotifications}
                  onCheckedChange={(checked) => setPushNotifications(checked as boolean)}
                  disabled={isSavingPreferences}
                />
                <div className="space-y-1">
                  <Label
                    htmlFor="pushNotifications"
                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                  >
                    Notificações Push
                  </Label>
                  <p className="text-xs text-neutral-500">
                    Receber notificações no navegador
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <Checkbox
                  id="marketingEmails"
                  checked={marketingEmails}
                  onCheckedChange={(checked) => setMarketingEmails(checked as boolean)}
                  disabled={isSavingPreferences}
                />
                <div className="space-y-1">
                  <Label
                    htmlFor="marketingEmails"
                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                  >
                    Emails de Marketing
                  </Label>
                  <p className="text-xs text-neutral-500">
                    Receber novidades, dicas e ofertas especiais
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <Checkbox
                  id="weeklyReports"
                  checked={weeklyReports}
                  onCheckedChange={(checked) => setWeeklyReports(checked as boolean)}
                  disabled={isSavingPreferences}
                />
                <div className="space-y-1">
                  <Label
                    htmlFor="weeklyReports"
                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                  >
                    Relatórios Semanais
                  </Label>
                  <p className="text-xs text-neutral-500">
                    Receber resumo semanal de atividades
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Save Button */}
          <div className="flex justify-end">
            <Button onClick={handleSavePreferences} disabled={isSavingPreferences}>
              {isSavingPreferences ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Salvando...
                </>
              ) : (
                <>
                  <Save className="mr-2 h-4 w-4" />
                  Salvar Preferências
                </>
              )}
            </Button>
          </div>
        </TabsContent>

        {/* Features Tab - NEW */}
        <TabsContent value="features" className="space-y-6">
          {/* Disputes Toggle */}
          <Card className="border-neutral-200 bg-white">
            <CardHeader className="pb-4">
              <div className="flex items-center gap-3">
                <Settings2 className="h-5 w-5 text-primary-600" />
                <div>
                  <CardTitle className="text-lg font-semibold">Recursos do Sistema</CardTitle>
                  <CardDescription className="mt-1">
                    Configure quais funcionalidades estarão ativas
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Disputes Toggle */}
              <div className="flex items-center justify-between py-4 border-b border-neutral-200">
                <div className="space-y-1">
                  <Label htmlFor="disputes-toggle" className="text-sm font-medium">
                    Sistema de Contestações
                  </Label>
                  <p className="text-sm text-neutral-500">
                    Permitir que locatários contestem itens das vistorias
                  </p>
                </div>
                <Switch
                  id="disputes-toggle"
                  checked={userSettings?.disputes_enabled ?? true}
                  onCheckedChange={(checked) =>
                    updateSettings({ disputes_enabled: checked })
                  }
                  aria-label="Habilitar ou desabilitar contestações"
                />
              </div>

              {/* AI Strictness Level */}
              <div className="space-y-4 pt-2">
                <div>
                  <Label className="text-sm font-medium">Nível de Rigor da IA nas Vistorias</Label>
                  <p className="text-sm text-neutral-500 mt-1">
                    Define o padrão de análise da inteligência artificial para todas as vistorias
                  </p>
                </div>

                <RadioGroup
                  value={userSettings?.ai_inspection_strictness ?? 'standard'}
                  onValueChange={(value) =>
                    updateSettings({ ai_inspection_strictness: value as AIStrictnessLevel })
                  }
                  className="space-y-3"
                >
                  {/* Standard Level */}
                  <label
                    htmlFor="strictness-standard"
                    className="flex items-start p-4 border-2 rounded-lg cursor-pointer hover:border-primary-300 transition-colors has-[:checked]:border-primary-600 has-[:checked]:bg-primary-50"
                  >
                    <RadioGroupItem value="standard" id="strictness-standard" className="mt-1" />
                    <div className="ml-3 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="text-lg" aria-hidden="true">⚖️</span>
                        <p className="font-semibold text-neutral-900">Padrão</p>
                      </div>
                      <p className="text-sm text-neutral-600 mt-1">
                        Análise equilibrada. Detecta problemas evidentes e classifica com moderação.
                      </p>
                      <Badge variant="outline" className="mt-2">
                        Recomendado para a maioria dos casos
                      </Badge>
                    </div>
                  </label>

                  {/* Strict Level */}
                  <label
                    htmlFor="strictness-strict"
                    className="flex items-start p-4 border-2 rounded-lg cursor-pointer hover:border-primary-300 transition-colors has-[:checked]:border-primary-600 has-[:checked]:bg-primary-50"
                  >
                    <RadioGroupItem value="strict" id="strictness-strict" className="mt-1" />
                    <div className="ml-3 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="text-lg" aria-hidden="true">🔍</span>
                        <p className="font-semibold text-neutral-900">Rigoroso</p>
                      </div>
                      <p className="text-sm text-neutral-600 mt-1">
                        Análise mais crítica. Detecta problemas menores e classifica com maior severidade.
                      </p>
                      <Badge variant="outline" className="mt-2">
                        Para imóveis de alto valor
                      </Badge>
                    </div>
                  </label>

                  {/* Very Strict Level */}
                  <label
                    htmlFor="strictness-very-strict"
                    className="flex items-start p-4 border-2 rounded-lg cursor-pointer hover:border-primary-300 transition-colors has-[:checked]:border-primary-600 has-[:checked]:bg-primary-50"
                  >
                    <RadioGroupItem value="very_strict" id="strictness-very-strict" className="mt-1" />
                    <div className="ml-3 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="text-lg" aria-hidden="true">🔬</span>
                        <p className="font-semibold text-neutral-900">Muito Rigoroso</p>
                      </div>
                      <p className="text-sm text-neutral-600 mt-1">
                        Análise hiper-crítica. Detecta micro-detalhes e classifica com máxima severidade.
                      </p>
                      <Badge variant="outline" className="mt-2">
                        Para locatários problemáticos
                      </Badge>
                    </div>
                  </label>
                </RadioGroup>

                <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <p className="text-sm text-blue-900">
                    <strong>Nota:</strong> Esta é a configuração padrão. Você poderá ajustar o nível de rigor
                    individualmente ao criar cada vistoria.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Account Tab */}
        <TabsContent value="account" className="space-y-6">
          {/* Data Export */}
          <Card className="border-neutral-200 bg-white">
            <CardHeader className="pb-4">
              <div className="flex items-center gap-3">
                <Download className="h-5 w-5 text-primary-600" />
                <CardTitle className="text-lg font-semibold">Exportar Dados</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-neutral-600">
                Faça o download de todos os seus dados em formato JSON. Isso inclui propriedades,
                vistorias, fotos e relatórios. (LGPD/GDPR compliance)
              </p>
              <Button variant="outline" onClick={handleExportData} disabled={isExporting}>
                {isExporting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Exportando...
                  </>
                ) : (
                  <>
                    <Download className="mr-2 h-4 w-4" />
                    Exportar Meus Dados
                  </>
                )}
              </Button>
            </CardContent>
          </Card>

          {/* Security */}
          <Card className="border-neutral-200 bg-white">
            <CardHeader className="pb-4">
              <div className="flex items-center gap-3">
                <Shield className="h-5 w-5 text-primary-600" />
                <CardTitle className="text-lg font-semibold">Segurança</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h4 className="text-sm font-medium text-neutral-900 mb-2">Senha</h4>
                <p className="text-sm text-neutral-600 mb-3">
                  Sua senha é gerenciada pelo Clerk. Use o botão abaixo para alterar.
                </p>
                <Button variant="outline" onClick={handleChangePassword}>
                  <ExternalLink className="mr-2 h-4 w-4" />
                  Alterar Senha
                </Button>
              </div>

              <div className="pt-4 border-t border-neutral-200">
                <h4 className="text-sm font-medium text-neutral-900 mb-2">
                  Autenticação de Dois Fatores (2FA)
                </h4>
                <p className="text-sm text-neutral-600 mb-3">
                  Adicione uma camada extra de segurança à sua conta.
                </p>
                <Button variant="outline" onClick={handleChangePassword}>
                  <ExternalLink className="mr-2 h-4 w-4" />
                  Configurar 2FA
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Danger Zone */}
          <Card className="border-red-200 bg-white">
            <CardHeader className="pb-4">
              <div className="flex items-center gap-3">
                <Trash2 className="h-5 w-5 text-red-600" />
                <CardTitle className="text-lg font-semibold text-red-600">Zona de Perigo</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h4 className="text-sm font-medium text-neutral-900 mb-2">Deletar Conta</h4>
                <p className="text-sm text-neutral-600 mb-4">
                  Ao deletar sua conta, todos os seus dados serão permanentemente removidos.
                  Esta ação não pode ser desfeita.
                </p>

                <DeleteAccountDialog userEmail={userEmail} />
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}

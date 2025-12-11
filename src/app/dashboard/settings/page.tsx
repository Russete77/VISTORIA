'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { User, Bell, Shield, Trash2, Download, Save, Loader2, ExternalLink, Settings2, Palette, Building2, Upload, X, MapPin, DollarSign } from 'lucide-react'
import Link from 'next/link'
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

  // Branding state
  const [companyName, setCompanyName] = useState('')
  const [logoUrl, setLogoUrl] = useState<string | null>(null)
  const [brandPrimaryColor, setBrandPrimaryColor] = useState('#1a56db')
  const [brandSecondaryColor, setBrandSecondaryColor] = useState('#f3f4f6')
  const [pdfFooterText, setPdfFooterText] = useState('')
  const [creci, setCreci] = useState('')
  const [showPoweredBy, setShowPoweredBy] = useState(true)
  const [isSavingBranding, setIsSavingBranding] = useState(false)
  const [isUploadingLogo, setIsUploadingLogo] = useState(false)

  // Regional settings state
  const [defaultRegion, setDefaultRegion] = useState('sp_capital')
  const [regions, setRegions] = useState<{ code: string; name: string; state: string | null }[]>([])
  const [loadingRegions, setLoadingRegions] = useState(false)

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

  // Sync branding and regional settings from settings
  useEffect(() => {
    if (userSettings) {
      setCompanyName(userSettings.company_name || '')
      setLogoUrl(userSettings.logo_url || null)
      setBrandPrimaryColor(userSettings.brand_primary_color || '#1a56db')
      setBrandSecondaryColor(userSettings.brand_secondary_color || '#f3f4f6')
      setPdfFooterText(userSettings.pdf_footer_text || '')
      setCreci(userSettings.creci || '')
      setShowPoweredBy(userSettings.show_powered_by ?? true)
      setDefaultRegion(userSettings.default_region || 'sp_capital')
    }
  }, [userSettings])

  // Fetch available regions
  useEffect(() => {
    const fetchRegions = async () => {
      setLoadingRegions(true)
      try {
        const response = await fetch('/api/costs/regions')
        if (response.ok) {
          const data = await response.json()
          setRegions(data.regions || [])
        }
      } catch (error) {
        console.error('Error fetching regions:', error)
      } finally {
        setLoadingRegions(false)
      }
    }
    fetchRegions()
  }, [])

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

  const handleSaveBranding = async () => {
    setIsSavingBranding(true)

    try {
      await updateSettings({
        company_name: companyName || null,
        logo_url: logoUrl,
        brand_primary_color: brandPrimaryColor,
        brand_secondary_color: brandSecondaryColor,
        pdf_footer_text: pdfFooterText || null,
        creci: creci || null,
        show_powered_by: showPoweredBy,
      })

      toast.success('Configurações de marca salvas com sucesso!')
    } catch (error) {
      console.error('Save branding error:', error)
      toast.error(error instanceof Error ? error.message : 'Erro ao salvar configurações')
    } finally {
      setIsSavingBranding(false)
    }
  }

  const handleLogoUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    // Validate file
    if (!file.type.startsWith('image/')) {
      toast.error('Por favor, selecione um arquivo de imagem')
      return
    }

    if (file.size > 2 * 1024 * 1024) {
      toast.error('O logo deve ter no máximo 2MB')
      return
    }

    setIsUploadingLogo(true)

    try {
      const formData = new FormData()
      formData.append('logo', file)

      const response = await fetch('/api/user/logo', {
        method: 'POST',
        body: formData,
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Falha ao enviar logo')
      }

      const data = await response.json()
      setLogoUrl(data.logo_url)
      toast.success('Logo enviado com sucesso!')
    } catch (error) {
      console.error('Logo upload error:', error)
      toast.error(error instanceof Error ? error.message : 'Erro ao enviar logo')
    } finally {
      setIsUploadingLogo(false)
    }
  }

  const handleRemoveLogo = () => {
    setLogoUrl(null)
  }

  const handleRegionChange = async (regionCode: string) => {
    setDefaultRegion(regionCode)
    try {
      await updateSettings({ default_region: regionCode })
      toast.success('Região atualizada com sucesso!')
    } catch (error) {
      console.error('Error saving region:', error)
      toast.error('Erro ao atualizar região')
    }
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
        {/* Tabs responsivas - scroll horizontal no mobile */}
        <div className="overflow-x-auto -mx-4 px-4 sm:mx-0 sm:px-0">
          <TabsList className="inline-flex w-auto min-w-full sm:grid sm:w-full sm:grid-cols-5 lg:w-[650px]">
            <TabsTrigger value="profile" className="whitespace-nowrap">Perfil</TabsTrigger>
            <TabsTrigger value="branding" className="whitespace-nowrap">Marca</TabsTrigger>
            <TabsTrigger value="preferences" className="whitespace-nowrap">Preferências</TabsTrigger>
            <TabsTrigger value="features" className="whitespace-nowrap">Funcionalidades</TabsTrigger>
            <TabsTrigger value="account" className="whitespace-nowrap">Conta</TabsTrigger>
          </TabsList>
        </div>

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

        {/* Branding Tab */}
        <TabsContent value="branding" className="space-y-6">
          <Card className="border-neutral-200 bg-white">
            <CardHeader className="pb-4">
              <div className="flex items-center gap-3">
                <Building2 className="h-5 w-5 text-primary-600" />
                <div>
                  <CardTitle className="text-lg font-semibold">Identidade da Empresa</CardTitle>
                  <CardDescription className="mt-1">
                    Personalize seus laudos com sua marca
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Company Name */}
              <div className="space-y-2">
                <Label htmlFor="companyName">Nome da Empresa</Label>
                <Input
                  id="companyName"
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  placeholder="Sua Imobiliária Ltda."
                  disabled={isSavingBranding}
                  maxLength={100}
                />
                <p className="text-xs text-neutral-500">
                  Aparece no cabeçalho dos laudos PDF
                </p>
              </div>

              {/* Logo Upload */}
              <div className="space-y-2">
                <Label>Logo da Empresa</Label>
                <div className="flex items-start gap-4">
                  <div className="w-24 h-24 rounded-lg border-2 border-dashed border-neutral-300 flex items-center justify-center bg-neutral-50 overflow-hidden">
                    {logoUrl ? (
                      <img
                        src={logoUrl}
                        alt="Logo da empresa"
                        className="w-full h-full object-contain"
                      />
                    ) : (
                      <Building2 className="h-8 w-8 text-neutral-400" />
                    )}
                  </div>
                  <div className="flex-1 space-y-2">
                    <div className="flex gap-2">
                      <label className="cursor-pointer">
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleLogoUpload}
                          className="hidden"
                          disabled={isUploadingLogo}
                        />
                        <Button
                          variant="outline"
                          size="sm"
                          asChild
                          disabled={isUploadingLogo}
                        >
                          <span>
                            {isUploadingLogo ? (
                              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            ) : (
                              <Upload className="mr-2 h-4 w-4" />
                            )}
                            {isUploadingLogo ? 'Enviando...' : 'Enviar Logo'}
                          </span>
                        </Button>
                      </label>
                      {logoUrl && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={handleRemoveLogo}
                          className="text-danger-600 hover:text-danger-700 hover:bg-danger-50"
                        >
                          <X className="mr-1 h-4 w-4" />
                          Remover
                        </Button>
                      )}
                    </div>
                    <p className="text-xs text-neutral-500">
                      PNG, JPG ou SVG. Máximo 2MB. Recomendado: 200x200px
                    </p>
                  </div>
                </div>
              </div>

              {/* PDF Footer Text */}
              <div className="space-y-2">
                <Label htmlFor="pdfFooterText">Texto do Rodapé do PDF</Label>
                <Input
                  id="pdfFooterText"
                  value={pdfFooterText}
                  onChange={(e) => setPdfFooterText(e.target.value)}
                  placeholder="Documento gerado por Sua Imobiliária"
                  disabled={isSavingBranding}
                  maxLength={500}
                />
                <p className="text-xs text-neutral-500">
                  Aparece no rodapé de todas as páginas do laudo
                </p>
              </div>

              {/* CRECI Field */}
              <div className="space-y-2">
                <Label htmlFor="creci">CRECI (Opcional)</Label>
                <Input
                  id="creci"
                  value={creci}
                  onChange={(e) => setCreci(e.target.value.toUpperCase())}
                  placeholder="CRECI-RJ 12345-F"
                  disabled={isSavingBranding}
                  maxLength={50}
                />
                <p className="text-xs text-neutral-500">
                  Formato: CRECI-UF XXXXX-F/J/S (ex: CRECI-RJ 12345-F, CRECI-SP 98765-J)
                </p>
              </div>
            </CardContent>
          </Card>

          <Card className="border-neutral-200 bg-white">
            <CardHeader className="pb-4">
              <div className="flex items-center gap-3">
                <Palette className="h-5 w-5 text-primary-600" />
                <div>
                  <CardTitle className="text-lg font-semibold">Cores da Marca</CardTitle>
                  <CardDescription className="mt-1">
                    Personalize as cores dos seus laudos
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid gap-6 sm:grid-cols-2">
                {/* Primary Color */}
                <div className="space-y-2">
                  <Label htmlFor="brandPrimaryColor">Cor Primária</Label>
                  <div className="flex gap-2">
                    <input
                      type="color"
                      id="brandPrimaryColor"
                      value={brandPrimaryColor}
                      onChange={(e) => setBrandPrimaryColor(e.target.value)}
                      className="w-12 h-10 rounded border border-neutral-300 cursor-pointer"
                      disabled={isSavingBranding}
                    />
                    <Input
                      value={brandPrimaryColor}
                      onChange={(e) => setBrandPrimaryColor(e.target.value)}
                      placeholder="#1a56db"
                      className="flex-1 font-mono"
                      disabled={isSavingBranding}
                      maxLength={7}
                    />
                  </div>
                  <p className="text-xs text-neutral-500">
                    Usada em títulos e elementos principais
                  </p>
                </div>

                {/* Secondary Color */}
                <div className="space-y-2">
                  <Label htmlFor="brandSecondaryColor">Cor Secundária</Label>
                  <div className="flex gap-2">
                    <input
                      type="color"
                      id="brandSecondaryColor"
                      value={brandSecondaryColor}
                      onChange={(e) => setBrandSecondaryColor(e.target.value)}
                      className="w-12 h-10 rounded border border-neutral-300 cursor-pointer"
                      disabled={isSavingBranding}
                    />
                    <Input
                      value={brandSecondaryColor}
                      onChange={(e) => setBrandSecondaryColor(e.target.value)}
                      placeholder="#f3f4f6"
                      className="flex-1 font-mono"
                      disabled={isSavingBranding}
                      maxLength={7}
                    />
                  </div>
                  <p className="text-xs text-neutral-500">
                    Usada em fundos e elementos secundários
                  </p>
                </div>
              </div>

              {/* Preview */}
              <div className="pt-4 border-t border-neutral-200">
                <Label className="mb-3 block">Pré-visualização</Label>
                <div
                  className="p-4 rounded-lg border"
                  style={{ backgroundColor: brandSecondaryColor }}
                >
                  <div
                    className="text-lg font-bold mb-2"
                    style={{ color: brandPrimaryColor }}
                  >
                    {companyName || 'Nome da Empresa'}
                  </div>
                  <div className="text-sm text-neutral-600">
                    Exemplo de como as cores aparecerão no laudo
                  </div>
                  <div
                    className="mt-3 px-4 py-2 rounded text-white text-sm font-medium inline-block"
                    style={{ backgroundColor: brandPrimaryColor }}
                  >
                    Botão de Exemplo
                  </div>
                </div>
              </div>

              {/* Powered By Toggle */}
              <div className="flex items-center justify-between pt-4 border-t border-neutral-200">
                <div className="space-y-1">
                  <Label htmlFor="showPoweredBy" className="text-sm font-medium">
                    Mostrar "Powered by VistorIA Pro"
                  </Label>
                  <p className="text-xs text-neutral-500">
                    Exibe marca d'água discreta no rodapé dos laudos
                  </p>
                </div>
                <Switch
                  id="showPoweredBy"
                  checked={showPoweredBy}
                  onCheckedChange={setShowPoweredBy}
                  disabled={isSavingBranding}
                />
              </div>
            </CardContent>
          </Card>

          {/* Save Button */}
          <div className="flex justify-end">
            <Button onClick={handleSaveBranding} disabled={isSavingBranding}>
              {isSavingBranding ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Salvando...
                </>
              ) : (
                <>
                  <Save className="mr-2 h-4 w-4" />
                  Salvar Configurações de Marca
                </>
              )}
            </Button>
          </div>
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

          {/* Regional Settings */}
          <Card className="border-neutral-200 bg-white">
            <CardHeader className="pb-4">
              <div className="flex items-center gap-3">
                <MapPin className="h-5 w-5 text-primary-600" />
                <div>
                  <CardTitle className="text-lg font-semibold">Configurações Regionais</CardTitle>
                  <CardDescription className="mt-1">
                    Configure sua região para estimativas de custos de reparo
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="defaultRegion">Região Padrão</Label>
                <Select
                  value={defaultRegion}
                  onValueChange={handleRegionChange}
                  disabled={loadingRegions}
                >
                  <SelectTrigger id="defaultRegion">
                    <SelectValue placeholder={loadingRegions ? 'Carregando...' : 'Selecione a região'} />
                  </SelectTrigger>
                  <SelectContent>
                    {regions.length > 0 ? (
                      regions.map((region) => (
                        <SelectItem key={region.code} value={region.code}>
                          {region.name} {region.state && `- ${region.state}`}
                        </SelectItem>
                      ))
                    ) : (
                      <SelectItem value="sp_capital">São Paulo Capital</SelectItem>
                    )}
                  </SelectContent>
                </Select>
                <p className="text-xs text-neutral-500">
                  Usada para calcular estimativas de custo de reparo nos laudos
                </p>
              </div>

              <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-lg">
                <p className="text-sm text-emerald-900">
                  <strong>Estimativa de Custos:</strong> Os valores de reparo são estimados com base nos
                  preços de mercado da sua região selecionada. Diferentes regiões têm multiplicadores de custo
                  que refletem a variação nos preços de mão de obra e materiais.
                </p>
              </div>

              {/* Link to Price Table */}
              <div className="pt-4 border-t border-neutral-200">
                <div className="flex items-center justify-between">
                  <div>
                    <Label className="text-sm font-medium">Tabela de Preços</Label>
                    <p className="text-sm text-neutral-500">
                      Personalize os preços dos serviços para sua realidade
                    </p>
                  </div>
                  <Button variant="outline" asChild>
                    <Link href="/dashboard/settings/prices">
                      <DollarSign className="mr-2 h-4 w-4" />
                      Gerenciar Preços
                    </Link>
                  </Button>
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

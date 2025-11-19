'use client'

import { useState } from 'react'
import { User, Bell, Shield, Trash2, Download, Save } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'

/**
 * Settings Page - VistorIA Pro
 * User profile, preferences, and account management
 */

// Mock user data - replace with real user from Clerk/Supabase
const mockUserData = {
  first_name: 'João',
  last_name: 'Silva',
  email: 'joao.silva@exemplo.com',
  image_url: null,
  created_at: '2024-12-01T10:00:00Z',
}

export default function SettingsPage() {
  // Profile state
  const [firstName, setFirstName] = useState(mockUserData.first_name)
  const [lastName, setLastName] = useState(mockUserData.last_name)
  const [email, setEmail] = useState(mockUserData.email)

  // Preferences state
  const [language, setLanguage] = useState('pt-BR')
  const [emailNotifications, setEmailNotifications] = useState(true)
  const [pushNotifications, setPushNotifications] = useState(true)
  const [marketingEmails, setMarketingEmails] = useState(false)
  const [weeklyReports, setWeeklyReports] = useState(true)

  const handleSaveProfile = () => {
    // TODO: Implement save profile
    console.log('Saving profile:', { firstName, lastName, email })
  }

  const handleSavePreferences = () => {
    // TODO: Implement save preferences
    console.log('Saving preferences:', {
      language,
      emailNotifications,
      pushNotifications,
      marketingEmails,
      weeklyReports,
    })
  }

  const handleExportData = () => {
    // TODO: Implement data export
    console.log('Exporting user data...')
  }

  const handleDeleteAccount = () => {
    // TODO: Implement account deletion
    console.log('Deleting account...')
  }

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
        <TabsList className="grid w-full grid-cols-3 lg:w-[400px]">
          <TabsTrigger value="profile">Perfil</TabsTrigger>
          <TabsTrigger value="preferences">Preferências</TabsTrigger>
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
              <div className="flex items-center gap-6">
                <div className="flex h-20 w-20 items-center justify-center rounded-full bg-primary-100 text-2xl font-semibold text-primary-700">
                  {firstName.charAt(0)}{lastName.charAt(0)}
                </div>
                <div>
                  <p className="text-sm font-medium text-neutral-900 mb-1">Foto de Perfil</p>
                  <p className="text-xs text-neutral-500 mb-3">
                    JPG, PNG ou WEBP, máximo 2MB
                  </p>
                  <Button variant="outline" size="sm" disabled>
                    Alterar Foto
                  </Button>
                </div>
              </div>

              {/* Name Fields */}
              <div className="grid gap-6 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="firstName">Nome</Label>
                  <Input
                    id="firstName"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    placeholder="Seu nome"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="lastName">Sobrenome</Label>
                  <Input
                    id="lastName"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    placeholder="Seu sobrenome"
                  />
                </div>
              </div>

              {/* Email */}
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="seu@email.com"
                />
                <p className="text-xs text-neutral-500">
                  Este é o email usado para login e notificações
                </p>
              </div>

              {/* Member Since */}
              <div className="pt-4 border-t border-neutral-200">
                <p className="text-sm text-neutral-600">
                  Membro desde{' '}
                  <span className="font-medium text-neutral-900">
                    {new Intl.DateTimeFormat('pt-BR', {
                      month: 'long',
                      year: 'numeric',
                    }).format(new Date(mockUserData.created_at))}
                  </span>
                </p>
              </div>

              {/* Save Button */}
              <div className="flex justify-end pt-4">
                <Button onClick={handleSaveProfile}>
                  <Save className="mr-2 h-4 w-4" />
                  Salvar Alterações
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
                <Select value={language} onValueChange={setLanguage}>
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
              {/* Email Notifications */}
              <div className="flex items-start gap-3">
                <Checkbox
                  id="emailNotifications"
                  checked={emailNotifications}
                  onCheckedChange={(checked) => setEmailNotifications(checked as boolean)}
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

              {/* Push Notifications */}
              <div className="flex items-start gap-3">
                <Checkbox
                  id="pushNotifications"
                  checked={pushNotifications}
                  onCheckedChange={(checked) => setPushNotifications(checked as boolean)}
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

              {/* Marketing Emails */}
              <div className="flex items-start gap-3">
                <Checkbox
                  id="marketingEmails"
                  checked={marketingEmails}
                  onCheckedChange={(checked) => setMarketingEmails(checked as boolean)}
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

              {/* Weekly Reports */}
              <div className="flex items-start gap-3">
                <Checkbox
                  id="weeklyReports"
                  checked={weeklyReports}
                  onCheckedChange={(checked) => setWeeklyReports(checked as boolean)}
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
            <Button onClick={handleSavePreferences}>
              <Save className="mr-2 h-4 w-4" />
              Salvar Preferências
            </Button>
          </div>
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
                vistorias, fotos e relatórios.
              </p>
              <Button variant="outline" onClick={handleExportData}>
                <Download className="mr-2 h-4 w-4" />
                Exportar Meus Dados
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
                <Button variant="outline" disabled>
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
                <Button variant="outline" disabled>
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

                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="outline" className="border-red-300 text-red-600 hover:bg-red-50 hover:text-red-700">
                      <Trash2 className="mr-2 h-4 w-4" />
                      Deletar Minha Conta
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Você tem certeza absoluta?</AlertDialogTitle>
                      <AlertDialogDescription className="space-y-2">
                        <p>
                          Esta ação não pode ser desfeita. Isso irá permanentemente deletar sua conta
                          e remover todos os seus dados de nossos servidores.
                        </p>
                        <p className="font-semibold text-red-600">
                          Todos os seus imóveis, vistorias, fotos e relatórios serão perdidos!
                        </p>
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancelar</AlertDialogCancel>
                      <AlertDialogAction
                        onClick={handleDeleteAccount}
                        className="bg-red-600 hover:bg-red-700"
                      >
                        Sim, deletar minha conta
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}

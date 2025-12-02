/**
 * Email Types - VistorIA Pro
 * TypeScript types for email functionality
 */

import type { ReactElement } from 'react'

/**
 * Propriedades do email de laudo pronto
 */
export interface LaudoProntoEmailProps {
  // Informações da vistoria
  inspectionId: string
  inspectionType: 'move_in' | 'move_out' | 'periodic'

  // Informações do imóvel
  propertyName: string
  propertyAddress: string

  // Informações do vistoriador
  inspectorName: string

  // Data da vistoria
  inspectionDate: string

  // Estatísticas de problemas
  totalProblems: number
  urgentProblems: number
  highProblems: number
  mediumProblems: number
  lowProblems: number

  // URL para acessar o laudo
  reportUrl: string

  // Opcional: nome do destinatário
  recipientName?: string
}

/**
 * Opções para envio de email
 */
export interface EmailSendOptions {
  // Destinatário(s)
  to: string | string[]

  // Assunto do email
  subject: string

  // Componente React do template
  react: ReactElement

  // Opcional: anexos
  attachments?: EmailAttachment[]

  // Opcional: Reply-To
  replyTo?: string

  // Opcional: CC
  cc?: string | string[]

  // Opcional: BCC
  bcc?: string | string[]

  // Opcional: tags para categorização
  tags?: EmailTag[]
}

/**
 * Anexo de email
 */
export interface EmailAttachment {
  // Nome do arquivo
  filename: string

  // Conteúdo do arquivo (Buffer ou base64 string)
  content: Buffer | string

  // Content-Type
  contentType?: string
}

/**
 * Tag para categorização de emails no Resend
 */
export interface EmailTag {
  name: string
  value: string
}

/**
 * Resposta do envio de email
 */
export interface EmailSendResponse {
  // Sucesso ou falha
  success: boolean

  // ID do email no Resend (se sucesso)
  emailId?: string

  // Mensagem de erro (se falha)
  error?: string

  // Detalhes adicionais
  details?: unknown
}

/**
 * Tipos de email disponíveis
 */
export type EmailType =
  | 'laudo_pronto'
  | 'inspection_reminder'
  | 'credit_low'
  | 'subscription_expiring'
  | 'team_invite'
  | 'welcome'

/**
 * Mapeamento de tipos de email para seus assuntos padrão
 */
export const EMAIL_SUBJECTS: Record<EmailType, string> = {
  laudo_pronto: 'Seu laudo está pronto! 📄',
  inspection_reminder: 'Lembrete: Vistoria agendada',
  credit_low: 'Seus créditos estão acabando',
  subscription_expiring: 'Sua assinatura expira em breve',
  team_invite: 'Convite para equipe VistorIA Pro',
  welcome: 'Bem-vindo ao VistorIA Pro! 🎉',
}

/**
 * Configuração de email
 */
export interface EmailConfig {
  // API Key do Resend
  apiKey: string

  // Email de origem
  fromEmail: string

  // Nome de origem
  fromName: string

  // Email de reply-to (opcional)
  replyTo?: string
}

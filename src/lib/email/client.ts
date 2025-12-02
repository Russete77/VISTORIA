/**
 * Email Client - VistorIA Pro
 * Singleton client for Resend email service
 */

import { Resend } from 'resend'
import { render } from '@react-email/render'
import type {
  EmailSendOptions,
  EmailSendResponse,
  EmailConfig,
} from './types'

/**
 * Singleton instance do cliente Resend
 */
let resendClient: Resend | null = null

/**
 * Obter ou criar cliente Resend
 */
function getResendClient(): Resend {
  if (!resendClient) {
    const apiKey = process.env.RESEND_API_KEY

    if (!apiKey) {
      throw new Error(
        'RESEND_API_KEY não configurada. Adicione a variável de ambiente.'
      )
    }

    resendClient = new Resend(apiKey)
    console.log('[Email] Cliente Resend inicializado')
  }

  return resendClient
}

/**
 * Obter configuração de email das variáveis de ambiente
 */
export function getEmailConfig(): EmailConfig {
  const config: EmailConfig = {
    apiKey: process.env.RESEND_API_KEY || '',
    fromEmail: process.env.RESEND_FROM_EMAIL || 'laudos@vistoriapro.com.br',
    fromName: process.env.RESEND_FROM_NAME || 'VistorIA Pro',
    replyTo: process.env.RESEND_REPLY_TO,
  }

  if (!config.apiKey) {
    throw new Error(
      'RESEND_API_KEY não configurada. Adicione a variável de ambiente.'
    )
  }

  return config
}

/**
 * Enviar email usando Resend
 *
 * @param options - Opções de envio do email
 * @returns Promise com resultado do envio
 *
 * @example
 * ```typescript
 * const result = await sendEmail({
 *   to: 'usuario@example.com',
 *   subject: 'Seu laudo está pronto',
 *   react: <LaudoProntoEmail {...props} />,
 * })
 * ```
 */
export async function sendEmail(
  options: EmailSendOptions
): Promise<EmailSendResponse> {
  try {
    const config = getEmailConfig()
    const resend = getResendClient()

    // Log da tentativa de envio
    console.log('[Email] Enviando email:', {
      to: Array.isArray(options.to) ? options.to.join(', ') : options.to,
      subject: options.subject,
      from: `${config.fromName} <${config.fromEmail}>`,
    })

    // Renderizar template React para HTML
    const html = await render(options.react, {
      pretty: true,
    })

    // Enviar email via Resend
    const { data, error } = await resend.emails.send({
      from: `${config.fromName} <${config.fromEmail}>`,
      to: options.to,
      subject: options.subject,
      html,
      replyTo: options.replyTo || config.replyTo,
      cc: options.cc,
      bcc: options.bcc,
      attachments: options.attachments,
      tags: options.tags,
    })

    if (error) {
      console.error('[Email] Erro ao enviar email:', error)
      return {
        success: false,
        error: error.message || 'Erro desconhecido ao enviar email',
        details: error,
      }
    }

    console.log('[Email] Email enviado com sucesso:', {
      emailId: data?.id,
      to: Array.isArray(options.to) ? options.to.join(', ') : options.to,
    })

    return {
      success: true,
      emailId: data?.id,
    }
  } catch (error) {
    console.error('[Email] Exceção ao enviar email:', error)

    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : 'Erro desconhecido ao enviar email',
      details: error,
    }
  }
}

/**
 * Validar endereço de email
 *
 * @param email - Endereço de email para validar
 * @returns true se o email for válido
 */
export function isValidEmail(email: string): boolean {
  if (!email || typeof email !== 'string') {
    return false
  }

  // Regex simples para validação de email
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email.trim())
}

/**
 * Validar múltiplos endereços de email
 *
 * @param emails - Array de emails ou email único
 * @returns true se todos os emails forem válidos
 */
export function validateEmails(emails: string | string[]): boolean {
  const emailArray = Array.isArray(emails) ? emails : [emails]

  if (emailArray.length === 0) {
    return false
  }

  return emailArray.every((email) => isValidEmail(email))
}

/**
 * Formatar nome de exibição para email
 *
 * @param name - Nome completo
 * @returns Primeiro nome ou nome completo
 *
 * @example
 * formatDisplayName('João Silva') => 'João'
 * formatDisplayName('Maria') => 'Maria'
 */
export function formatDisplayName(name: string | null | undefined): string {
  if (!name) {
    return 'Cliente'
  }

  const firstName = name.trim().split(' ')[0]
  return firstName || 'Cliente'
}

/**
 * Gerar URL completa da aplicação
 *
 * @param path - Caminho relativo
 * @returns URL completa
 *
 * @example
 * getAppUrl('/inspections/123') => 'https://app.vistoriapro.com.br/inspections/123'
 */
export function getAppUrl(path: string): string {
  const baseUrl =
    process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
  const cleanPath = path.startsWith('/') ? path : `/${path}`
  return `${baseUrl}${cleanPath}`
}

/**
 * Testar configuração de email
 * Útil para verificar se as variáveis de ambiente estão configuradas
 *
 * @returns true se a configuração está válida
 */
export function testEmailConfig(): boolean {
  try {
    const config = getEmailConfig()

    if (!config.apiKey) {
      console.error('[Email] RESEND_API_KEY não configurada')
      return false
    }

    if (!config.fromEmail || !isValidEmail(config.fromEmail)) {
      console.error('[Email] RESEND_FROM_EMAIL inválido:', config.fromEmail)
      return false
    }

    if (!config.fromName) {
      console.error('[Email] RESEND_FROM_NAME não configurado')
      return false
    }

    console.log('[Email] Configuração válida:', {
      fromEmail: config.fromEmail,
      fromName: config.fromName,
      replyTo: config.replyTo || 'não configurado',
    })

    return true
  } catch (error) {
    console.error('[Email] Erro ao testar configuração:', error)
    return false
  }
}

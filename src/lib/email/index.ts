/**
 * Email Module - VistorIA Pro
 * Exports centralizados para o módulo de email
 */

// Cliente e funções utilitárias
export {
  sendEmail,
  getEmailConfig,
  isValidEmail,
  validateEmails,
  formatDisplayName,
  getAppUrl,
  testEmailConfig,
} from './client'

// Types
export type {
  LaudoProntoEmailProps,
  EmailSendOptions,
  EmailSendResponse,
  EmailAttachment,
  EmailTag,
  EmailType,
  EmailConfig,
} from './types'

export { EMAIL_SUBJECTS } from './types'

// Templates
export { default as LaudoProntoEmail } from './templates/laudo-pronto'

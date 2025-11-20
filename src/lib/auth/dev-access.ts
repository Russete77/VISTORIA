/**
 * Developer Access Control - VistorIA Pro
 * Provides privileged access for developers during development
 */

/**
 * List of developer emails with unlimited access
 * These users bypass credit checks and have full access for testing
 */
const DEVELOPER_EMAILS = [
  'erickrussomat@gmail.com',
] as const

/**
 * Check if a user email has developer privileges
 */
export function isDeveloper(email: string | null | undefined): boolean {
  if (!email) return false

  const normalizedEmail = email.toLowerCase().trim()
  return DEVELOPER_EMAILS.some(devEmail => devEmail.toLowerCase() === normalizedEmail)
}

/**
 * Check if a user has sufficient credits OR is a developer
 * Use this function instead of direct credit checks to allow developer bypass
 */
export function canUseCredits(credits: number, email: string | null | undefined): boolean {
  // Developers have unlimited credits
  if (isDeveloper(email)) {
    return true
  }

  // Regular users need credits
  return credits > 0
}

/**
 * Get effective credit count for a user
 * Returns actual credits for normal users, Infinity for developers
 */
export function getEffectiveCredits(credits: number, email: string | null | undefined): number {
  if (isDeveloper(email)) {
    return Infinity
  }

  return credits
}

/**
 * Check if credit deduction should be skipped
 * Returns true for developers to prevent credit deduction
 */
export function shouldSkipCreditDeduction(email: string | null | undefined): boolean {
  return isDeveloper(email)
}

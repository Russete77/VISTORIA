/**
 * Developer Access Control - VistorIA Pro
 * Provides privileged access for developers during development
 *
 * SECURITY: This bypass is ONLY enabled when ENABLE_DEV_ACCESS=true
 * In production, this should be set to false or removed entirely
 */

/**
 * Check if FREE MODE is enabled - makes platform free for ALL users
 * Use this during testing/beta phase when you don't want to charge anyone
 * CRITICAL: Set FREE_MODE=false when ready to charge users!
 */
const isFreeMode = (): boolean => {
  const enabled = process.env.FREE_MODE === 'true'
  if (enabled && process.env.NODE_ENV === 'production') {
    console.warn('⚠️ FREE_MODE is enabled - platform is free for ALL users!')
  }
  return enabled
}

/**
 * Check if developer access is enabled via environment variable
 * CRITICAL: Set ENABLE_DEV_ACCESS=false in production!
 */
const isDevAccessEnabled = (): boolean => {
  const enabled = process.env.ENABLE_DEV_ACCESS === 'true'
  if (enabled && process.env.NODE_ENV === 'production') {
    console.warn('WARNING: Developer access bypass is enabled in production!')
  }
  return enabled
}

/**
 * List of developer emails with unlimited access
 * These users bypass credit checks and have full access for testing
 * Only works when ENABLE_DEV_ACCESS=true
 */
const DEVELOPER_EMAILS = [
  'erickrussomat@gmail.com',
] as const

/**
 * Check if a user email has developer privileges
 * Returns false if ENABLE_DEV_ACCESS is not set to 'true'
 */
export function isDeveloper(email: string | null | undefined): boolean {
  // Developer access must be explicitly enabled
  if (!isDevAccessEnabled()) {
    return false
  }

  if (!email) return false

  const normalizedEmail = email.toLowerCase().trim()
  return DEVELOPER_EMAILS.some(devEmail => devEmail.toLowerCase() === normalizedEmail)
}

/**
 * Check if FREE MODE is active for all users
 * When enabled, NO ONE pays for anything
 */
export function isFreeModeActive(): boolean {
  return isFreeMode()
}

/**
 * Check if a user has sufficient credits OR is a developer OR FREE_MODE is active
 * Use this function instead of direct credit checks to allow developer bypass
 */
export function canUseCredits(credits: number, email: string | null | undefined): boolean {
  // FREE MODE = everyone has unlimited access
  if (isFreeMode()) {
    return true
  }

  // Developers have unlimited credits
  if (isDeveloper(email)) {
    return true
  }

  // Regular users need credits
  return credits > 0
}

/**
 * Get effective credit count for a user
 * Returns actual credits for normal users, Infinity for developers/free mode
 */
export function getEffectiveCredits(credits: number, email: string | null | undefined): number {
  // FREE MODE = everyone has infinite credits
  if (isFreeMode()) {
    return Infinity
  }

  if (isDeveloper(email)) {
    return Infinity
  }

  return credits
}

/**
 * Check if credit deduction should be skipped
 * Returns true for developers OR when FREE_MODE is active
 */
export function shouldSkipCreditDeduction(email: string | null | undefined): boolean {
  // FREE MODE = never deduct credits
  if (isFreeMode()) {
    return true
  }

  return isDeveloper(email)
}


/**
 * Rate Limiting - VistorIA Pro
 * In-memory rate limiter for API protection
 * Can be upgraded to Redis for distributed deployments
 */

interface RateLimitEntry {
  count: number
  resetAt: number
}

interface RateLimitConfig {
  windowMs: number      // Time window in milliseconds
  maxRequests: number   // Max requests per window
}

// In-memory store for rate limiting
const rateLimitStore = new Map<string, RateLimitEntry>()

// Default configurations for different API types
export const RATE_LIMITS = {
  // Standard API endpoints
  standard: { windowMs: 60 * 1000, maxRequests: 100 },

  // AI-intensive operations (analysis, transcription)
  ai: { windowMs: 60 * 1000, maxRequests: 20 },

  // Authentication-related
  auth: { windowMs: 15 * 60 * 1000, maxRequests: 10 },

  // File uploads
  upload: { windowMs: 60 * 1000, maxRequests: 30 },

  // Report generation (expensive)
  report: { windowMs: 60 * 1000, maxRequests: 5 },

  // Email sending
  email: { windowMs: 60 * 1000, maxRequests: 10 },

  // Webhooks (higher limit for trusted sources)
  webhook: { windowMs: 60 * 1000, maxRequests: 200 },
} as const

export type RateLimitType = keyof typeof RATE_LIMITS

interface RateLimitResult {
  success: boolean
  limit: number
  remaining: number
  resetAt: number
  retryAfter?: number
}

/**
 * Check if a request should be rate limited
 * @param identifier - Unique identifier (usually IP or userId)
 * @param type - Type of rate limit to apply
 * @returns RateLimitResult with success status and metadata
 */
export function checkRateLimit(
  identifier: string,
  type: RateLimitType = 'standard'
): RateLimitResult {
  const config = RATE_LIMITS[type]
  const now = Date.now()
  const key = `${type}:${identifier}`

  // Cleanup old entries periodically (1% chance per request)
  if (Math.random() < 0.01) {
    cleanupExpiredEntries()
  }

  const entry = rateLimitStore.get(key)

  // No existing entry or window expired - create new
  if (!entry || now >= entry.resetAt) {
    const newEntry: RateLimitEntry = {
      count: 1,
      resetAt: now + config.windowMs,
    }
    rateLimitStore.set(key, newEntry)

    return {
      success: true,
      limit: config.maxRequests,
      remaining: config.maxRequests - 1,
      resetAt: newEntry.resetAt,
    }
  }

  // Window still active
  if (entry.count >= config.maxRequests) {
    // Rate limit exceeded
    const retryAfter = Math.ceil((entry.resetAt - now) / 1000)
    return {
      success: false,
      limit: config.maxRequests,
      remaining: 0,
      resetAt: entry.resetAt,
      retryAfter,
    }
  }

  // Increment counter
  entry.count++

  return {
    success: true,
    limit: config.maxRequests,
    remaining: config.maxRequests - entry.count,
    resetAt: entry.resetAt,
  }
}

/**
 * Remove expired entries from the store
 */
function cleanupExpiredEntries(): void {
  const now = Date.now()
  for (const [key, entry] of rateLimitStore.entries()) {
    if (now >= entry.resetAt) {
      rateLimitStore.delete(key)
    }
  }
}

/**
 * Get client identifier from request headers
 * Uses X-Forwarded-For in production (behind proxy) or falls back to a default
 */
export function getClientIdentifier(
  headers: Headers,
  userId?: string | null
): string {
  // Prefer user ID if authenticated
  if (userId) {
    return `user:${userId}`
  }

  // Try to get real IP from proxy headers
  const forwardedFor = headers.get('x-forwarded-for')
  if (forwardedFor) {
    // Take the first IP (client's real IP)
    return `ip:${forwardedFor.split(',')[0].trim()}`
  }

  const realIp = headers.get('x-real-ip')
  if (realIp) {
    return `ip:${realIp}`
  }

  // Fallback - not ideal but better than nothing
  return 'ip:unknown'
}

/**
 * Create rate limit response headers
 */
export function createRateLimitHeaders(result: RateLimitResult): HeadersInit {
  return {
    'X-RateLimit-Limit': result.limit.toString(),
    'X-RateLimit-Remaining': result.remaining.toString(),
    'X-RateLimit-Reset': result.resetAt.toString(),
    ...(result.retryAfter && { 'Retry-After': result.retryAfter.toString() }),
  }
}

/**
 * Helper to create a rate limit exceeded response
 */
export function rateLimitExceededResponse(result: RateLimitResult): Response {
  return new Response(
    JSON.stringify({
      error: 'Too Many Requests',
      message: 'Rate limit exceeded. Please try again later.',
      retryAfter: result.retryAfter,
    }),
    {
      status: 429,
      headers: {
        'Content-Type': 'application/json',
        ...createRateLimitHeaders(result),
      },
    }
  )
}

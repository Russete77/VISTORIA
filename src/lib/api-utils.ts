/**
 * API Utilities - VistorIA Pro
 * Common utilities for API routes including rate limiting
 */

import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import {
  checkRateLimit,
  getClientIdentifier,
  createRateLimitHeaders,
  rateLimitExceededResponse,
  RateLimitType,
} from './rate-limit'

interface RateLimitedHandlerOptions {
  rateLimitType?: RateLimitType
  requireAuth?: boolean
}

type ApiHandler = (
  request: NextRequest,
  context: { params?: Promise<Record<string, string>> }
) => Promise<Response>

/**
 * Wrap an API handler with rate limiting
 * @param handler - The API handler function
 * @param options - Rate limiting options
 */
export function withRateLimit(
  handler: ApiHandler,
  options: RateLimitedHandlerOptions = {}
): ApiHandler {
  const { rateLimitType = 'standard', requireAuth = true } = options

  return async (request, context) => {
    // Get user ID if authenticated
    let userId: string | null = null
    if (requireAuth) {
      const authResult = await auth()
      userId = authResult.userId
    }

    // Get client identifier for rate limiting
    const identifier = getClientIdentifier(request.headers, userId)

    // Check rate limit
    const rateLimitResult = checkRateLimit(identifier, rateLimitType)

    if (!rateLimitResult.success) {
      return rateLimitExceededResponse(rateLimitResult)
    }

    // Call the actual handler
    const response = await handler(request, context)

    // Add rate limit headers to response
    const headers = new Headers(response.headers)
    const rateLimitHeaders = createRateLimitHeaders(rateLimitResult)
    Object.entries(rateLimitHeaders).forEach(([key, value]) => {
      if (typeof value === 'string') {
        headers.set(key, value)
      }
    })

    return new Response(response.body, {
      status: response.status,
      statusText: response.statusText,
      headers,
    })
  }
}

/**
 * Quick rate limit check for use at the start of API handlers
 * Returns null if allowed, or a Response if rate limited
 */
export async function quickRateLimit(
  request: NextRequest,
  type: RateLimitType = 'standard'
): Promise<Response | null> {
  const authResult = await auth()
  const identifier = getClientIdentifier(request.headers, authResult.userId)
  const result = checkRateLimit(identifier, type)

  if (!result.success) {
    return rateLimitExceededResponse(result)
  }

  return null
}

/**
 * Create a JSON response with proper headers
 */
export function jsonResponse<T>(
  data: T,
  options: { status?: number; headers?: HeadersInit } = {}
): NextResponse<T> {
  return NextResponse.json(data, {
    status: options.status || 200,
    headers: options.headers,
  })
}

/**
 * Create an error response
 */
export function errorResponse(
  message: string,
  status: number = 500,
  details?: unknown
): NextResponse {
  const body: { error: string; details?: unknown } = { error: message }
  if (details !== undefined) {
    body.details = details
  }
  return NextResponse.json(body, { status })
}

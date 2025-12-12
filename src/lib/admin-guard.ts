/**
 * Admin Guard - VistorIA Pro
 * Middleware utilities to verify admin role before accessing admin routes
 */

import { auth } from '@clerk/nextjs/server'
import { createAdminClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export type UserRole = 'user' | 'admin' | 'super_admin'

interface AdminCheckResult {
  isAdmin: boolean
  isSuperAdmin: boolean
  role: UserRole
  userId: string | null
  dbUserId: string | null
  error?: string
}

/**
 * Check if the current user has admin or super_admin role
 * Used in API routes to protect admin endpoints
 */
export async function checkAdminAccess(): Promise<AdminCheckResult> {
  try {
    const authResult = await auth()
    
    console.log('[checkAdminAccess] Clerk userId:', authResult.userId)
    
    if (!authResult.userId) {
      console.log('[checkAdminAccess] No userId, returning unauthorized')
      return {
        isAdmin: false,
        isSuperAdmin: false,
        role: 'user',
        userId: null,
        dbUserId: null,
        error: 'Unauthorized',
      }
    }

    const supabase = createAdminClient()

    const { data: user, error } = await supabase
      .from('users')
      .select('id, role, email')
      .eq('clerk_id', authResult.userId)
      .single()

    console.log('[checkAdminAccess] Supabase query result:', { user, error: error?.message })

    if (error || !user) {
      console.log('[checkAdminAccess] User not found in DB')
      return {
        isAdmin: false,
        isSuperAdmin: false,
        role: 'user',
        userId: authResult.userId,
        dbUserId: null,
        error: 'User not found',
      }
    }

    const role = (user.role as UserRole) || 'user'
    
    console.log('[checkAdminAccess] User found:', { email: user.email, role, isAdmin: role === 'admin' || role === 'super_admin' })

    return {
      isAdmin: role === 'admin' || role === 'super_admin',
      isSuperAdmin: role === 'super_admin',
      role,
      userId: authResult.userId,
      dbUserId: user.id,
    }
  } catch (error) {
    console.error('Admin check error:', error)
    return {
      isAdmin: false,
      isSuperAdmin: false,
      role: 'user',
      userId: null,
      dbUserId: null,
      error: 'Internal error',
    }
  }
}

/**
 * Create a 403 Forbidden response for non-admin users
 */
export function adminForbiddenResponse() {
  return NextResponse.json(
    { error: 'Forbidden', message: 'Admin access required' },
    { status: 403 }
  )
}

/**
 * Higher-order function to wrap API handlers with admin check
 */
export function withAdminGuard<T>(
  handler: (adminInfo: AdminCheckResult) => Promise<T>
) {
  return async (): Promise<T | NextResponse> => {
    const adminCheck = await checkAdminAccess()

    if (!adminCheck.isAdmin) {
      return adminForbiddenResponse()
    }

    return handler(adminCheck)
  }
}

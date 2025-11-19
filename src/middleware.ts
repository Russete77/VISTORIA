import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server'
import { updateSession } from '@/lib/supabase/middleware'
import { NextResponse } from 'next/server'

// Define public routes (accessible without authentication)
const isPublicRoute = createRouteMatcher([
  '/',
  '/sign-in(.*)',
  '/sign-up(.*)',
  '/api/webhooks(.*)',
  '/api/health',
])

export default clerkMiddleware(async (auth, request) => {
  // Update Supabase session
  const supabaseResponse = await updateSession(request)

  // Allow public routes
  if (isPublicRoute(request)) {
    return supabaseResponse
  }

  // For all other routes (including APIs), require authentication
  const authResult = await auth()

  if (!authResult.userId) {
    // If it's an API route, return 401
    if (request.nextUrl.pathname.startsWith('/api/')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // If it's a page route, redirect to sign-in
    const signInUrl = new URL('/sign-in', request.url)
    signInUrl.searchParams.set('redirect_url', request.url)
    return NextResponse.redirect(signInUrl)
  }

  return supabaseResponse
})

export const config = {
  matcher: [
    // Skip Next.js internals and all static files
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    // Always run for API routes
    '/(api|trpc)(.*)',
  ],
}

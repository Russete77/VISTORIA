import { createServerClient as createSupabaseServerClient } from '@supabase/ssr'
import { createClient as createSupabaseClient } from '@supabase/supabase-js'
import { cookies } from 'next/headers'

export async function createClient() {
  const cookieStore = await cookies()

  return createSupabaseServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          } catch {
            // The `setAll` method was called from a Server Component.
            // This can be ignored if you have middleware refreshing
            // user sessions.
          }
        },
      },
    }
  )
}

// Export alias for consistency with API routes
export async function createServerClient() {
  return createClient()
}

/**
 * Create an admin Supabase client with service role key
 * This bypasses Row Level Security (RLS) policies
 * Use ONLY for trusted server-side operations like webhooks
 */
export function createAdminClient() {
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL

  console.log('[createAdminClient] Initializing:', {
    hasServiceRoleKey: !!serviceRoleKey,
    hasSupabaseUrl: !!supabaseUrl,
    serviceRoleKeyLength: serviceRoleKey?.length,
    supabaseUrlHost: supabaseUrl?.split('//')[1]?.split('.')[0]
  })

  if (!serviceRoleKey) {
    console.warn('[createAdminClient] SUPABASE_SERVICE_ROLE_KEY not set, using anon key (RLS will apply)')
    // Fallback to anon key if service role is not available
    return createSupabaseClient(
      supabaseUrl!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )
  }

  return createSupabaseClient(
    supabaseUrl!,
    serviceRoleKey,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    }
  )
}

/**
 * Get or create a user in the database
 * Used when the Clerk webhook fails to sync the user
 * Returns { data: { id } } or throws an error
 */
export async function getOrCreateUser(clerkId: string, supabaseClient?: ReturnType<typeof createAdminClient>) {
  console.log('[getOrCreateUser] START - clerkId:', clerkId)
  
  if (!clerkId) {
    console.error('[getOrCreateUser] No clerkId provided!')
    throw new Error('clerkId is required')
  }

  const supabase = supabaseClient || createAdminClient()
  console.log('[getOrCreateUser] Supabase client created')

  // Try to get existing user
  console.log('[getOrCreateUser] Querying for existing user with clerk_id:', clerkId)
  const { data: existingUser, error: selectError } = await supabase
    .from('users')
    .select('id')
    .eq('clerk_id', clerkId)
    .single()

  if (selectError && selectError.code !== 'PGRST116') {
    console.error('[getOrCreateUser] Unexpected error querying user:', {
      message: selectError.message,
      code: selectError.code,
      hint: selectError.hint,
      details: selectError.details
    })
  }

  // .single() returns error PGRST116 when no rows found — this is normal, not a DB error
  if (existingUser) {
    console.log('[getOrCreateUser] ✓ Found existing user:', existingUser.id)
    return { data: existingUser }
  }

  // User doesn't exist, create as fallback
  console.log('[getOrCreateUser] User not found, creating fallback user for clerk_id:', clerkId)
  const { data: newUser, error: upsertError } = await supabase
    .from('users')
    .upsert({
      clerk_id: clerkId,
      email: `${clerkId}@no-email.vistoria.internal`,
    }, { onConflict: 'clerk_id' })
    .select('id')
    .single()

  if (upsertError) {
    console.error('[getOrCreateUser] ✗ Failed to upsert user:', {
      error: upsertError.message,
      code: upsertError.code,
      hint: upsertError.hint,
      details: upsertError.details,
      clerkId
    })
    throw new Error(`Failed to create user: ${upsertError.message} (code: ${upsertError.code})`)
  }

  if (!newUser?.id) {
    console.error('[getOrCreateUser] ✗ Upsert returned no id', { newUser })
    throw new Error('User created but no id returned')
  }

  console.log('[getOrCreateUser] ✓ User created successfully:', newUser.id)
  return { data: newUser }
}

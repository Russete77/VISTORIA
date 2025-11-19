# Authentication Architecture - VistorIA Pro

## Overview

VistorIA Pro uses **Clerk for authentication** and **Supabase for database**. This document explains the architecture and why we use `createAdminClient()` in API routes.

## The Problem

Supabase's Row Level Security (RLS) is designed to work with **Supabase Auth** (uses `auth.jwt()` in policies). However, we use **Clerk Auth**, which means:

1. User authenticates with Clerk (gets Clerk JWT token)
2. Clerk token is stored in cookies
3. Supabase RLS policies expect `auth.jwt()` from Supabase Auth (not Clerk)
4. Result: RLS policies fail because `auth.jwt()` returns null

### Example of the Issue

```sql
-- This RLS policy doesn't work with Clerk Auth
CREATE POLICY "Users can view own properties"
  ON properties FOR SELECT
  USING (user_id IN (SELECT id FROM users WHERE clerk_id = auth.jwt() ->> 'sub'));
```

The `auth.jwt()` function only works with Supabase Auth tokens, not Clerk tokens.

## The Solution

We use a **two-layer authentication approach**:

### Layer 1: Clerk (User Authentication)
- Handles login/signup/session management
- Validates user identity
- Provides `userId` (clerk_id) to our APIs

### Layer 2: Supabase Admin Client (Database Access)
- API routes use `createAdminClient()` with `SUPABASE_SERVICE_ROLE_KEY`
- Bypasses RLS policies entirely
- Security is enforced at the application level (API routes verify Clerk auth)

## Architecture Diagram

```
┌─────────────┐
│   Browser   │
└──────┬──────┘
       │ Request + Clerk Cookie
       ▼
┌─────────────────────┐
│   Next.js API Route │
│                     │
│  1. auth() from     │──── Validates with Clerk
│     @clerk/nextjs   │
│                     │
│  2. createAdmin     │──── Bypasses RLS
│     Client()        │     (Service Role Key)
│                     │
│  3. Query Supabase  │
│     with userId     │
└─────────────────────┘
       │
       ▼
┌─────────────────────┐
│   Supabase DB       │
│   (RLS bypassed)    │
└─────────────────────┘
```

## Implementation Details

### API Routes Pattern

All API routes follow this pattern:

```typescript
import { auth } from '@clerk/nextjs/server'
import { createAdminClient } from '@/lib/supabase/server'

export async function GET() {
  // 1. Validate authentication with Clerk
  const { userId } = await auth()
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // 2. Create Supabase admin client (bypasses RLS)
  const supabase = createAdminClient()

  // 3. Get user from database using Clerk ID
  const { data: user } = await supabase
    .from('users')
    .select('id')
    .eq('clerk_id', userId)
    .single()

  // 4. Query user's data
  const { data } = await supabase
    .from('properties')
    .eq('user_id', user.id)
    .select('*')

  return NextResponse.json({ data })
}
```

### Why This Works

1. **Security at API Level**: Clerk validates user identity before any database access
2. **No RLS Conflicts**: Admin client bypasses RLS, so no conflicts with Clerk tokens
3. **User Isolation**: We filter by `user_id` in queries (Clerk userId → users.clerk_id → users.id)
4. **Consistent Pattern**: All API routes follow the same authentication flow

### Client Types

#### `createClient()` / `createServerClient()`
- Uses `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- Subject to RLS policies
- Used ONLY in Server Components for public data or when RLS is properly configured
- **NOT used in API routes**

#### `createAdminClient()`
- Uses `SUPABASE_SERVICE_ROLE_KEY` (secret, server-side only)
- Bypasses ALL RLS policies
- Used in:
  - API routes (after Clerk auth validation)
  - Webhooks (Clerk user sync)
  - Server actions requiring full database access

## User Sync Flow

Users are synced from Clerk to Supabase via:

1. **Webhook** (primary): Clerk sends webhook on user.created → `/api/webhooks/clerk`
2. **Manual Sync** (fallback): User calls `/api/user POST` if webhook fails

Both use `createAdminClient()` to create user records.

## Environment Variables Required

```bash
# Clerk Authentication
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_SECRET_KEY=sk_test_...
CLERK_WEBHOOK_SECRET=whsec_...

# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ... (public, RLS enforced)
SUPABASE_SERVICE_ROLE_KEY=eyJ... (SECRET! Bypasses RLS)
```

## Security Considerations

### Why This Approach is Safe

1. **Server-Side Only**: `SUPABASE_SERVICE_ROLE_KEY` never exposed to client
2. **Clerk Auth First**: Every API route validates with Clerk before database access
3. **User Scoping**: Queries always filter by authenticated user's ID
4. **No Public Endpoints**: All sensitive routes require Clerk authentication

### Common Mistakes to Avoid

1. ❌ Using `createClient()` in API routes → RLS will fail
2. ❌ Forgetting to check `userId` from Clerk → Security vulnerability
3. ❌ Exposing Service Role Key in client-side code → Major security breach
4. ❌ Querying without filtering by `user_id` → Data leakage

## Alternative Approach (Not Used)

We could integrate Clerk JWT with Supabase by:
1. Configuring Supabase to accept Clerk JWTs (custom JWT validation)
2. Updating RLS policies to read Clerk token claims
3. Passing Clerk token to Supabase in API requests

**Why we didn't choose this:**
- More complex setup
- Requires Supabase JWT configuration
- Harder to debug
- Our current approach is simpler and equally secure

## Troubleshooting

### "User not found in database" Error

**Cause**: API route using `createClient()` instead of `createAdminClient()`

**Solution**: Replace with `createAdminClient()` in the API route

### "PGRST116: The result contains 0 rows"

**Cause**: RLS blocking query because Clerk token not recognized by Supabase

**Solution**: Ensure using `createAdminClient()` in API routes

### Webhook Not Creating Users

**Cause**:
- Webhook secret not configured
- Webhook not set up in Clerk Dashboard
- Service role key missing

**Solution**:
1. Verify `CLERK_WEBHOOK_SECRET` in .env.local
2. Check webhook logs in Clerk Dashboard
3. Confirm `SUPABASE_SERVICE_ROLE_KEY` is set
4. Use `/api/user POST` as fallback to manually sync

## Testing

To verify authentication works:

1. Sign up with Clerk
2. Check user created in Supabase `users` table
3. Try accessing `/api/properties` → should return 200 (empty array)
4. Create a property → should succeed
5. Check browser network tab → no 404 "User not found" errors

## References

- [Clerk Documentation](https://clerk.com/docs)
- [Supabase RLS Documentation](https://supabase.com/docs/guides/auth/row-level-security)
- [Supabase Service Role](https://supabase.com/docs/guides/auth#the-service_role-key)

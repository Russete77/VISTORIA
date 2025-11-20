#!/usr/bin/env node
import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

// Read environment variables
const envContent = readFileSync(join(__dirname, '.env.local'), 'utf-8')
const envVars = {}
envContent.split('\n').forEach(line => {
  const match = line.match(/^([^#=]+)=(.*)$/)
  if (match) {
    envVars[match[1].trim()] = match[2].trim()
  }
})

const clerkId = 'user_35cXZKaIlvIt8bxc27zaEDArvTZ'

console.log('🔍 Testing Supabase access with different clients...\n')

// Test 1: Service Role (bypasses RLS)
console.log('1️⃣ Testing with SERVICE ROLE (bypasses RLS):')
const supabaseAdmin = createClient(
  envVars.NEXT_PUBLIC_SUPABASE_URL,
  envVars.SUPABASE_SERVICE_ROLE_KEY,
  {
    auth: { autoRefreshToken: false, persistSession: false }
  }
)

const { data: adminData, error: adminError } = await supabaseAdmin
  .from('users')
  .select('*')
  .eq('clerk_id', clerkId)
  .single()

if (adminError) {
  console.log('   ❌ Error:', adminError.message)
} else {
  console.log('   ✅ Found user:', adminData.email)
}
console.log('')

// Test 2: Anon Key (respects RLS)
console.log('2️⃣ Testing with ANON KEY (respects RLS):')
const supabaseAnon = createClient(
  envVars.NEXT_PUBLIC_SUPABASE_URL,
  envVars.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  {
    auth: { autoRefreshToken: false, persistSession: false }
  }
)

const { data: anonData, error: anonError } = await supabaseAnon
  .from('users')
  .select('*')
  .eq('clerk_id', clerkId)
  .single()

if (anonError) {
  console.log('   ❌ Error:', anonError.message)
  console.log('   This is expected if RLS is blocking access')
} else {
  console.log('   ✅ Found user:', anonData.email)
}
console.log('')

console.log('📊 Analysis:')
if (adminData && !anonData) {
  console.log('   ⚠️  RLS is blocking access to the users table')
  console.log('   The API routes need to use SERVICE ROLE, not ANON KEY')
  console.log('')
  console.log('   Check: src/lib/supabase/server.ts')
  console.log('   Make sure createAdminClient() uses SERVICE_ROLE_KEY')
} else if (adminData && anonData) {
  console.log('   ✅ Both clients can access the data (RLS allows read)')
} else {
  console.log('   ❌ Something else is wrong - user not found even with service role')
}

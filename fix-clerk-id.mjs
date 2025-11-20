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

const supabase = createClient(
  envVars.NEXT_PUBLIC_SUPABASE_URL,
  envVars.SUPABASE_SERVICE_ROLE_KEY,
  {
    auth: { autoRefreshToken: false, persistSession: false }
  }
)

console.log('🔍 Checking clerk_id in database...\n')

const email = 'erickrussomat@gmail.com'
const correctClerkId = 'user_35cXZKaIlvIt8bxc27zaEDArvTZ'

// Get current user
const { data: currentUser } = await supabase
  .from('users')
  .select('*')
  .eq('email', email)
  .single()

if (!currentUser) {
  console.error('❌ User not found with email:', email)
  process.exit(1)
}

console.log('Current user data:')
console.log('   ID:', currentUser.id)
console.log('   Email:', currentUser.email)
console.log('   clerk_id:', currentUser.clerk_id)
console.log('   Tier:', currentUser.tier)
console.log('   Credits:', currentUser.credits)
console.log('')

if (currentUser.clerk_id === correctClerkId) {
  console.log('✅ clerk_id is already correct!')
  process.exit(0)
}

// Update clerk_id
console.log('Updating clerk_id to:', correctClerkId)
console.log('')

const { data: updatedUser, error } = await supabase
  .from('users')
  .update({
    clerk_id: correctClerkId,
  })
  .eq('email', email)
  .select()
  .single()

if (error) {
  console.error('❌ Failed to update clerk_id:', error.message)
  console.error('Details:', error)
  process.exit(1)
}

console.log('✅ clerk_id updated successfully!')
console.log('   Old clerk_id:', currentUser.clerk_id)
console.log('   New clerk_id:', updatedUser.clerk_id)
console.log('')
console.log('🎉 User is ready! Reload the app to test.')

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

console.log('🔧 Updating developer user...\n')

const email = 'erickrussomat@gmail.com'

// Update user to business tier with unlimited credits
const { data: updatedUser, error } = await supabase
  .from('users')
  .update({
    tier: 'business',
    credits: 999,
    full_name: 'Erick Russo (Developer)',
  })
  .eq('email', email)
  .select()
  .single()

if (error) {
  console.error('❌ Failed to update user:', error.message)
  console.error('Details:', error)
  process.exit(1)
}

console.log('✅ User updated successfully!')
console.log('   ID:', updatedUser.id)
console.log('   Email:', updatedUser.email)
console.log('   Tier:', updatedUser.tier, '(was: free)')
console.log('   Credits:', updatedUser.credits, '(was: 0)')
console.log('')
console.log('🎉 Developer user is ready! Reload the app to see changes.')

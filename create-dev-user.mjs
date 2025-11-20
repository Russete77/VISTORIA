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

console.log('🔧 Creating developer user...\n')

const clerkId = 'user_35cXZKaIlvIt8bxc27zaEDArvTZ'
const email = 'erickrussomat@gmail.com'

// Check if user already exists
const { data: existingUser } = await supabase
  .from('users')
  .select('*')
  .eq('clerk_id', clerkId)
  .single()

if (existingUser) {
  console.log('✅ User already exists!')
  console.log('   ID:', existingUser.id)
  console.log('   Email:', existingUser.email)
  console.log('   Tier:', existingUser.tier)
  console.log('   Credits:', existingUser.credits)
  process.exit(0)
}

// Create user
console.log('Creating user with:')
console.log('   clerk_id:', clerkId)
console.log('   email:', email)
console.log('')

const { data: newUser, error } = await supabase
  .from('users')
  .insert({
    clerk_id: clerkId,
    email: email,
    full_name: 'Erick Russo (Dev)',
    first_name: 'Erick',
    last_name: 'Russo',
    tier: 'business', // Developer gets business tier
    credits: 999, // Lots of credits for testing
    preferences: {},
  })
  .select()
  .single()

if (error) {
  console.error('❌ Failed to create user:', error.message)
  console.error('Details:', error)
  process.exit(1)
}

console.log('✅ User created successfully!')
console.log('   ID:', newUser.id)
console.log('   Email:', newUser.email)
console.log('   Tier:', newUser.tier)
console.log('   Credits:', newUser.credits)
console.log('')
console.log('🎉 Developer user is ready! You can now access the app.')

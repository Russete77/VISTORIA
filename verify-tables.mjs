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

console.log('🔍 Checking team management tables...\n')

// Try to query team_members table
const { data: members, error: membersError } = await supabase
  .from('team_members')
  .select('*')
  .limit(1)

if (membersError) {
  console.log('❌ team_members table does NOT exist')
  console.log('   Error:', membersError.message, '\n')
  console.log('📝 You need to execute the migration:')
  console.log('   1. Go to https://supabase.com/dashboard/project/fmmykrcqpguqihidolfj/sql/new')
  console.log('   2. Copy the SQL from: supabase/migrations/002_team_management.sql')
  console.log('   3. Paste it and click "Run"\n')
} else {
  console.log('✅ team_members table exists!')
  console.log(`   Rows: ${members?.length || 0}\n`)

  // Check other tables
  const { data: invites, error: invitesError } = await supabase
    .from('team_invites')
    .select('*')
    .limit(1)

  if (!invitesError) {
    console.log('✅ team_invites table exists!')
    console.log(`   Rows: ${invites?.length || 0}\n`)
  }

  const { data: activity, error: activityError } = await supabase
    .from('team_activity_log')
    .select('*')
    .limit(1)

  if (!activityError) {
    console.log('✅ team_activity_log table exists!')
    console.log(`   Rows: ${activity?.length || 0}\n`)
  }

  // Get current user to check if owner member was created
  const { data: user } = await supabase
    .from('users')
    .select('id, email, full_name')
    .eq('email', 'erickrussomat@gmail.com')
    .single()

  if (user) {
    console.log('👤 Developer user found:', user.email)

    const { data: ownerMember } = await supabase
      .from('team_members')
      .select('*')
      .eq('user_id', user.id)
      .eq('role', 'owner')
      .single()

    if (ownerMember) {
      console.log('✅ Owner team member exists for developer')
      console.log('   Role:', ownerMember.role)
      console.log('   Status:', ownerMember.status, '\n')
    } else {
      console.log('⚠️  Owner team member NOT found for developer')
      console.log('   Creating it now...\n')

      const { error: insertError } = await supabase
        .from('team_members')
        .insert({
          user_id: user.id,
          email: user.email,
          name: user.full_name || user.email,
          role: 'owner',
          status: 'active',
          accepted_at: new Date().toISOString(),
          last_active_at: new Date().toISOString(),
        })

      if (insertError) {
        console.log('❌ Failed to create owner member:', insertError.message)
      } else {
        console.log('✅ Owner team member created successfully!')
      }
    }
  }

  console.log('\n🎉 Team management system is ready to use!')
}

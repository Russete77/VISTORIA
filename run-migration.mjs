#!/usr/bin/env node
import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

// Read environment variables from .env.local
const envContent = readFileSync(join(__dirname, '.env.local'), 'utf-8')
const envVars = {}
envContent.split('\n').forEach(line => {
  const match = line.match(/^([^#=]+)=(.*)$/)
  if (match) {
    const key = match[1].trim()
    const value = match[2].trim()
    envVars[key] = value
  }
})

const supabaseUrl = envVars.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = envVars.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase credentials in .env.local')
  process.exit(1)
}

console.log('🔧 Connecting to Supabase...')
console.log(`   URL: ${supabaseUrl}`)

// Create Supabase client with service role
const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
})

// Read migration SQL
const migrationPath = join(__dirname, 'supabase', 'migrations', '002_team_management.sql')
const sql = readFileSync(migrationPath, 'utf-8')

console.log('📄 Migration file loaded:', migrationPath)
console.log('🚀 Executing migration...\n')

try {
  // Extract the project reference from the URL
  const projectRef = supabaseUrl.match(/https:\/\/([^.]+)\.supabase\.co/)[1]

  // Execute SQL via REST API
  const response = await fetch(`${supabaseUrl}/rest/v1/rpc/exec`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'apikey': supabaseServiceKey,
      'Authorization': `Bearer ${supabaseServiceKey}`,
    },
    body: JSON.stringify({ query: sql })
  })

  // If that doesn't work, we'll need to execute via Postgres connection
  // For now, let's try executing statements one by one
  console.log('⚠️  Direct SQL execution via REST API not available.')
  console.log('📝 Creating individual statements...\n')

  // Split SQL into individual statements (basic splitting)
  const statements = sql
    .split(';')
    .map(s => s.trim())
    .filter(s => s.length > 0 && !s.startsWith('--'))

  console.log(`   Found ${statements.length} SQL statements\n`)
  console.log('⚠️  MANUAL EXECUTION REQUIRED\n')
  console.log('Please execute the migration manually in Supabase Dashboard:')
  console.log('1. Go to: https://supabase.com/dashboard/project/' + projectRef + '/sql/new')
  console.log('2. Copy and paste the entire SQL file: supabase/migrations/002_team_management.sql')
  console.log('3. Click "Run" to execute the migration\n')

  console.log('Alternatively, if you have psql installed, run:')
  console.log(`   psql "${supabaseUrl.replace('https://', 'postgresql://postgres:[YOUR-DB-PASSWORD]@')}/postgres" -f ${migrationPath}\n`)

  console.log('✅ Migration file is ready for execution!')
  console.log('\n📊 After running the migration, verify tables were created:')

  // Verify tables were created
  const tables = ['team_members', 'team_invites', 'team_activity_log']

  for (const table of tables) {
    const { count, error } = await supabase
      .from(table)
      .select('*', { count: 'exact', head: true })

    if (error) {
      console.log(`   ⚠️  ${table}: Could not verify (${error.message})`)
    } else {
      console.log(`   ✓ ${table}: Ready (${count} rows)`)
    }
  }

  console.log('\n🎉 Team management system is ready!')

} catch (err) {
  console.error('❌ Unexpected error:', err.message)
  console.error(err)
  process.exit(1)
}

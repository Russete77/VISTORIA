#!/usr/bin/env node

/**
 * Verification Script: tenant_email Implementation
 * Checks if all components are properly implemented
 */

import { readFileSync, existsSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

console.log('🔍 Verificando implementação do tenant_email...\n')

const checks = {
  migration: false,
  types: false,
  apiRoute: false,
  wizard: false,
  detailsPage: false,
}

// Check 1: Migration SQL
console.log('1. Verificando migration SQL...')
const migrationPath = join(__dirname, 'supabase', 'migrations', '004_add_tenant_email.sql')
if (existsSync(migrationPath)) {
  const content = readFileSync(migrationPath, 'utf8')
  if (content.includes('tenant_email') && content.includes('VARCHAR(255)')) {
    checks.migration = true
    console.log('   ✓ Migration file exists and contains tenant_email column')
  } else {
    console.log('   ✗ Migration file exists but missing tenant_email column')
  }
} else {
  console.log('   ✗ Migration file not found')
}

// Check 2: Types
console.log('\n2. Verificando types/database.ts...')
const typesPath = join(__dirname, 'src', 'types', 'database.ts')
if (existsSync(typesPath)) {
  const content = readFileSync(typesPath, 'utf8')
  if (content.includes('tenant_email: string | null')) {
    checks.types = true
    console.log('   ✓ Type definition includes tenant_email')
  } else {
    console.log('   ✗ Type definition missing tenant_email')
  }
} else {
  console.log('   ✗ Types file not found')
}

// Check 3: API Route
console.log('\n3. Verificando API route...')
const apiPath = join(__dirname, 'src', 'app', 'api', 'inspections', 'route.ts')
if (existsSync(apiPath)) {
  const content = readFileSync(apiPath, 'utf8')
  if (content.includes('tenant_email') && content.includes('.email()')) {
    checks.apiRoute = true
    console.log('   ✓ API route validates tenant_email with Zod')
  } else {
    console.log('   ✗ API route missing tenant_email validation')
  }
} else {
  console.log('   ✗ API route file not found')
}

// Check 4: Wizard Form
console.log('\n4. Verificando wizard de criação...')
const wizardPath = join(__dirname, 'src', 'app', 'dashboard', 'inspections', 'new', 'page.tsx')
if (existsSync(wizardPath)) {
  const content = readFileSync(wizardPath, 'utf8')
  const hasFormData = content.includes('tenantEmail: string')
  const hasInput = content.includes('id="tenantEmail"')
  const hasLabel = content.includes('E-mail do Locatário')

  if (hasFormData && hasInput && hasLabel) {
    checks.wizard = true
    console.log('   ✓ Wizard form includes tenant_email field')
    console.log('   ✓ Input field properly configured')
    console.log('   ✓ Label and hints present')
  } else {
    console.log('   ✗ Wizard form incomplete:')
    if (!hasFormData) console.log('     - FormData interface missing tenantEmail')
    if (!hasInput) console.log('     - Input field missing')
    if (!hasLabel) console.log('     - Label missing')
  }
} else {
  console.log('   ✗ Wizard file not found')
}

// Check 5: Details Page
console.log('\n5. Verificando página de detalhes...')
const detailsPath = join(__dirname, 'src', 'app', 'dashboard', 'inspections', '[id]', 'page.tsx')
if (existsSync(detailsPath)) {
  const content = readFileSync(detailsPath, 'utf8')
  if (content.includes('inspection.tenant_email')) {
    checks.detailsPage = true
    console.log('   ✓ Details page displays tenant_email')
  } else {
    console.log('   ✗ Details page missing tenant_email display')
  }
} else {
  console.log('   ✗ Details page file not found')
}

// Summary
console.log('\n' + '='.repeat(50))
console.log('RESUMO DA VERIFICAÇÃO\n')

const allChecks = Object.values(checks)
const passed = allChecks.filter(Boolean).length
const total = allChecks.length

console.log(`Checks Passed: ${passed}/${total}`)
console.log('')

Object.entries(checks).forEach(([name, status]) => {
  const icon = status ? '✓' : '✗'
  const label = name.replace(/([A-Z])/g, ' $1').toLowerCase()
  console.log(`${icon} ${label}`)
})

console.log('\n' + '='.repeat(50))

if (passed === total) {
  console.log('✓ IMPLEMENTAÇÃO COMPLETA!')
  console.log('\nPróximos passos:')
  console.log('1. Execute a migration no Supabase Dashboard')
  console.log('2. Teste criar uma vistoria com email')
  console.log('3. Verifique a página de detalhes')
  process.exit(0)
} else {
  console.log('✗ IMPLEMENTAÇÃO INCOMPLETA')
  console.log(`\n${total - passed} check(s) falharam. Revise os arquivos acima.`)
  process.exit(1)
}

#!/usr/bin/env node

/**
 * Test Script - Landlord Disputes Access
 *
 * Este script testa a implementação do acesso de proprietários às contestações.
 *
 * Uso:
 *   node test-landlord-access.mjs
 */

import { createClient } from '@supabase/supabase-js'
import { SignJWT, jwtVerify } from 'jose'

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-this-in-production'

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error('❌ Variáveis de ambiente necessárias não encontradas')
  console.error('   NEXT_PUBLIC_SUPABASE_URL')
  console.error('   SUPABASE_SERVICE_ROLE_KEY')
  process.exit(1)
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)

// =============================================================================
// Helper Functions
// =============================================================================

function getSecretKey() {
  return new TextEncoder().encode(JWT_SECRET)
}

async function generateLandlordToken(landlordEmail, userId) {
  const expiryDate = new Date()
  expiryDate.setDate(expiryDate.getDate() + 90)

  const token = await new SignJWT({
    landlordEmail,
    userId,
  })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(expiryDate)
    .setIssuer('vistoria-pro')
    .setAudience('landlord-access')
    .sign(getSecretKey())

  return token
}

async function verifyLandlordToken(token) {
  try {
    const { payload } = await jwtVerify(token, getSecretKey(), {
      issuer: 'vistoria-pro',
      audience: 'landlord-access',
    })
    return payload
  } catch (error) {
    console.error('❌ Erro ao verificar token:', error.message)
    return null
  }
}

// =============================================================================
// Tests
// =============================================================================

async function testDatabaseSchema() {
  console.log('\n📋 Teste 1: Verificando schema do banco...')

  // Check if landlord_access_token column exists
  const { data: disputes, error } = await supabase
    .from('disputes')
    .select('id, landlord_access_token')
    .limit(1)

  if (error) {
    console.error('❌ Erro ao consultar disputes:', error.message)
    return false
  }

  console.log('✅ Coluna landlord_access_token existe')
  return true
}

async function testDatabaseFunctions() {
  console.log('\n📋 Teste 2: Verificando funções do banco...')

  // Test get_landlord_disputes function
  const testEmail = 'teste@proprietario.com'
  const { data, error: funcError } = await supabase
    .rpc('get_landlord_disputes', {
      p_landlord_email: testEmail,
    })

  if (funcError) {
    console.error('❌ Função get_landlord_disputes não existe:', funcError.message)
    return false
  }

  console.log('✅ Função get_landlord_disputes existe')

  // Test verify_landlord_access function
  const { data: accessData, error: accessError } = await supabase
    .rpc('verify_landlord_access', {
      p_dispute_id: '00000000-0000-0000-0000-000000000000',
      p_landlord_email: testEmail,
    })

  if (accessError) {
    console.error('❌ Função verify_landlord_access não existe:', accessError.message)
    return false
  }

  console.log('✅ Função verify_landlord_access existe')
  return true
}

async function testTokenGeneration() {
  console.log('\n📋 Teste 3: Testando geração de tokens...')

  const testEmail = 'proprietario@teste.com'
  const testUserId = '12345678-1234-1234-1234-123456789012'

  try {
    const token = await generateLandlordToken(testEmail, testUserId)
    console.log('✅ Token gerado com sucesso')
    console.log(`   Token: ${token.substring(0, 50)}...`)

    // Verify token
    const payload = await verifyLandlordToken(token)
    if (!payload) {
      console.error('❌ Falha ao verificar token')
      return false
    }

    if (payload.landlordEmail !== testEmail) {
      console.error('❌ Email no payload não coincide')
      return false
    }

    console.log('✅ Token verificado com sucesso')
    console.log(`   Email: ${payload.landlordEmail}`)
    console.log(`   User ID: ${payload.userId}`)
    console.log(`   Expira em: ${new Date(payload.exp * 1000).toLocaleString('pt-BR')}`)

    return true
  } catch (error) {
    console.error('❌ Erro ao gerar/verificar token:', error.message)
    return false
  }
}

async function testDisputeWithLandlordToken() {
  console.log('\n📋 Teste 4: Verificando contestações com landlord_access_token...')

  const { data: disputes, error } = await supabase
    .from('disputes')
    .select('id, protocol, landlord_access_token')
    .not('landlord_access_token', 'is', null)
    .limit(5)

  if (error) {
    console.error('❌ Erro ao buscar disputes:', error.message)
    return false
  }

  if (!disputes || disputes.length === 0) {
    console.log('⚠️  Nenhuma contestação com landlord_access_token encontrada')
    console.log('   Isso é normal se você ainda não criou contestações após a migração')
    return true
  }

  console.log(`✅ Encontradas ${disputes.length} contestações com landlord_access_token`)

  // Test first token
  const firstDispute = disputes[0]
  console.log(`\n   Testando token da contestação ${firstDispute.protocol}...`)

  const payload = await verifyLandlordToken(firstDispute.landlord_access_token)
  if (!payload) {
    console.error('   ❌ Token inválido')
    return false
  }

  console.log('   ✅ Token válido')
  console.log(`   Email do proprietário: ${payload.landlordEmail}`)

  return true
}

async function testLandlordDisputesAccess() {
  console.log('\n📋 Teste 5: Testando acesso de proprietário...')

  // Find an inspection with landlord_email
  const { data: inspections, error: inspError } = await supabase
    .from('inspections')
    .select('id, landlord_email, property_id')
    .not('landlord_email', 'is', null)
    .limit(1)

  if (inspError) {
    console.error('❌ Erro ao buscar vistorias:', inspError.message)
    return false
  }

  if (!inspections || inspections.length === 0) {
    console.log('⚠️  Nenhuma vistoria com landlord_email encontrada')
    console.log('   Crie uma vistoria com email do proprietário para testar')
    return true
  }

  const inspection = inspections[0]
  console.log(`✅ Vistoria encontrada com landlord_email: ${inspection.landlord_email}`)

  // Get disputes for this landlord
  const { data: disputes, error: dispError } = await supabase
    .rpc('get_landlord_disputes', {
      p_landlord_email: inspection.landlord_email,
    })

  if (dispError) {
    console.error('❌ Erro ao buscar contestações do proprietário:', dispError.message)
    return false
  }

  console.log(`✅ Proprietário tem ${disputes.length} contestação(ões)`)

  if (disputes.length > 0) {
    console.log('\n   Contestações encontradas:')
    disputes.forEach((d) => {
      console.log(`   - ${d.protocol}: ${d.item_description}`)
    })
  }

  return true
}

// =============================================================================
// Run Tests
// =============================================================================

async function runTests() {
  console.log('🚀 Iniciando testes do Landlord Disputes Access\n')
  console.log('=' .repeat(60))

  const results = {
    schema: await testDatabaseSchema(),
    functions: await testDatabaseFunctions(),
    tokens: await testTokenGeneration(),
    disputes: await testDisputeWithLandlordToken(),
    access: await testLandlordDisputesAccess(),
  }

  console.log('\n' + '=' .repeat(60))
  console.log('\n📊 Resultados dos Testes:\n')

  const tests = [
    { name: 'Schema do Banco', result: results.schema },
    { name: 'Funções do Banco', result: results.functions },
    { name: 'Geração de Tokens', result: results.tokens },
    { name: 'Contestações com Token', result: results.disputes },
    { name: 'Acesso de Proprietário', result: results.access },
  ]

  tests.forEach(({ name, result }) => {
    const icon = result ? '✅' : '❌'
    console.log(`${icon} ${name}`)
  })

  const allPassed = Object.values(results).every((r) => r)

  console.log('\n' + '=' .repeat(60))

  if (allPassed) {
    console.log('\n🎉 Todos os testes passaram! Sistema pronto para uso.\n')
  } else {
    console.log('\n⚠️  Alguns testes falharam. Verifique os erros acima.\n')
    process.exit(1)
  }
}

runTests().catch((error) => {
  console.error('\n💥 Erro fatal:', error)
  process.exit(1)
})

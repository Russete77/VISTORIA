#!/usr/bin/env node
/**
 * Script para Reprocessar Comparação - VistorIA Pro
 *
 * Este script reseta o status de uma comparação e a coloca de volta na fila
 * para reprocessamento. Útil quando:
 * - Houve um bug que foi corrigido (ex: room name mismatch)
 * - A comparação falhou por erro temporário
 * - Você quer reprocessar com nova lógica de análise
 *
 * Uso:
 *   node scripts/reprocess-comparison.mjs <comparison-id>
 *
 * Exemplo:
 *   node scripts/reprocess-comparison.mjs 123e4567-e89b-12d3-a456-426614174000
 */

import { createClient } from '@supabase/supabase-js'

// Configuração do Supabase
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Erro: Variáveis de ambiente não configuradas')
  console.error('Configure NEXT_PUBLIC_SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

// Parse argumentos da linha de comando
const comparisonId = process.argv[2]

if (!comparisonId) {
  console.error('❌ Uso: node reprocess-comparison.mjs <comparison-id>')
  console.error('')
  console.error('Exemplo:')
  console.error('  node reprocess-comparison.mjs 123e4567-e89b-12d3-a456-426614174000')
  process.exit(1)
}

console.log('🔄 VistorIA Pro - Reprocessar Comparação')
console.log('========================================')
console.log('')

async function reprocessComparison() {
  try {
    // 1. Verificar se a comparação existe
    console.log(`📋 Buscando comparação ${comparisonId}...`)
    const { data: comparison, error: fetchError } = await supabase
      .from('comparisons')
      .select('*, property:properties(name), user:users(email)')
      .eq('id', comparisonId)
      .single()

    if (fetchError || !comparison) {
      console.error('❌ Erro: Comparação não encontrada')
      console.error(fetchError)
      process.exit(1)
    }

    console.log('✅ Comparação encontrada:')
    console.log(`   - Propriedade: ${comparison.property?.name || 'N/A'}`)
    console.log(`   - Usuário: ${comparison.user?.email || 'N/A'}`)
    console.log(`   - Status Atual: ${comparison.status}`)
    console.log(`   - Diferenças Detectadas: ${comparison.differences_detected || 0}`)
    console.log('')

    // 2. Verificar se já está em processamento
    if (comparison.status === 'processing') {
      console.warn('⚠️  Aviso: Comparação já está em processamento')
      console.log('   Aguarde o processamento terminar ou force o reset.')

      const readline = await import('readline')
      const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout
      })

      const answer = await new Promise((resolve) => {
        rl.question('   Forçar reset? (s/N): ', resolve)
      })
      rl.close()

      if (answer.toLowerCase() !== 's') {
        console.log('❌ Operação cancelada')
        process.exit(0)
      }
    }

    // 3. Deletar diferenças antigas (para reprocessar do zero)
    console.log('🗑️  Deletando diferenças antigas...')
    const { error: deleteError } = await supabase
      .from('comparison_differences')
      .delete()
      .eq('comparison_id', comparisonId)

    if (deleteError) {
      console.error('❌ Erro ao deletar diferenças:', deleteError)
      // Continuar mesmo com erro (pode não ter diferenças)
    } else {
      console.log('✅ Diferenças antigas deletadas')
    }

    // 4. Resetar status da comparação para 'processing'
    console.log('🔄 Resetando status da comparação...')
    const { error: updateError } = await supabase
      .from('comparisons')
      .update({
        status: 'processing',
        differences_detected: 0,
        new_damages: 0,
        estimated_repair_cost: 0,
        updated_at: new Date().toISOString(),
      })
      .eq('id', comparisonId)

    if (updateError) {
      console.error('❌ Erro ao resetar status:', updateError)
      process.exit(1)
    }

    console.log('✅ Status resetado para "processing"')
    console.log('')

    // 5. Instruções para reprocessar
    console.log('📝 Próximos passos:')
    console.log('')
    console.log('   OPÇÃO A - Trigger automático (recomendado):')
    console.log('   O sistema vai detectar o status "processing" e reprocessar automaticamente')
    console.log('   se você tiver um cron job ou worker configurado.')
    console.log('')
    console.log('   OPÇÃO B - Trigger manual via API:')
    console.log(`   curl -X POST http://localhost:3000/api/comparisons/${comparisonId}/reprocess \\`)
    console.log('        -H "Authorization: Bearer YOUR_TOKEN"')
    console.log('')
    console.log('   OPÇÃO C - Deletar e recriar a comparação:')
    console.log('   Vá no dashboard e crie uma nova comparação com as mesmas vistorias.')
    console.log('')

    console.log('✅ Comparação resetada com sucesso!')
    console.log(`   ID: ${comparisonId}`)
    console.log(`   Status: processing`)
    console.log('')
    console.log('⏳ Aguarde alguns minutos para o reprocessamento concluir.')

  } catch (error) {
    console.error('❌ Erro inesperado:', error)
    process.exit(1)
  }
}

// Executar script
reprocessComparison()

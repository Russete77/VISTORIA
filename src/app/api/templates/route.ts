/**
 * API Route: PDF Templates
 * GET /api/templates - Lista templates do usuário
 * POST /api/templates - Cria novo template
 */

import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { createAdminClient } from '@/lib/supabase/server'
import { DEFAULT_TEMPLATE_CONFIG, createTemplateConfig } from '@/types/pdf-template'

// GET: Listar templates do usuário + templates do sistema
export async function GET(request: NextRequest) {
  console.log('[Templates API] GET chamado')

  try {
    const { userId } = await auth()
    console.log('[Templates API] userId:', userId)

    if (!userId) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    const supabase = createAdminClient()

    // Buscar user_id do Supabase
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('id')
      .eq('clerk_id', userId)
      .single()

    console.log('[Templates API] user:', user, 'error:', userError)

    if (userError || !user) {
      return NextResponse.json({ error: 'Usuário não encontrado' }, { status: 404 })
    }

    // Buscar templates do sistema (is_system = true)
    const { data: templates, error: templatesError } = await supabase
      .from('pdf_templates')
      .select('*')
      .eq('is_system', true)
      .order('created_at', { ascending: false })

    console.log('[Templates API] templates:', templates?.length, 'error:', templatesError)

    return NextResponse.json({
      templates: templates || [],
      preferences: null,
      defaultConfig: DEFAULT_TEMPLATE_CONFIG,
    })
  } catch (error) {
    console.error('[Templates API] Erro:', error)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}

// POST: Criar novo template
export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    const supabase = createAdminClient()

    // Buscar user_id do Supabase
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('id')
      .eq('clerk_id', userId)
      .single()

    if (userError || !user) {
      return NextResponse.json({ error: 'Usuário não encontrado' }, { status: 404 })
    }

    const body = await request.json()
    const { name, description, type, config, is_default } = body

    // Validação
    if (!name || name.length < 2) {
      return NextResponse.json({ error: 'Nome do template é obrigatório (mínimo 2 caracteres)' }, { status: 400 })
    }

    if (!type || !['inspection', 'comparison', 'both'].includes(type)) {
      return NextResponse.json({ error: 'Tipo inválido' }, { status: 400 })
    }

    // Criar configuração completa (merge com defaults)
    const fullConfig = createTemplateConfig(config || {})

    // Criar template
    const { data: template, error } = await supabase
      .from('pdf_templates')
      .insert({
        user_id: user.id,
        name,
        description,
        type,
        config: fullConfig,
        is_default: is_default || false,
        is_system: false,
      })
      .select()
      .single()

    if (error) {
      console.error('[Templates] Erro ao criar:', error)
      return NextResponse.json({ error: 'Erro ao criar template' }, { status: 500 })
    }

    return NextResponse.json({ template }, { status: 201 })
  } catch (error) {
    console.error('[Templates] Erro:', error)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}

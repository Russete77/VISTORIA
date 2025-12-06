/**
 * API Route: Template Preferences
 * GET /api/templates/preferences - Busca preferências do usuário
 * PUT /api/templates/preferences - Atualiza preferências
 */

import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { createClient } from '@/lib/supabase/server'

// GET: Buscar preferências de template do usuário
export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    const supabase = await createClient()

    // Buscar user_id do Supabase
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('id')
      .eq('clerk_id', userId)
      .single()

    if (userError || !user) {
      return NextResponse.json({ error: 'Usuário não encontrado' }, { status: 404 })
    }

    // Buscar preferências
    const { data: preferences, error } = await supabase
      .from('user_template_preferences')
      .select(`
        *,
        default_inspection_template:pdf_templates!default_inspection_template_id(*),
        default_comparison_template:pdf_templates!default_comparison_template_id(*)
      `)
      .eq('user_id', user.id)
      .single()

    if (error && error.code !== 'PGRST116') { // PGRST116 = not found
      console.error('[Preferences] Erro ao buscar:', error)
      return NextResponse.json({ error: 'Erro ao buscar preferências' }, { status: 500 })
    }

    // Se não existe, retornar defaults
    if (!preferences) {
      // Buscar template padrão do sistema
      const { data: defaultTemplate } = await supabase
        .from('pdf_templates')
        .select('*')
        .eq('is_system', true)
        .eq('name', 'VistorIA Padrão')
        .single()

      return NextResponse.json({
        preferences: {
          user_id: user.id,
          default_inspection_template_id: defaultTemplate?.id || null,
          default_comparison_template_id: defaultTemplate?.id || null,
          default_inspection_template: defaultTemplate || null,
          default_comparison_template: defaultTemplate || null,
        }
      })
    }

    return NextResponse.json({ preferences })
  } catch (error) {
    console.error('[Preferences] Erro:', error)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}

// PUT: Atualizar preferências
export async function PUT(request: NextRequest) {
  try {
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    const supabase = await createClient()

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
    const { default_inspection_template_id, default_comparison_template_id } = body

    // Validar que os templates existem (se fornecidos)
    if (default_inspection_template_id) {
      const { data: template, error } = await supabase
        .from('pdf_templates')
        .select('id')
        .eq('id', default_inspection_template_id)
        .or(`user_id.eq.${user.id},is_system.eq.true`)
        .single()

      if (error || !template) {
        return NextResponse.json({ error: 'Template de inspeção não encontrado' }, { status: 404 })
      }
    }

    if (default_comparison_template_id) {
      const { data: template, error } = await supabase
        .from('pdf_templates')
        .select('id')
        .eq('id', default_comparison_template_id)
        .or(`user_id.eq.${user.id},is_system.eq.true`)
        .single()

      if (error || !template) {
        return NextResponse.json({ error: 'Template de comparação não encontrado' }, { status: 404 })
      }
    }

    // Upsert preferências
    const { data: preferences, error } = await supabase
      .from('user_template_preferences')
      .upsert({
        user_id: user.id,
        default_inspection_template_id: default_inspection_template_id || null,
        default_comparison_template_id: default_comparison_template_id || null,
      })
      .select()
      .single()

    if (error) {
      console.error('[Preferences] Erro ao atualizar:', error)
      return NextResponse.json({ error: 'Erro ao atualizar preferências' }, { status: 500 })
    }

    return NextResponse.json({ preferences })
  } catch (error) {
    console.error('[Preferences] Erro:', error)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}

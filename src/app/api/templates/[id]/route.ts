/**
 * API Route: PDF Template Individual
 * GET /api/templates/[id] - Busca template específico
 * PUT /api/templates/[id] - Atualiza template
 * DELETE /api/templates/[id] - Deleta template
 */

import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { createClient } from '@/lib/supabase/server'
import { createTemplateConfig } from '@/types/pdf-template'

interface RouteContext {
  params: Promise<{ id: string }>
}

// GET: Buscar template específico
export async function GET(request: NextRequest, context: RouteContext) {
  try {
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    const { id } = await context.params
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

    // Buscar template (próprio ou do sistema)
    const { data: template, error } = await supabase
      .from('pdf_templates')
      .select('*')
      .eq('id', id)
      .or(`user_id.eq.${user.id},is_system.eq.true`)
      .single()

    if (error || !template) {
      return NextResponse.json({ error: 'Template não encontrado' }, { status: 404 })
    }

    return NextResponse.json({ template })
  } catch (error) {
    console.error('[Templates] Erro:', error)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}

// PUT: Atualizar template
export async function PUT(request: NextRequest, context: RouteContext) {
  try {
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    const { id } = await context.params
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

    // Verificar se template existe e pertence ao usuário
    const { data: existingTemplate, error: fetchError } = await supabase
      .from('pdf_templates')
      .select('*')
      .eq('id', id)
      .single()

    if (fetchError || !existingTemplate) {
      return NextResponse.json({ error: 'Template não encontrado' }, { status: 404 })
    }

    // Não permitir editar templates do sistema
    if (existingTemplate.is_system) {
      return NextResponse.json({ error: 'Templates do sistema não podem ser editados' }, { status: 403 })
    }

    // Verificar se pertence ao usuário
    if (existingTemplate.user_id !== user.id) {
      return NextResponse.json({ error: 'Sem permissão para editar este template' }, { status: 403 })
    }

    const body = await request.json()
    const { name, description, type, config, is_default } = body

    // Preparar dados para atualização
    const updateData: any = {}

    if (name !== undefined) {
      if (name.length < 2) {
        return NextResponse.json({ error: 'Nome deve ter pelo menos 2 caracteres' }, { status: 400 })
      }
      updateData.name = name
    }

    if (description !== undefined) {
      updateData.description = description
    }

    if (type !== undefined) {
      if (!['inspection', 'comparison', 'both'].includes(type)) {
        return NextResponse.json({ error: 'Tipo inválido' }, { status: 400 })
      }
      updateData.type = type
    }

    if (config !== undefined) {
      // Merge com config existente
      updateData.config = createTemplateConfig({
        ...existingTemplate.config,
        ...config,
      })
    }

    if (is_default !== undefined) {
      updateData.is_default = is_default
    }

    // Atualizar
    const { data: template, error } = await supabase
      .from('pdf_templates')
      .update(updateData)
      .eq('id', id)
      .select()
      .single()

    if (error) {
      console.error('[Templates] Erro ao atualizar:', error)
      return NextResponse.json({ error: 'Erro ao atualizar template' }, { status: 500 })
    }

    return NextResponse.json({ template })
  } catch (error) {
    console.error('[Templates] Erro:', error)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}

// DELETE: Deletar template
export async function DELETE(request: NextRequest, context: RouteContext) {
  try {
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    const { id } = await context.params
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

    // Verificar se template existe
    const { data: existingTemplate, error: fetchError } = await supabase
      .from('pdf_templates')
      .select('*')
      .eq('id', id)
      .single()

    if (fetchError || !existingTemplate) {
      return NextResponse.json({ error: 'Template não encontrado' }, { status: 404 })
    }

    // Não permitir deletar templates do sistema
    if (existingTemplate.is_system) {
      return NextResponse.json({ error: 'Templates do sistema não podem ser deletados' }, { status: 403 })
    }

    // Verificar se pertence ao usuário
    if (existingTemplate.user_id !== user.id) {
      return NextResponse.json({ error: 'Sem permissão para deletar este template' }, { status: 403 })
    }

    // Deletar
    const { error } = await supabase
      .from('pdf_templates')
      .delete()
      .eq('id', id)

    if (error) {
      console.error('[Templates] Erro ao deletar:', error)
      return NextResponse.json({ error: 'Erro ao deletar template' }, { status: 500 })
    }

    return NextResponse.json({ success: true, message: 'Template deletado com sucesso' })
  } catch (error) {
    console.error('[Templates] Erro:', error)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}

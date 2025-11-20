import { NextRequest, NextResponse } from 'next/server'
import { currentUser } from '@clerk/nextjs/server'
import { createClient } from '@/lib/supabase/server'
import { z } from 'zod'
import type { TeamRole } from '@/types/database'

/**
 * DELETE /api/team/members/[id]
 * Remove a team member
 *
 * Params:
 * - id: Team member ID
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    const clerkUser = await currentUser()
    if (!clerkUser) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const supabase = await createClient()

    // Get current user from database
    const { data: dbUser, error: userError } = await supabase
      .from('users')
      .select('id, email')
      .eq('clerk_id', clerkUser.id)
      .single()

    if (userError || !dbUser) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    // Check if user has permission (owner or admin)
    const { data: currentMember } = await supabase
      .from('team_members')
      .select('role')
      .eq('user_id', dbUser.id)
      .eq('email', dbUser.email)
      .is('deleted_at', null)
      .single()

    if (!currentMember || !['owner', 'admin'].includes(currentMember.role)) {
      return NextResponse.json(
        { error: 'Você não tem permissão para remover membros' },
        { status: 403 }
      )
    }

    // Get member to delete
    const { data: memberToDelete, error: memberError } = await supabase
      .from('team_members')
      .select('*')
      .eq('id', id)
      .eq('user_id', dbUser.id)
      .is('deleted_at', null)
      .single()

    if (memberError || !memberToDelete) {
      return NextResponse.json(
        { error: 'Membro não encontrado' },
        { status: 404 }
      )
    }

    // Cannot delete owner
    if (memberToDelete.role === 'owner') {
      return NextResponse.json(
        { error: 'Não é possível remover o proprietário da equipe' },
        { status: 400 }
      )
    }

    // Soft delete the member
    const { error: deleteError } = await supabase
      .from('team_members')
      .update({ deleted_at: new Date().toISOString() })
      .eq('id', id)

    if (deleteError) {
      console.error('Error deleting team member:', deleteError)
      return NextResponse.json(
        { error: 'Erro ao remover membro' },
        { status: 500 }
      )
    }

    // Cancel any pending invites
    await supabase
      .from('team_invites')
      .update({ status: 'cancelled' })
      .eq('user_id', dbUser.id)
      .eq('email', memberToDelete.email)
      .eq('status', 'pending')

    // Log activity
    await supabase.from('team_activity_log').insert({
      user_id: dbUser.id,
      team_member_id: id,
      action: 'removed_team_member',
      entity_type: 'team_member',
      entity_id: id,
      metadata: {
        email: memberToDelete.email,
        role: memberToDelete.role,
        removed_by: dbUser.email,
      },
    })

    return NextResponse.json({
      success: true,
      message: 'Membro removido com sucesso',
    })
  } catch (error) {
    console.error('Error in DELETE /api/team/members/[id]:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

/**
 * PATCH /api/team/members/[id]
 * Update a team member's role
 *
 * Params:
 * - id: Team member ID
 *
 * Body:
 * - role: New role (owner, admin, member, viewer)
 */

const updateSchema = z.object({
  role: z.enum(['owner', 'admin', 'member', 'viewer'], {
    errorMap: () => ({ message: 'Função inválida' }),
  }),
})

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    const clerkUser = await currentUser()
    if (!clerkUser) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const supabase = await createClient()

    // Get current user from database
    const { data: dbUser, error: userError } = await supabase
      .from('users')
      .select('id, email')
      .eq('clerk_id', clerkUser.id)
      .single()

    if (userError || !dbUser) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    // Check if user has permission (owner or admin)
    const { data: currentMember } = await supabase
      .from('team_members')
      .select('role')
      .eq('user_id', dbUser.id)
      .eq('email', dbUser.email)
      .is('deleted_at', null)
      .single()

    if (!currentMember || !['owner', 'admin'].includes(currentMember.role)) {
      return NextResponse.json(
        { error: 'Você não tem permissão para alterar funções' },
        { status: 403 }
      )
    }

    // Parse and validate body
    const body = await request.json()
    const validation = updateSchema.safeParse(body)

    if (!validation.success) {
      return NextResponse.json(
        { error: validation.error.errors[0].message },
        { status: 400 }
      )
    }

    const { role } = validation.data

    // Get member to update
    const { data: memberToUpdate, error: memberError } = await supabase
      .from('team_members')
      .select('*')
      .eq('id', id)
      .eq('user_id', dbUser.id)
      .is('deleted_at', null)
      .single()

    if (memberError || !memberToUpdate) {
      return NextResponse.json(
        { error: 'Membro não encontrado' },
        { status: 404 }
      )
    }

    // Cannot change owner role
    if (memberToUpdate.role === 'owner') {
      return NextResponse.json(
        { error: 'Não é possível alterar a função do proprietário' },
        { status: 400 }
      )
    }

    // Only owner can assign owner role
    if (role === 'owner' && currentMember.role !== 'owner') {
      return NextResponse.json(
        { error: 'Apenas o proprietário pode transferir a propriedade' },
        { status: 403 }
      )
    }

    // If assigning owner role, demote current owner to admin
    if (role === 'owner') {
      await supabase
        .from('team_members')
        .update({ role: 'admin' })
        .eq('user_id', dbUser.id)
        .eq('role', 'owner')
    }

    // Update member role
    const { data: updatedMember, error: updateError } = await supabase
      .from('team_members')
      .update({ role: role as TeamRole })
      .eq('id', id)
      .select()
      .single()

    if (updateError) {
      console.error('Error updating team member:', updateError)
      return NextResponse.json(
        { error: 'Erro ao atualizar membro' },
        { status: 500 }
      )
    }

    // Log activity
    await supabase.from('team_activity_log').insert({
      user_id: dbUser.id,
      team_member_id: id,
      action: 'changed_member_role',
      entity_type: 'team_member',
      entity_id: id,
      metadata: {
        email: memberToUpdate.email,
        old_role: memberToUpdate.role,
        new_role: role,
        changed_by: dbUser.email,
      },
    })

    return NextResponse.json({
      success: true,
      member: updatedMember,
      message: 'Função atualizada com sucesso',
    })
  } catch (error) {
    console.error('Error in PATCH /api/team/members/[id]:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

import { NextRequest, NextResponse } from 'next/server'
import { currentUser } from '@clerk/nextjs/server'
import { createClient } from '@/lib/supabase/server'
import { z } from 'zod'
import crypto from 'crypto'
import type { TeamRole } from '@/types/database'

/**
 * POST /api/team/invite
 * Send an invitation to join the team
 *
 * Body:
 * - email: Email of the person to invite
 * - role: Role to assign (admin, member, viewer)
 */

const inviteSchema = z.object({
  email: z.string().email('Email inválido'),
  role: z.enum(['admin', 'member', 'viewer'], {
    errorMap: () => ({ message: 'Função inválida' }),
  }),
})

export async function POST(request: NextRequest) {
  try {
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
      .select('id, tier, email')
      .eq('clerk_id', clerkUser.id)
      .single()

    if (userError || !dbUser) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    // Check if user has permission to invite (owner or admin)
    const { data: currentMember } = await supabase
      .from('team_members')
      .select('role')
      .eq('user_id', dbUser.id)
      .eq('email', dbUser.email)
      .is('deleted_at', null)
      .single()

    if (!currentMember || !['owner', 'admin'].includes(currentMember.role)) {
      return NextResponse.json(
        { error: 'Você não tem permissão para convidar membros' },
        { status: 403 }
      )
    }

    // Parse and validate body
    const body = await request.json()
    const validation = inviteSchema.safeParse(body)

    if (!validation.success) {
      return NextResponse.json(
        { error: validation.error.errors[0].message },
        { status: 400 }
      )
    }

    const { email, role } = validation.data

    // Check if trying to invite self
    if (email.toLowerCase() === dbUser.email.toLowerCase()) {
      return NextResponse.json(
        { error: 'Você não pode convidar a si mesmo' },
        { status: 400 }
      )
    }

    // Check user limits based on tier
    const limits = {
      professional: 3,
      business: 10,
      enterprise: 999,
    }

    const userLimit = limits[dbUser.tier as keyof typeof limits] || 1

    // Count current team members
    const { count: memberCount } = await supabase
      .from('team_members')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', dbUser.id)
      .is('deleted_at', null)

    if (memberCount && memberCount >= userLimit) {
      return NextResponse.json(
        {
          error: 'Limite de membros atingido',
          message: `Seu plano ${dbUser.tier} permite até ${userLimit} membros. Faça upgrade para adicionar mais.`,
        },
        { status: 400 }
      )
    }

    // Check if member already exists
    const { data: existingMember } = await supabase
      .from('team_members')
      .select('id, status')
      .eq('user_id', dbUser.id)
      .eq('email', email.toLowerCase())
      .is('deleted_at', null)
      .single()

    if (existingMember) {
      const statusMessage =
        existingMember.status === 'active'
          ? 'Este usuário já é membro da equipe'
          : 'Já existe um convite pendente para este email'

      return NextResponse.json(
        { error: statusMessage },
        { status: 400 }
      )
    }

    // Check if there's an active invite
    const { data: existingInvite } = await supabase
      .from('team_invites')
      .select('id, status')
      .eq('user_id', dbUser.id)
      .eq('email', email.toLowerCase())
      .eq('status', 'pending')
      .single()

    if (existingInvite) {
      return NextResponse.json(
        { error: 'Já existe um convite pendente para este email' },
        { status: 400 }
      )
    }

    // Generate unique token
    const token = crypto.randomBytes(32).toString('hex')

    // Create invite (expires in 7 days)
    const expiresAt = new Date()
    expiresAt.setDate(expiresAt.getDate() + 7)

    const { data: invite, error: inviteError } = await supabase
      .from('team_invites')
      .insert({
        user_id: dbUser.id,
        email: email.toLowerCase(),
        role: role as TeamRole,
        token,
        status: 'pending',
        expires_at: expiresAt.toISOString(),
      })
      .select()
      .single()

    if (inviteError) {
      console.error('Error creating invite:', inviteError)
      return NextResponse.json(
        { error: 'Erro ao criar convite' },
        { status: 500 }
      )
    }

    // Create pending team member
    const { data: teamMember, error: memberError } = await supabase
      .from('team_members')
      .insert({
        user_id: dbUser.id,
        email: email.toLowerCase(),
        name: email.split('@')[0], // Temporary name until user accepts
        role: role as TeamRole,
        status: 'pending',
        invited_at: new Date().toISOString(),
      })
      .select()
      .single()

    if (memberError) {
      console.error('Error creating team member:', memberError)
      // Rollback invite
      await supabase.from('team_invites').delete().eq('id', invite.id)
      return NextResponse.json(
        { error: 'Erro ao criar membro da equipe' },
        { status: 500 }
      )
    }

    // Log activity
    await supabase.from('team_activity_log').insert({
      user_id: dbUser.id,
      team_member_id: teamMember.id,
      action: 'invited_team_member',
      entity_type: 'team_member',
      entity_id: teamMember.id,
      metadata: {
        email,
        role,
        invited_by: dbUser.email,
      },
    })

    // TODO: Send invitation email
    // For now, we'll just return the invite data
    // In production, integrate with email service (SendGrid, Resend, etc.)

    return NextResponse.json({
      success: true,
      invite: {
        id: invite.id,
        email: invite.email,
        role: invite.role,
        expires_at: invite.expires_at,
      },
      teamMember: {
        id: teamMember.id,
        email: teamMember.email,
        name: teamMember.name,
        role: teamMember.role,
        status: teamMember.status,
      },
      message: 'Convite enviado com sucesso',
    })
  } catch (error) {
    console.error('Error in POST /api/team/invite:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

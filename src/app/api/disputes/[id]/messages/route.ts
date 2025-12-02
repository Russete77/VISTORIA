import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { createAdminClient } from '@/lib/supabase/server'
import { createDisputeMessageSchema } from '@/lib/validations/disputes'
import { verifyDisputeToken } from '@/lib/utils/jwt'
import { z } from 'zod'

/**
 * Dispute Messages API - VistorIA Pro
 * POST: Add message to dispute (both tenant and admin)
 */

interface RouteParams {
  params: Promise<{ id: string }>
}

// POST: Add message to dispute
export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const { id: disputeId } = await params
    const supabase = createAdminClient()

    // Check if request is from authenticated user (admin) or public tenant
    const { userId } = await auth()
    let isAdmin = false
    let authorName: string | null = null
    let authorUserId: string | null = null

    if (userId) {
      // Admin user
      isAdmin = true

      // Get user from database
      const { data: user } = await supabase
        .from('users')
        .select('id, full_name, first_name, last_name')
        .eq('clerk_id', userId)
        .single()

      if (!user) {
        return NextResponse.json({ error: 'User not found' }, { status: 404 })
      }

      authorUserId = user.id
      authorName = user.full_name || `${user.first_name} ${user.last_name}`.trim()

      // Verify admin has access to this dispute
      const { data: dispute } = await supabase
        .from('disputes')
        .select('user_id')
        .eq('id', disputeId)
        .is('deleted_at', null)
        .single()

      if (!dispute || dispute.user_id !== user.id) {
        return NextResponse.json(
          { error: 'Dispute not found or access denied' },
          { status: 404 }
        )
      }
    } else {
      // Tenant with token
      const token =
        request.nextUrl.searchParams.get('token') ||
        request.headers.get('Authorization')?.replace('Bearer ', '')

      if (!token) {
        return NextResponse.json(
          { error: 'Authentication required' },
          { status: 401 }
        )
      }

      // Verify token
      const verifiedToken = await verifyDisputeToken(token)

      if (!verifiedToken) {
        return NextResponse.json(
          { error: 'Invalid or expired access token' },
          { status: 401 }
        )
      }

      // Verify token matches the dispute ID
      if (verifiedToken.disputeId !== disputeId) {
        return NextResponse.json(
          { error: 'Token does not match dispute' },
          { status: 403 }
        )
      }

      // Get tenant name from dispute
      const { data: dispute } = await supabase
        .from('disputes')
        .select('tenant_name')
        .eq('id', disputeId)
        .is('deleted_at', null)
        .single()

      if (!dispute) {
        return NextResponse.json(
          { error: 'Dispute not found' },
          { status: 404 }
        )
      }

      authorName = dispute.tenant_name
    }

    // Parse and validate request body
    const body = await request.json()
    const validatedData = createDisputeMessageSchema.parse({
      ...body,
      author_type: isAdmin ? 'admin' : 'tenant',
      author_name: authorName,
    })

    // Create message
    const { data: message, error: insertError } = await supabase
      .from('dispute_messages')
      .insert({
        dispute_id: disputeId,
        author_type: validatedData.author_type,
        author_name: validatedData.author_name,
        author_user_id: authorUserId,
        message: validatedData.message,
        is_internal_note: validatedData.is_internal_note || false,
      })
      .select()
      .single()

    if (insertError || !message) {
      console.error('Error creating message:', insertError)
      return NextResponse.json(
        { error: 'Failed to create message' },
        { status: 500 }
      )
    }

    // TODO: Send email notification
    // if (isAdmin) {
    //   // Notify tenant
    //   await sendDisputeMessageEmail({ disputeId, messageType: 'admin_reply' })
    // } else {
    //   // Notify admin
    //   await sendDisputeMessageEmail({ disputeId, messageType: 'tenant_reply' })
    // }

    return NextResponse.json({
      message,
      success: true,
    }, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.issues },
        { status: 400 }
      )
    }

    console.error('Error in POST /api/disputes/[id]/messages:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

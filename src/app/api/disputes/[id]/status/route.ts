import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { createAdminClient } from '@/lib/supabase/server'
import { updateDisputeStatusSchema } from '@/lib/validations/disputes'
import { z } from 'zod'

/**
 * Dispute Status API - VistorIA Pro
 * PATCH: Update dispute status (admin only)
 */

interface RouteParams {
  params: Promise<{ id: string }>
}

// PATCH: Update dispute status
export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id: disputeId } = await params
    const supabase = createAdminClient()

    // Get user from database
    const { data: user } = await supabase
      .from('users')
      .select('id, full_name, first_name, last_name')
      .eq('clerk_id', userId)
      .single()

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Verify dispute exists and belongs to user
    const { data: existingDispute } = await supabase
      .from('disputes')
      .select('id, user_id, status, protocol')
      .eq('id', disputeId)
      .eq('user_id', user.id)
      .is('deleted_at', null)
      .single()

    if (!existingDispute) {
      return NextResponse.json(
        { error: 'Dispute not found or access denied' },
        { status: 404 }
      )
    }

    // Parse and validate request body
    const body = await request.json()
    const validatedData = updateDisputeStatusSchema.parse(body)

    // Prepare update data
    const updateData: {
      status: string
      resolution_notes?: string | null
      resolved_by?: string
      resolved_at?: string
      updated_at: string
    } = {
      status: validatedData.status,
      updated_at: new Date().toISOString(),
    }

    // Add resolution data if status is resolved/accepted/rejected
    if (
      validatedData.status === 'resolved' ||
      validatedData.status === 'accepted' ||
      validatedData.status === 'rejected'
    ) {
      updateData.resolved_by = user.id
      updateData.resolved_at = new Date().toISOString()
      updateData.resolution_notes = validatedData.resolution_notes || null
    }

    // Update dispute
    const { data: dispute, error: updateError } = await supabase
      .from('disputes')
      .update(updateData)
      .eq('id', disputeId)
      .select()
      .single()

    if (updateError || !dispute) {
      console.error('Error updating dispute status:', updateError)
      return NextResponse.json(
        { error: 'Failed to update dispute status' },
        { status: 500 }
      )
    }

    // Add resolution notes as admin message if provided
    if (validatedData.resolution_notes) {
      const authorName = user.full_name || `${user.first_name} ${user.last_name}`.trim()

      await supabase
        .from('dispute_messages')
        .insert({
          dispute_id: disputeId,
          author_type: 'admin',
          author_name: authorName,
          author_user_id: user.id,
          message: `Resolução: ${validatedData.resolution_notes}`,
          is_internal_note: false,
        })
    }

    // TODO: Send email notification to tenant
    // await sendDisputeStatusUpdatedEmail({
    //   disputeId: dispute.id,
    //   protocol: dispute.protocol,
    //   newStatus: dispute.status,
    //   tenantEmail: dispute.tenant_email,
    // })

    return NextResponse.json({
      dispute,
      message: 'Dispute status updated successfully',
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.issues },
        { status: 400 }
      )
    }

    console.error('Error in PATCH /api/disputes/[id]/status:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

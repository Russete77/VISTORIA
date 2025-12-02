import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'
import { verifyDisputeToken } from '@/lib/utils/jwt'

/**
 * Single Dispute API - VistorIA Pro
 * GET: Get dispute details (public access with token)
 */

interface RouteParams {
  params: Promise<{ id: string }>
}

// GET: Get dispute details with public token access
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { id: disputeId } = await params
    const supabase = createAdminClient()

    // Get token from query params or Authorization header
    const token =
      request.nextUrl.searchParams.get('token') ||
      request.headers.get('Authorization')?.replace('Bearer ', '')

    if (!token) {
      return NextResponse.json(
        { error: 'Access token required' },
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

    // Get dispute with all related data
    const { data: dispute, error } = await supabase
      .from('disputes')
      .select(`
        *,
        inspection:inspections(
          id,
          type,
          status,
          scheduled_date,
          completed_at,
          property:properties(
            id,
            name,
            address,
            city,
            state,
            type
          )
        ),
        messages:dispute_messages(
          id,
          author_type,
          author_name,
          message,
          is_internal_note,
          created_at
        ),
        attachments:dispute_attachments(
          id,
          storage_path,
          file_name,
          file_size,
          mime_type,
          uploaded_by,
          description,
          created_at
        )
      `)
      .eq('id', disputeId)
      .is('deleted_at', null)
      .single()

    if (error || !dispute) {
      return NextResponse.json(
        { error: 'Dispute not found' },
        { status: 404 }
      )
    }

    // Filter out internal notes from messages (tenant shouldn't see them)
    const publicMessages = dispute.messages?.filter(
      (msg: { is_internal_note: boolean }) => !msg.is_internal_note
    )

    // Generate public URLs for attachments
    const attachmentsWithUrls = await Promise.all(
      (dispute.attachments || []).map(async (attachment: { storage_path: string }) => {
        const { data: urlData } = supabase.storage
          .from('dispute-attachments')
          .getPublicUrl(attachment.storage_path)

        return {
          ...attachment,
          url: urlData.publicUrl,
        }
      })
    )

    // Remove sensitive data
    const publicDispute = {
      ...dispute,
      access_token: undefined, // Don't expose token
      messages: publicMessages,
      attachments: attachmentsWithUrls,
    }

    return NextResponse.json({ dispute: publicDispute })
  } catch (error) {
    console.error('Error in GET /api/disputes/[id]:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'
import { verifyLandlordToken } from '@/lib/utils/jwt'

/**
 * Landlord Dispute Detail API - VistorIA Pro
 * GET: Retrieve specific dispute details for landlord (read-only)
 */

interface RouteParams {
  params: Promise<{ token: string; disputeId: string }>
}

// GET: Retrieve specific dispute details
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { token, disputeId } = await params
    const supabase = createAdminClient()

    // Verify landlord token
    const verifiedToken = await verifyLandlordToken(token)
    if (!verifiedToken) {
      return NextResponse.json(
        { error: 'Token inválido ou expirado' },
        { status: 401 }
      )
    }

    const { landlordEmail } = verifiedToken

    // Verify landlord has access to this dispute
    const { data: hasAccess, error: accessError } = await supabase.rpc(
      'verify_landlord_access',
      {
        p_dispute_id: disputeId,
        p_landlord_email: landlordEmail,
      }
    )

    if (accessError || !hasAccess) {
      return NextResponse.json(
        { error: 'Acesso negado a esta contestação' },
        { status: 403 }
      )
    }

    // Get dispute details
    const { data: dispute, error } = await supabase
      .from('disputes')
      .select(`
        *,
        inspection:inspections!inner(
          id,
          type,
          status,
          scheduled_date,
          inspector_name,
          tenant_name,
          landlord_name,
          property:properties!inner(
            id,
            name,
            address,
            city,
            state,
            type,
            bedrooms,
            bathrooms
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
          file_name,
          file_size,
          mime_type,
          uploaded_by,
          description,
          storage_path,
          created_at
        )
      `)
      .eq('id', disputeId)
      .is('deleted_at', null)
      .single()

    if (error || !dispute) {
      console.error('Error fetching dispute:', error)
      return NextResponse.json(
        { error: 'Contestação não encontrada' },
        { status: 404 }
      )
    }

    // Filter out internal notes
    const sanitizedDispute = {
      ...dispute,
      messages: dispute.messages?.filter(
        (msg: { is_internal_note: boolean }) => !msg.is_internal_note
      ),
      // Remove sensitive fields
      access_token: undefined,
      landlord_access_token: undefined,
      user_id: undefined,
      resolved_by: undefined,
    }

    return NextResponse.json({ dispute: sanitizedDispute })
  } catch (error) {
    console.error('Error in GET /api/disputes/landlord/[token]/[disputeId]:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

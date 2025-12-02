import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'
import { verifyLandlordToken } from '@/lib/utils/jwt'

/**
 * Landlord Disputes API - VistorIA Pro
 * GET: Retrieve all disputes for a landlord (read-only access)
 */

interface RouteParams {
  params: Promise<{ token: string }>
}

// GET: Retrieve all disputes for landlord
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { token } = await params
    const supabase = createAdminClient()

    // Verify landlord token
    const verifiedToken = await verifyLandlordToken(token)
    if (!verifiedToken) {
      return NextResponse.json(
        { error: 'Token inválido ou expirado' },
        { status: 401 }
      )
    }

    const { landlordEmail, userId } = verifiedToken

    // Get all disputes for this landlord's properties
    const { data: disputes, error } = await supabase
      .rpc('get_landlord_disputes', {
        p_landlord_email: landlordEmail,
      })

    if (error) {
      console.error('Error fetching landlord disputes:', error)
      return NextResponse.json(
        { error: 'Erro ao buscar contestações' },
        { status: 500 }
      )
    }

    // Get full details for each dispute
    const disputeIds = disputes.map((d: { dispute_id: string }) => d.dispute_id)

    const { data: detailedDisputes, error: detailsError } = await supabase
      .from('disputes')
      .select(`
        *,
        inspection:inspections!inner(
          id,
          type,
          status,
          scheduled_date,
          property:properties!inner(
            id,
            name,
            address,
            city,
            state
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
          created_at
        )
      `)
      .in('id', disputeIds)
      .is('deleted_at', null)
      .order('created_at', { ascending: false })

    if (detailsError) {
      console.error('Error fetching dispute details:', detailsError)
      return NextResponse.json(
        { error: 'Erro ao buscar detalhes das contestações' },
        { status: 500 }
      )
    }

    // Filter out internal notes from messages
    const sanitizedDisputes = detailedDisputes?.map((dispute) => ({
      ...dispute,
      messages: dispute.messages?.filter(
        (msg: { is_internal_note: boolean }) => !msg.is_internal_note
      ),
      // Remove sensitive fields
      access_token: undefined,
      landlord_access_token: undefined,
      user_id: undefined,
      resolved_by: undefined,
    }))

    return NextResponse.json({
      disputes: sanitizedDisputes || [],
      landlordEmail,
      totalDisputes: sanitizedDisputes?.length || 0,
    })
  } catch (error) {
    console.error('Error in GET /api/disputes/landlord/[token]:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

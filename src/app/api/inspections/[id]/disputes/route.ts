import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { createAdminClient } from '@/lib/supabase/server'
import { createDisputeSchema } from '@/lib/validations/disputes'
import { generateDisputeToken, generateLandlordToken } from '@/lib/utils/jwt'
import { z } from 'zod'

/**
 * Disputes API - VistorIA Pro
 * POST: Create new dispute for inspection
 * GET: List all disputes for specific inspection
 */

interface RouteParams {
  params: Promise<{ id: string }>
}

// POST: Create new dispute
export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id: inspectionId } = await params
    const supabase = createAdminClient()

    // Get user from database
    const { data: user } = await supabase
      .from('users')
      .select('id')
      .eq('clerk_id', userId)
      .single()

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Check if disputes are enabled for this user
    const { data: userSettings } = await supabase
      .from('user_settings')
      .select('disputes_enabled')
      .eq('user_id', user.id)
      .single()

    if (userSettings && !userSettings.disputes_enabled) {
      return NextResponse.json(
        { error: 'Contestações desabilitadas pela imobiliária' },
        { status: 403 }
      )
    }

    // Verify inspection exists and belongs to user
    const { data: inspection } = await supabase
      .from('inspections')
      .select('id, type, status, landlord_email')
      .eq('id', inspectionId)
      .eq('user_id', user.id)
      .is('deleted_at', null)
      .single()

    if (!inspection) {
      return NextResponse.json(
        { error: 'Inspection not found' },
        { status: 404 }
      )
    }

    // Parse and validate request body
    const body = await request.json()
    const validatedData = createDisputeSchema.parse(body)

    // Generate unique protocol using database function
    const { data: protocolData, error: protocolError } = await supabase
      .rpc('generate_dispute_protocol')

    if (protocolError || !protocolData) {
      console.error('Error generating protocol:', protocolError)
      return NextResponse.json(
        { error: 'Failed to generate dispute protocol' },
        { status: 500 }
      )
    }

    const protocol = protocolData as string

    // Generate access token for tenant (public access)
    const accessToken = await generateDisputeToken({
      disputeId: '', // Will be filled after insert
      protocol,
      tenantEmail: validatedData.tenant_email,
      inspectionId,
    })

    // Generate landlord access token (if landlord email exists)
    let landlordAccessToken: string | null = null
    if (inspection.landlord_email) {
      landlordAccessToken = await generateLandlordToken({
        landlordEmail: inspection.landlord_email,
        userId: user.id,
      })
    }

    // Create dispute
    const { data: dispute, error: insertError } = await supabase
      .from('disputes')
      .insert({
        inspection_id: inspectionId,
        user_id: user.id,
        protocol,
        tenant_name: validatedData.tenant_name,
        tenant_email: validatedData.tenant_email,
        tenant_phone: validatedData.tenant_phone || null,
        item_description: validatedData.item_description,
        item_location: validatedData.item_location || null,
        category: validatedData.category,
        severity: validatedData.severity,
        description: validatedData.description,
        tenant_notes: validatedData.tenant_notes || null,
        status: 'pending',
        access_token: accessToken,
        landlord_access_token: landlordAccessToken,
      })
      .select()
      .single()

    if (insertError || !dispute) {
      console.error('Error creating dispute:', insertError)
      return NextResponse.json(
        { error: 'Failed to create dispute' },
        { status: 500 }
      )
    }

    // Re-generate token with correct dispute ID
    const finalAccessToken = await generateDisputeToken({
      disputeId: dispute.id,
      protocol: dispute.protocol,
      tenantEmail: dispute.tenant_email,
      inspectionId,
    })

    // Update dispute with correct tenant token
    await supabase
      .from('disputes')
      .update({ access_token: finalAccessToken })
      .eq('id', dispute.id)

    // Add initial system message
    await supabase
      .from('dispute_messages')
      .insert({
        dispute_id: dispute.id,
        author_type: 'system',
        message: `Contestação criada. Protocolo: ${protocol}`,
        is_internal_note: false,
      })

    // TODO: Send email notification to tenant with access link
    // await sendDisputeCreatedEmail({
    //   tenantEmail: dispute.tenant_email,
    //   tenantName: dispute.tenant_name,
    //   protocol: dispute.protocol,
    //   accessToken: finalAccessToken,
    // })

    // TODO: Send email notification to landlord (if email exists)
    // if (inspection.landlord_email && landlordAccessToken) {
    //   await sendLandlordDisputeNotification({
    //     landlordEmail: inspection.landlord_email,
    //     protocol: dispute.protocol,
    //     itemDescription: dispute.item_description,
    //     landlordAccessToken,
    //   })
    // }

    return NextResponse.json({
      dispute: {
        ...dispute,
        access_token: finalAccessToken,
        landlord_access_token: landlordAccessToken,
      },
      message: 'Dispute created successfully',
    }, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.issues },
        { status: 400 }
      )
    }

    console.error('Error in POST /api/inspections/[id]/disputes:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// GET: List all disputes for inspection
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id: inspectionId } = await params
    const supabase = createAdminClient()

    // Get user from database
    const { data: user } = await supabase
      .from('users')
      .select('id')
      .eq('clerk_id', userId)
      .single()

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Verify inspection exists and belongs to user
    const { data: inspection } = await supabase
      .from('inspections')
      .select('id')
      .eq('id', inspectionId)
      .eq('user_id', user.id)
      .is('deleted_at', null)
      .single()

    if (!inspection) {
      return NextResponse.json(
        { error: 'Inspection not found' },
        { status: 404 }
      )
    }

    // Get all disputes for this inspection
    const { data: disputes, error } = await supabase
      .from('disputes')
      .select(`
        *,
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
      .eq('inspection_id', inspectionId)
      .is('deleted_at', null)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching disputes:', error)
      return NextResponse.json(
        { error: 'Failed to fetch disputes' },
        { status: 500 }
      )
    }

    return NextResponse.json({ disputes })
  } catch (error) {
    console.error('Error in GET /api/inspections/[id]/disputes:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

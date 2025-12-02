import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { createAdminClient } from '@/lib/supabase/server'
import { sendEmail, isValidEmail, getAppUrl } from '@/lib/email/client'
import ComparisonReportEmail from '@/emails/comparison-report'

/**
 * Send Email API for Comparisons - VistorIA Pro
 * POST: Send comparison report via email
 */

interface RouteParams {
  params: Promise<{ id: string }>
}

interface SendEmailRequest {
  recipients: string[]
  includePropertyOwner?: boolean
  includeTenant?: boolean
}

export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id: comparisonId } = await params
    const body = await request.json() as SendEmailRequest
    const { recipients = [], includePropertyOwner, includeTenant } = body

    const supabase = createAdminClient()

    // Get user from database
    const { data: user } = await supabase
      .from('users')
      .select('id, email, full_name')
      .eq('clerk_id', userId)
      .single()

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Get comparison with all details
    const { data: comparison, error: comparisonError } = await supabase
      .from('comparisons')
      .select(`
        *,
        property:properties(*),
        move_in_inspection:inspections!comparisons_move_in_inspection_id_fkey(*),
        move_out_inspection:inspections!comparisons_move_out_inspection_id_fkey(*)
      `)
      .eq('id', comparisonId)
      .eq('user_id', user.id)
      .single()

    if (comparisonError || !comparison) {
      return NextResponse.json(
        { error: 'Comparison not found' },
        { status: 404 }
      )
    }

    if (comparison.status !== 'completed') {
      return NextResponse.json(
        { error: 'Comparison is not completed yet' },
        { status: 400 }
      )
    }

    // Build recipient list
    const allRecipients = new Set<string>()

    // Add manual recipients
    recipients.forEach((email) => {
      if (isValidEmail(email)) {
        allRecipients.add(email.toLowerCase().trim())
      }
    })

    // Add property owner if requested
    if (includePropertyOwner && comparison.move_out_inspection.landlord_email) {
      const email = comparison.move_out_inspection.landlord_email
      if (isValidEmail(email)) {
        allRecipients.add(email.toLowerCase().trim())
      }
    }

    // Add tenant if requested
    if (includeTenant && comparison.move_out_inspection.tenant_email) {
      const email = comparison.move_out_inspection.tenant_email
      if (isValidEmail(email)) {
        allRecipients.add(email.toLowerCase().trim())
      }
    }

    if (allRecipients.size === 0) {
      return NextResponse.json(
        { error: 'No valid recipients provided' },
        { status: 400 }
      )
    }

    // Format data for email
    const formatCurrency = (value: number | null) => {
      if (value === null || value === 0) return 'R$ 0,00'
      return new Intl.NumberFormat('pt-BR', {
        style: 'currency',
        currency: 'BRL',
      }).format(value)
    }

    const formatDate = (dateStr: string) => {
      return new Date(dateStr).toLocaleDateString('pt-BR')
    }

    const reportUrl = getAppUrl(`/dashboard/comparisons/${comparisonId}`)

    // Send emails
    const emailPromises = Array.from(allRecipients).map((email) =>
      sendEmail({
        to: email,
        subject: `Relatório de Comparação - ${comparison.property.name}`,
        react: ComparisonReportEmail({
          propertyName: comparison.property.name,
          propertyAddress: comparison.property.address,
          moveInDate: formatDate(comparison.move_in_inspection.created_at),
          moveOutDate: formatDate(comparison.move_out_inspection.created_at),
          totalDifferences: comparison.differences_detected,
          newDamages: comparison.new_damages,
          estimatedCost: formatCurrency(comparison.estimated_repair_cost),
          reportUrl,
          recipientName: email.split('@')[0],
        }),
      })
    )

    const results = await Promise.allSettled(emailPromises)

    // Count successes and failures
    const sent: string[] = []
    const failed: string[] = []

    results.forEach((result, index) => {
      const email = Array.from(allRecipients)[index]
      if (result.status === 'fulfilled' && result.value.success) {
        sent.push(email)
      } else {
        failed.push(email)
      }
    })

    console.log('[Send Email] Results:', { sent, failed })

    if (sent.length === 0) {
      return NextResponse.json(
        { error: 'Failed to send emails', failed },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      sent,
      failed: failed.length > 0 ? failed : undefined,
      message: `Email enviado para ${sent.length} destinatário(s)`,
    })
  } catch (error) {
    console.error('Error in POST /api/comparisons/[id]/send-email:', error)
    return NextResponse.json(
      {
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

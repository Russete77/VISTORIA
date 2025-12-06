import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { createAdminClient } from '@/lib/supabase/server'
import { generateSatelitPDF } from '@/services/pdf-generator-satelit'
import { generatePDFWithTemplate } from '@/services/pdf-generator-with-template'
import { canUseCredits, shouldSkipCreditDeduction } from '@/lib/auth/dev-access'
import { sendEmail, validateEmails, formatDisplayName } from '@/lib/email/client'
import LaudoProntoEmail from '@/lib/email/templates/laudo-pronto'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { PDFTemplateConfig, DEFAULT_TEMPLATE_CONFIG } from '@/types/pdf-template'
import { quickRateLimit } from '@/lib/api-utils'
import { generateCompleteTechnicalReport, PhotoWithAnalysis } from '@/services/technical-analysis'

/**
 * POST /api/inspections/[id]/generate-report
 * Generate PDF report for an inspection
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authResult = await auth()
    if (!authResult.userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Rate limiting (report generation is expensive)
    const rateLimited = await quickRateLimit(request, 'report')
    if (rateLimited) return rateLimited

    const { id } = await params
    const supabase = createAdminClient()

    // Get user
    const { data: user } = await supabase
      .from('users')
      .select('id, credits, email')
      .eq('clerk_id', authResult.userId)
      .single()

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Check credits (PDF generation costs 1 credit) - developers bypass this
    if (!canUseCredits(user.credits, user.email)) {
      return NextResponse.json(
        { error: 'Insufficient credits' },
        { status: 402 }
      )
    }

    // Get inspection details
    const { data: inspection, error: inspectionError } = await supabase
      .from('inspections')
      .select(`
        *,
        property:properties(*)
      `)
      .eq('id', id)
      .eq('user_id', user.id)
      .is('deleted_at', null)
      .single()

    if (inspectionError || !inspection) {
      return NextResponse.json({ error: 'Inspection not found' }, { status: 404 })
    }

    // Get all photos with problems for this inspection
    const { data: photos } = await supabase
      .from('inspection_photos')
      .select(`
        *,
        problems:photo_problems(*)
      `)
      .eq('inspection_id', id)
      .order('created_at', { ascending: true })

    // Add public URLs to photos
    const photosWithUrls = photos?.map((photo: any) => {
      const { data: urlData } = supabase.storage
        .from('inspection-photos')
        .getPublicUrl(photo.storage_path)

      return {
        ...photo,
        photo_url: urlData.publicUrl,
      }
    }) || []

    // Group photos by room
    const roomsMap = new Map()
    photosWithUrls.forEach((photo: any) => {
      const roomKey = photo.room_name
      if (!roomsMap.has(roomKey)) {
        roomsMap.set(roomKey, {
          id: `room-${roomKey.toLowerCase().replace(/\s+/g, '-')}`,
          name: photo.room_name,
          type: photo.room_category || 'other',
          photos: [],
        })
      }
      roomsMap.get(roomKey).photos.push(photo)
    })

    const rooms = Array.from(roomsMap.values())

    console.log(`[PDF Generation] Inspection ${id} - Status: ${inspection.status}, Rooms: ${rooms.length}, Photos: ${photos?.length || 0}`)

    // Get video transcription (if exists)
    const videoPhoto = photosWithUrls.find(
      (p: any) => p.from_video && p.video_transcription
    )
    const transcription = videoPhoto?.video_transcription || null

    // Get previous inspection for comparison (if move_out)
    let previousReport = null
    if (inspection.type === 'move_out') {
      console.log('[Technical Analysis] Move-out inspection detected, fetching previous move-in...')

      const { data: prevInspection } = await supabase
        .from('inspections')
        .select('id')
        .eq('property_id', inspection.property_id)
        .eq('type', 'move_in')
        .is('deleted_at', null)
        .order('created_at', { ascending: false })
        .limit(1)
        .single()

      if (prevInspection) {
        console.log(`[Technical Analysis] Found previous move-in inspection: ${prevInspection.id}`)

        const { data: prevReport } = await supabase
          .from('technical_reports')
          .select('report_data')
          .eq('inspection_id', prevInspection.id)
          .order('created_at', { ascending: false })
          .limit(1)
          .single()

        if (prevReport?.report_data) {
          previousReport = prevReport.report_data
          console.log('[Technical Analysis] Previous report found for comparison')
        } else {
          console.log('[Technical Analysis] No previous technical report found')
        }
      } else {
        console.log('[Technical Analysis] No previous move-in inspection found')
      }
    }

    // Generate complete technical analysis with 8 instructions
    console.log('[Technical Analysis] Starting complete technical analysis...')
    const startTime = Date.now()

    const photosForAnalysis: PhotoWithAnalysis[] = photosWithUrls.map((photo: any) => ({
      url: photo.photo_url,
      room_name: photo.room_name,
      room_category: photo.room_category || 'other',
      ai_summary: photo.ai_summary,
      problems: photo.problems?.map((p: any) => ({
        description: p.description,
        severity: p.severity,
        location: p.location || '',
        suggested_action: p.suggested_action || '',
      })) || [],
      from_video: photo.from_video || false,
      frame_number: photo.frame_number || undefined,
    }))

    const technicalReport = await generateCompleteTechnicalReport({
      photos: photosForAnalysis,
      transcription,
      previousReport,
    })

    const processingTimeSeconds = ((Date.now() - startTime) / 1000).toFixed(2)
    console.log(`[Technical Analysis] Analysis completed in ${processingTimeSeconds}s`)

    // Save technical report to database
    const { error: reportSaveError } = await supabase
      .from('technical_reports')
      .insert({
        inspection_id: id,
        user_id: user.id,
        report_data: technicalReport,
        model_version: 'claude-sonnet-4-20250514',
        processing_time_seconds: parseFloat(processingTimeSeconds),
      })

    if (reportSaveError) {
      console.error('[Technical Analysis] Error saving report:', reportSaveError)
      // Don't fail - continue with PDF generation
    } else {
      console.log('[Technical Analysis] Report saved to database')
    }

    // Parse request body for template_id (optional)
    let templateConfig: PDFTemplateConfig = DEFAULT_TEMPLATE_CONFIG
    try {
      const body = await request.json().catch(() => ({}))
      const templateId = body.template_id

      if (templateId) {
        // Fetch template from database
        const { data: template } = await supabase
          .from('pdf_templates')
          .select('config')
          .eq('id', templateId)
          .or(`user_id.eq.${user.id},is_system.eq.true`)
          .single()

        if (template?.config) {
          templateConfig = template.config as PDFTemplateConfig
          console.log(`[PDF Generation] Using template: ${templateId}`)
        }
      } else {
        // Check for user's default template preference
        const { data: preferences } = await supabase
          .from('user_template_preferences')
          .select('default_inspection_template_id')
          .eq('user_id', user.id)
          .single()

        if (preferences?.default_inspection_template_id) {
          const { data: defaultTemplate } = await supabase
            .from('pdf_templates')
            .select('config')
            .eq('id', preferences.default_inspection_template_id)
            .single()

          if (defaultTemplate?.config) {
            templateConfig = defaultTemplate.config as PDFTemplateConfig
            console.log(`[PDF Generation] Using default template: ${preferences.default_inspection_template_id}`)
          }
        }
      }
    } catch (parseError) {
      // No body or invalid JSON - use default template
      console.log('[PDF Generation] Using default template (no template_id provided)')
    }

    // Inspection must be completed OR have photos to auto-complete
    if (inspection.status !== 'completed' && inspection.status !== 'signed') {
      // Auto-complete if inspection has photos (more permissive logic)
      if (photos && photos.length > 0) {
        console.log(`[PDF Generation] Auto-completing inspection ${id} (had ${photos.length} photos)`)

        await supabase
          .from('inspections')
          .update({
            status: 'completed',
            completed_at: new Date().toISOString(),
          })
          .eq('id', id)

        inspection.status = 'completed'
        inspection.completed_at = new Date().toISOString()
      } else {
        console.error(`[PDF Generation] Cannot generate report - no photos found for inspection ${id}`)
        return NextResponse.json(
          { error: 'Adicione pelo menos uma foto antes de gerar o laudo' },
          { status: 400 }
        )
      }
    }

    // Generate PDF using template-aware generator
    const pdfBuffer = await generatePDFWithTemplate({
      inspection,
      rooms,
      technicalReport,
      templateConfig,
    })

    // Upload PDF to storage
    const fileName = `laudo-${id}-${Date.now()}.pdf`
    const filePath = `reports/${fileName}`

    const { error: uploadError } = await supabase.storage
      .from('inspections')
      .upload(filePath, pdfBuffer, {
        contentType: 'application/pdf',
        upsert: true,
      })

    if (uploadError) {
      console.error('PDF upload error:', uploadError)
      return NextResponse.json({ error: 'Failed to upload PDF' }, { status: 500 })
    }

    // Get public URL
    const { data: urlData } = supabase.storage
      .from('inspections')
      .getPublicUrl(filePath)

    // Update inspection with report URL
    const { error: updateError } = await supabase
      .from('inspections')
      .update({ report_url: urlData.publicUrl })
      .eq('id', id)

    if (updateError) {
      console.error('Inspection update error:', updateError)
      return NextResponse.json({ error: 'Failed to update inspection' }, { status: 500 })
    }

    // Deduct credit (skip for developers)
    let creditsRemaining = user.credits
    if (!shouldSkipCreditDeduction(user.email)) {
      await supabase
        .from('users')
        .update({ credits: user.credits - 1 })
        .eq('id', user.id)

      // Log credit transaction
      await supabase.from('credit_transactions').insert({
        user_id: user.id,
        type: 'debit',
        amount: 1,
        description: `Geração de laudo PDF - Vistoria #${id.slice(0, 8)}`,
        inspection_id: id,
      })

      creditsRemaining = user.credits - 1
    }

    // Enviar email de notificação (não bloqueia se falhar)
    try {
      // Buscar email do usuário completo com nome
      const { data: fullUser } = await supabase
        .from('users')
        .select('email, first_name, last_name, full_name')
        .eq('id', user.id)
        .single()

      if (fullUser && fullUser.email && validateEmails(fullUser.email)) {
        console.log(`[Email] Enviando notificação de laudo pronto para ${fullUser.email}`)

        // Calcular estatísticas de problemas
        const problemStats = {
          total: inspection.total_problems || 0,
          urgent: inspection.urgent_problems || 0,
          high: inspection.high_problems || 0,
          medium: inspection.medium_problems || 0,
          low: inspection.low_problems || 0,
        }

        // Formatar data da vistoria
        const inspectionDateFormatted = inspection.scheduled_date
          ? format(new Date(inspection.scheduled_date), "dd 'de' MMMM 'de' yyyy", {
              locale: ptBR,
            })
          : format(new Date(), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })

        // Enviar email
        const emailResult = await sendEmail({
          to: fullUser.email,
          subject: `Seu laudo está pronto! 📄 - ${inspection.property.name}`,
          react: LaudoProntoEmail({
            recipientName: formatDisplayName(
              fullUser.full_name || fullUser.first_name || null
            ),
            propertyName: inspection.property.name,
            propertyAddress: inspection.property.address,
            inspectorName: inspection.inspector_name || user.email,
            inspectionDate: inspectionDateFormatted,
            inspectionType: inspection.type,
            totalProblems: problemStats.total,
            urgentProblems: problemStats.urgent,
            highProblems: problemStats.high,
            mediumProblems: problemStats.medium,
            lowProblems: problemStats.low,
            reportUrl: urlData.publicUrl,
            inspectionId: id,
          }),
          tags: [
            { name: 'tipo', value: 'laudo_pronto' },
            { name: 'inspection_id', value: id },
          ],
        })

        if (emailResult.success) {
          console.log(
            `[Email] Notificação enviada com sucesso (ID: ${emailResult.emailId})`
          )
        } else {
          console.error(
            `[Email] Falha ao enviar notificação: ${emailResult.error}`
          )
        }
      } else {
        console.warn(
          `[Email] Email do usuário não encontrado ou inválido: ${fullUser?.email}`
        )
      }
    } catch (emailError) {
      // Log do erro mas NÃO bloqueia a geração do laudo
      console.error('[Email] Erro ao enviar notificação:', emailError)
      // Laudo foi gerado com sucesso, email é apenas uma notificação opcional
    }

    return NextResponse.json({
      success: true,
      report_url: urlData.publicUrl,
      credits_remaining: creditsRemaining,
    })
  } catch (error) {
    console.error('Report generation error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

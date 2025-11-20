import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { createAdminClient } from '@/lib/supabase/server'
import { generateSatelitPDF } from '@/services/pdf-generator-satelit'
import { canUseCredits, shouldSkipCreditDeduction } from '@/lib/auth/dev-access'

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

    // Generate PDF using Satélit format
    const pdfBuffer = await generateSatelitPDF({
      inspection,
      rooms,
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

import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { createAdminClient } from '@/lib/supabase/server'
import { z } from 'zod'

/**
 * Inspection Detail API - VistorIA Pro
 * GET: Get single inspection
 * PATCH: Update inspection
 * DELETE: Delete inspection (soft delete)
 */

const inspectionUpdateSchema = z.object({
  inspector_name: z.string().min(2).optional(),
  inspector_email: z.string().email().optional().nullable(),
  tenant_name: z.string().optional().nullable(),
  tenant_email: z.string().email().optional().nullable(),
  landlord_name: z.string().optional().nullable(),
  landlord_email: z.string().email().optional().nullable(),
  scheduled_date: z.string().datetime().optional().nullable(),
  notes: z.string().optional().nullable(),
  status: z.enum(['draft', 'in_progress', 'completed', 'signed']).optional(),
})

interface RouteParams {
  params: Promise<{ id: string }>
}

// GET: Get single inspection
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params
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

    // Get inspection with property and photos
    const { data: inspection, error } = await supabase
      .from('inspections')
      .select(`
        *,
        property:properties(
          id,
          name,
          address,
          city,
          state,
          zip_code,
          type
        ),
        photos:inspection_photos(
          id,
          room_name,
          room_category,
          storage_path,
          thumbnail_path,
          ai_analyzed,
          ai_has_problems,
          ai_summary,
          created_at,
          problems:photo_problems(
            id,
            description,
            severity,
            location,
            suggested_action
          )
        )
      `)
      .eq('id', id)
      .eq('user_id', user.id)
      .is('deleted_at', null)
      .single()

    if (error || !inspection) {
      return NextResponse.json(
        { error: 'Inspection not found' },
        { status: 404 }
      )
    }

    // Generate public URLs for all photos
    if (inspection.photos && inspection.photos.length > 0) {
      inspection.photos = inspection.photos.map((photo: any) => {
        const { data: urlData } = supabase.storage
          .from('inspection-photos')
          .getPublicUrl(photo.storage_path)

        return {
          ...photo,
          photo_url: urlData.publicUrl,
        }
      })
    }

    // Calculate problem statistics from photos
    let totalProblems = 0
    let urgentProblems = 0
    let highProblems = 0
    let mediumProblems = 0
    let lowProblems = 0

    if (inspection.photos && inspection.photos.length > 0) {
      inspection.photos.forEach((photo: any) => {
        if (photo.problems && photo.problems.length > 0) {
          photo.problems.forEach((problem: any) => {
            totalProblems++
            switch (problem.severity) {
              case 'urgent':
                urgentProblems++
                break
              case 'high':
                highProblems++
                break
              case 'medium':
                mediumProblems++
                break
              case 'low':
                lowProblems++
                break
            }
          })
        }
      })
    }

    // Add calculated stats to inspection
    inspection.total_problems = totalProblems
    inspection.urgent_problems = urgentProblems
    inspection.high_problems = highProblems
    inspection.medium_problems = mediumProblems
    inspection.low_problems = lowProblems

    return NextResponse.json({ inspection })
  } catch (error) {
    console.error('Error in GET /api/inspections/[id]:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// PATCH: Update inspection
export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params
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

    // Verify ownership
    const { data: existingInspection } = await supabase
      .from('inspections')
      .select('id, status')
      .eq('id', id)
      .eq('user_id', user.id)
      .is('deleted_at', null)
      .single()

    if (!existingInspection) {
      return NextResponse.json(
        { error: 'Inspection not found' },
        { status: 404 }
      )
    }

    // Parse and validate request body
    const body = await request.json()
    const validatedData = inspectionUpdateSchema.parse(body)

    // Update inspection
    const { data: inspection, error } = await supabase
      .from('inspections')
      .update({
        ...validatedData,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select('*, property_id, type')
      .single()

    if (error) {
      console.error('Error updating inspection:', error)
      return NextResponse.json(
        { error: 'Failed to update inspection' },
        { status: 500 }
      )
    }

    // AUTO-COMPARISON: Automatically create comparison when checkout inspection is completed
    if (
      validatedData.status === 'completed' &&
      inspection.type === 'move_out' &&
      existingInspection.status !== 'completed'
    ) {
      console.log(`[Auto-Comparison] Move-out inspection ${id} completed, checking for move-in...`)

      // Find matching move-in inspection for the same property
      const { data: moveInInspection } = await supabase
        .from('inspections')
        .select('id, status')
        .eq('property_id', inspection.property_id)
        .eq('type', 'move_in')
        .eq('status', 'completed')
        .is('deleted_at', null)
        .order('created_at', { ascending: false })
        .limit(1)
        .single()

      if (moveInInspection) {
        console.log(`[Auto-Comparison] Found move-in inspection ${moveInInspection.id}`)

        // Check if comparison already exists
        const { data: existingComparison } = await supabase
          .from('comparisons')
          .select('id')
          .eq('move_in_inspection_id', moveInInspection.id)
          .eq('move_out_inspection_id', id)
          .maybeSingle()

        if (!existingComparison) {
          // Check user credits
          const { data: userWithCredits } = await supabase
            .from('users')
            .select('credits')
            .eq('id', user.id)
            .single()

          if (userWithCredits && userWithCredits.credits >= 1) {
            console.log(`[Auto-Comparison] User has ${userWithCredits.credits} credits, creating comparison...`)

            // Check both inspections have photos
            const { count: moveInCount } = await supabase
              .from('inspection_photos')
              .select('*', { count: 'exact', head: true })
              .eq('inspection_id', moveInInspection.id)
              .is('deleted_at', null)

            const { count: moveOutCount } = await supabase
              .from('inspection_photos')
              .select('*', { count: 'exact', head: true })
              .eq('inspection_id', id)
              .is('deleted_at', null)

            if (moveInCount && moveInCount > 0 && moveOutCount && moveOutCount > 0) {
              // Create comparison automatically
              const { data: newComparison, error: comparisonError } = await supabase
                .from('comparisons')
                .insert({
                  user_id: user.id,
                  property_id: inspection.property_id,
                  move_in_inspection_id: moveInInspection.id,
                  move_out_inspection_id: id,
                  status: 'processing',
                })
                .select()
                .single()

              if (!comparisonError && newComparison) {
                console.log(`[Auto-Comparison] Created comparison ${newComparison.id}, starting background processing...`)

                // Process comparison in background (import from comparisons route)
                // Note: This will be handled by a separate background job or trigger
                // For now, we just create the comparison record
                // The user can manually trigger processing or we can add a cron job
              } else {
                console.error('[Auto-Comparison] Error creating comparison:', comparisonError)
              }
            } else {
              console.log(`[Auto-Comparison] Skipping: Not enough photos (move-in: ${moveInCount}, move-out: ${moveOutCount})`)
            }
          } else {
            console.log(`[Auto-Comparison] Skipping: Insufficient credits (${userWithCredits?.credits || 0})`)
          }
        } else {
          console.log(`[Auto-Comparison] Comparison already exists: ${existingComparison.id}`)
        }
      } else {
        console.log('[Auto-Comparison] No completed move-in inspection found for this property')
      }
    }

    return NextResponse.json({
      inspection,
      message: 'Inspection updated successfully',
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.issues },
        { status: 400 }
      )
    }

    console.error('Error in PATCH /api/inspections/[id]:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// DELETE: Delete inspection (soft delete)
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params
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

    // Verify ownership
    const { data: existingInspection } = await supabase
      .from('inspections')
      .select('id')
      .eq('id', id)
      .eq('user_id', user.id)
      .is('deleted_at', null)
      .single()

    if (!existingInspection) {
      return NextResponse.json(
        { error: 'Inspection not found' },
        { status: 404 }
      )
    }

    // Soft delete
    const { error } = await supabase
      .from('inspections')
      .update({
        deleted_at: new Date().toISOString(),
      })
      .eq('id', id)

    if (error) {
      console.error('Error deleting inspection:', error)
      return NextResponse.json(
        { error: 'Failed to delete inspection' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      message: 'Inspection deleted successfully',
    })
  } catch (error) {
    console.error('Error in DELETE /api/inspections/[id]:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

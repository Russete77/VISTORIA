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
  tenant_name: z.string().optional().nullable(),
  landlord_name: z.string().optional().nullable(),
  scheduled_date: z.string().datetime().optional(),
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
      .select()
      .single()

    if (error) {
      console.error('Error updating inspection:', error)
      return NextResponse.json(
        { error: 'Failed to update inspection' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      inspection,
      message: 'Inspection updated successfully',
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.errors },
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

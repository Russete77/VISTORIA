/**
 * Problem Cost API - VistorIA Pro
 * PATCH: Update cost information for a problem
 */

import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { createAdminClient } from '@/lib/supabase/server'
import { z } from 'zod'

const updateCostSchema = z.object({
  service_id: z.string().uuid().optional().nullable(),
  quantity: z.number().positive().optional(),
  manual_cost: z.number().positive().optional().nullable(),
  cost_notes: z.string().max(500).optional().nullable(),
})

interface RouteParams {
  params: Promise<{ id: string }>
}

export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id: problemId } = await params
    const body = await request.json()
    const data = updateCostSchema.parse(body)

    const supabase = createAdminClient()

    // Get user
    const { data: user } = await supabase
      .from('users')
      .select('id')
      .eq('clerk_id', userId)
      .single()

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Get problem and verify ownership via inspection
    const { data: problem, error: problemError } = await supabase
      .from('photo_problems')
      .select(`
        *,
        photo:inspection_photos(
          inspection:inspections(user_id)
        )
      `)
      .eq('id', problemId)
      .single()

    if (problemError || !problem) {
      return NextResponse.json({ error: 'Problem not found' }, { status: 404 })
    }

    if (problem.photo?.inspection?.user_id !== user.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    // Update problem with cost info
    const updateData: Record<string, any> = {
      cost_edited_at: new Date().toISOString(),
    }

    if (data.service_id !== undefined) {
      updateData.service_id = data.service_id
    }
    if (data.quantity !== undefined) {
      updateData.quantity = data.quantity
    }
    if (data.manual_cost !== undefined) {
      updateData.manual_cost = data.manual_cost
    }
    if (data.cost_notes !== undefined) {
      updateData.cost_notes = data.cost_notes
    }

    const { data: updatedProblem, error: updateError } = await supabase
      .from('photo_problems')
      .update(updateData)
      .eq('id', problemId)
      .select(`
        *,
        service:repair_services(
          id,
          code,
          name,
          unit_label,
          base_price_min,
          base_price_max
        )
      `)
      .single()

    if (updateError) {
      console.error('Error updating problem cost:', updateError)
      return NextResponse.json({ error: 'Failed to update cost' }, { status: 500 })
    }

    return NextResponse.json({
      message: 'Custo atualizado com sucesso',
      problem: updatedProblem,
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request data', details: error.issues },
        { status: 400 }
      )
    }

    console.error('Error in PATCH /api/problems/[id]/cost:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

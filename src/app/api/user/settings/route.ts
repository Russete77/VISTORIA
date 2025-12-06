/**
 * User Settings API - VistorIA Pro
 * GET: Fetch user settings (creates with defaults if not exists)
 * PATCH: Update user settings
 */

import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { z } from 'zod'
import { createAdminClient } from '@/lib/supabase/server'
import type { UserSettings, AIStrictnessLevel } from '@/types/database'

// Validation schema for PATCH
const updateSettingsSchema = z.object({
  disputes_enabled: z.boolean().optional(),
  ai_inspection_strictness: z.enum(['standard', 'strict', 'very_strict']).optional(),
  // White-label branding
  company_name: z.string().max(100).optional().nullable(),
  logo_url: z.string().url().optional().nullable(),
  brand_primary_color: z.string().regex(/^#[0-9A-Fa-f]{6}$/).optional().nullable(),
  brand_secondary_color: z.string().regex(/^#[0-9A-Fa-f]{6}$/).optional().nullable(),
  pdf_footer_text: z.string().max(500).optional().nullable(),
  show_powered_by: z.boolean().optional(),
  // Regional settings
  default_region: z.string().max(50).optional().nullable(),
})

/**
 * GET /api/user/settings
 * Fetch user settings, create with defaults if doesn't exist
 */
export async function GET(request: NextRequest) {
  try {
    const { userId: clerkUserId } = await auth()

    if (!clerkUserId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const supabase = createAdminClient()

    // Get user from database
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('id')
      .eq('clerk_id', clerkUserId)
      .single()

    if (userError || !user) {
      console.error('User not found:', userError)
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Try to get existing settings
    const { data: existingSettings, error: fetchError } = await supabase
      .from('user_settings')
      .select('*')
      .eq('user_id', user.id)
      .maybeSingle()

    if (fetchError) {
      console.error('Error fetching user settings:', fetchError)
      return NextResponse.json(
        { error: 'Failed to fetch settings' },
        { status: 500 }
      )
    }

    // If settings exist, return them
    if (existingSettings) {
      return NextResponse.json({ settings: existingSettings })
    }

    // Otherwise, create default settings
    const defaultSettings = {
      user_id: user.id,
      disputes_enabled: true,
      ai_inspection_strictness: 'standard' as AIStrictnessLevel,
    }

    const { data: newSettings, error: createError } = await supabase
      .from('user_settings')
      .insert(defaultSettings)
      .select()
      .single()

    if (createError) {
      console.error('Error creating default settings:', createError)
      return NextResponse.json(
        { error: 'Failed to create default settings' },
        { status: 500 }
      )
    }

    return NextResponse.json({ settings: newSettings })
  } catch (error) {
    console.error('GET /api/user/settings error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

/**
 * PATCH /api/user/settings
 * Update user settings
 */
export async function PATCH(request: NextRequest) {
  try {
    const { userId: clerkUserId } = await auth()

    if (!clerkUserId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Parse and validate request body
    const body = await request.json()
    const validatedData = updateSettingsSchema.parse(body)

    // Check that at least one field is being updated
    if (Object.keys(validatedData).length === 0) {
      return NextResponse.json(
        { error: 'No fields to update' },
        { status: 400 }
      )
    }

    const supabase = createAdminClient()

    // Get user from database
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('id')
      .eq('clerk_id', clerkUserId)
      .single()

    if (userError || !user) {
      console.error('User not found:', userError)
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Check if settings exist
    const { data: existingSettings } = await supabase
      .from('user_settings')
      .select('id')
      .eq('user_id', user.id)
      .maybeSingle()

    let updatedSettings: UserSettings

    if (existingSettings) {
      // Update existing settings
      const { data, error: updateError } = await supabase
        .from('user_settings')
        .update({
          ...validatedData,
          updated_at: new Date().toISOString(),
        })
        .eq('user_id', user.id)
        .select()
        .single()

      if (updateError) {
        console.error('Error updating settings:', updateError)
        return NextResponse.json(
          { error: 'Failed to update settings' },
          { status: 500 }
        )
      }

      updatedSettings = data
    } else {
      // Create settings with provided values + defaults
      const { data, error: createError } = await supabase
        .from('user_settings')
        .insert({
          user_id: user.id,
          disputes_enabled: validatedData.disputes_enabled ?? true,
          ai_inspection_strictness: validatedData.ai_inspection_strictness ?? 'standard',
        })
        .select()
        .single()

      if (createError) {
        console.error('Error creating settings:', createError)
        return NextResponse.json(
          { error: 'Failed to create settings' },
          { status: 500 }
        )
      }

      updatedSettings = data
    }

    return NextResponse.json({
      message: 'Settings updated successfully',
      settings: updatedSettings,
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request data', details: error.issues },
        { status: 400 }
      )
    }

    console.error('PATCH /api/user/settings error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

/**
 * Logo Upload API - VistorIA Pro
 * POST: Upload company logo for white-label branding
 */

import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { createAdminClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
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
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Parse form data
    const formData = await request.formData()
    const file = formData.get('logo') as File

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 })
    }

    // Validate file type
    if (!file.type.startsWith('image/')) {
      return NextResponse.json(
        { error: 'File must be an image' },
        { status: 400 }
      )
    }

    // Validate file size (max 2MB)
    if (file.size > 2 * 1024 * 1024) {
      return NextResponse.json(
        { error: 'File size must be less than 2MB' },
        { status: 400 }
      )
    }

    // Generate unique filename
    const fileExt = file.name.split('.').pop() || 'png'
    const fileName = `${user.id}/logo-${Date.now()}.${fileExt}`

    // Convert File to ArrayBuffer then to Buffer
    const arrayBuffer = await file.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)

    // Upload to Supabase Storage
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('company-logos')
      .upload(fileName, buffer, {
        contentType: file.type,
        upsert: true,
      })

    if (uploadError) {
      console.error('Error uploading logo:', uploadError)

      // Check if bucket doesn't exist
      if (uploadError.message.includes('Bucket not found')) {
        return NextResponse.json(
          { error: 'Storage not configured. Please create the company-logos bucket.' },
          { status: 500 }
        )
      }

      return NextResponse.json(
        { error: 'Failed to upload logo' },
        { status: 500 }
      )
    }

    // Get public URL
    const { data: urlData } = supabase.storage
      .from('company-logos')
      .getPublicUrl(fileName)

    const logoUrl = urlData.publicUrl

    // Update user settings with new logo URL
    const { data: existingSettings } = await supabase
      .from('user_settings')
      .select('id')
      .eq('user_id', user.id)
      .maybeSingle()

    if (existingSettings) {
      await supabase
        .from('user_settings')
        .update({ logo_url: logoUrl, updated_at: new Date().toISOString() })
        .eq('user_id', user.id)
    } else {
      await supabase
        .from('user_settings')
        .insert({
          user_id: user.id,
          logo_url: logoUrl,
          disputes_enabled: true,
          ai_inspection_strictness: 'standard',
        })
    }

    return NextResponse.json({
      message: 'Logo uploaded successfully',
      logo_url: logoUrl,
    })
  } catch (error) {
    console.error('POST /api/user/logo error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { createAdminClient } from '@/lib/supabase/server'

/**
 * POST /api/properties/[id]/thumbnail
 * Upload thumbnail for a property
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
    const formData = await request.formData()
    const file = formData.get('thumbnail') as File

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 })
    }

    // Validate file type
    if (!file.type.startsWith('image/')) {
      return NextResponse.json({ error: 'File must be an image' }, { status: 400 })
    }

    // Validate file size (5MB)
    if (file.size > 5 * 1024 * 1024) {
      return NextResponse.json({ error: 'File size must be less than 5MB' }, { status: 400 })
    }

    const supabase = createAdminClient()

    // Get user from database
    const { data: user } = await supabase
      .from('users')
      .select('id')
      .eq('clerk_id', authResult.userId)
      .single()

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Check if property exists and belongs to user
    const { data: property, error: propertyError } = await supabase
      .from('properties')
      .select('id, thumbnail_url')
      .eq('id', id)
      .eq('user_id', user.id)
      .single()

    if (propertyError || !property) {
      console.error('Property not found:', propertyError)
      return NextResponse.json({ error: 'Property not found' }, { status: 404 })
    }

    // Delete old thumbnail if exists
    if (property.thumbnail_url) {
      const oldPath = property.thumbnail_url.split('/').pop()
      if (oldPath) {
        await supabase.storage
          .from('properties')
          .remove([`thumbnails/${oldPath}`])
      }
    }

    // Upload new thumbnail
    const fileExt = file.name.split('.').pop()
    const fileName = `${id}-${Date.now()}.${fileExt}`
    const filePath = `thumbnails/${fileName}`

    const arrayBuffer = await file.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)

    const { error: uploadError } = await supabase.storage
      .from('properties')
      .upload(filePath, buffer, {
        contentType: file.type,
        upsert: true,
      })

    if (uploadError) {
      console.error('Storage upload error:', uploadError)
      return NextResponse.json({ error: 'Failed to upload file' }, { status: 500 })
    }

    // Get public URL
    const { data: urlData } = supabase.storage
      .from('properties')
      .getPublicUrl(filePath)

    // Update property with thumbnail URL
    const { error: updateError } = await supabase
      .from('properties')
      .update({ thumbnail_url: urlData.publicUrl })
      .eq('id', id)

    if (updateError) {
      console.error('Database update error:', updateError)
      return NextResponse.json({ error: 'Failed to update property' }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      thumbnail_url: urlData.publicUrl,
    })
  } catch (error) {
    console.error('Thumbnail upload error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

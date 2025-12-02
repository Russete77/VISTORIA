import { NextRequest, NextResponse } from 'next/server'
import { auth, clerkClient } from '@clerk/nextjs/server'
import { createAdminClient } from '@/lib/supabase/server'

const MAX_FILE_SIZE = 2 * 1024 * 1024 // 2MB
const ALLOWED_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp']

export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth()

    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const supabase = createAdminClient()

    // Get user from database
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('id, clerk_id, image_url')
      .eq('clerk_id', userId)
      .is('deleted_at', null)
      .single()

    if (userError || !user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    // Parse form data
    const formData = await request.formData()
    const file = formData.get('file') as File

    if (!file) {
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      )
    }

    // Validate file type
    if (!ALLOWED_TYPES.includes(file.type)) {
      return NextResponse.json(
        { error: 'Invalid file type. Only JPG, PNG and WEBP are allowed.' },
        { status: 400 }
      )
    }

    // Validate file size
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: 'File too large. Maximum size is 2MB.' },
        { status: 400 }
      )
    }

    // Delete old avatar if exists
    if (user.image_url) {
      const oldPath = user.image_url.split('/avatars/')[1]
      if (oldPath) {
        await supabase.storage
          .from('avatars')
          .remove([oldPath])
      }
    }

    // Generate unique filename
    const fileExtension = file.name.split('.').pop()
    const fileName = `${user.id}-${Date.now()}.${fileExtension}`
    const filePath = `${user.id}/${fileName}`

    // Upload to Supabase Storage
    const fileBuffer = await file.arrayBuffer()
    const { error: uploadError } = await supabase.storage
      .from('avatars')
      .upload(filePath, fileBuffer, {
        contentType: file.type,
        upsert: true,
      })

    if (uploadError) {
      console.error('Upload error:', uploadError)
      return NextResponse.json(
        { error: 'Failed to upload file' },
        { status: 500 }
      )
    }

    // Get public URL
    const { data: urlData } = supabase.storage
      .from('avatars')
      .getPublicUrl(filePath)

    const publicUrl = urlData.publicUrl

    // Update user in database
    const { error: updateError } = await supabase
      .from('users')
      .update({
        image_url: publicUrl,
        updated_at: new Date().toISOString(),
      })
      .eq('id', user.id)

    if (updateError) {
      console.error('Database update error:', updateError)
      return NextResponse.json(
        { error: 'Failed to update user profile' },
        { status: 500 }
      )
    }

    // Update Clerk user
    try {
      const client = await clerkClient()
      await client.users.updateUser(userId, {
        publicMetadata: {
          avatar_url: publicUrl,
        },
      })
    } catch (clerkError) {
      console.error('Clerk update error:', clerkError)
      // Non-critical - continue even if Clerk update fails
    }

    return NextResponse.json({
      success: true,
      image_url: publicUrl,
      message: 'Photo uploaded successfully',
    })
  } catch (error) {
    console.error('Error in upload-photo API:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

import { NextRequest, NextResponse } from 'next/server'
import { auth, clerkClient } from '@clerk/nextjs/server'
import { createAdminClient } from '@/lib/supabase/server'
import { z } from 'zod'

const userUpdateSchema = z.object({
  first_name: z.string().optional(),
  last_name: z.string().optional(),
  preferences: z.object({
    language: z.string().optional(),
    email_notifications: z.boolean().optional(),
    push_notifications: z.boolean().optional(),
    marketing_emails: z.boolean().optional(),
    weekly_reports: z.boolean().optional(),
  }).optional(),
})

export async function GET() {
  try {
    const { userId } = await auth()

    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const supabase = createAdminClient()

    const { data: dbUser, error } = await supabase
      .from('users')
      .select('*')
      .eq('clerk_id', userId)
      .is('deleted_at', null)
      .single()

    if (error) {
      console.error('Error fetching user:', error)
      return NextResponse.json(
        { error: 'Failed to fetch user' },
        { status: 500 }
      )
    }

    // Update last login
    await supabase
      .from('users')
      .update({ last_login_at: new Date().toISOString() })
      .eq('id', dbUser.id)

    return NextResponse.json({ user: dbUser })
  } catch (error) {
    console.error('Error in user API:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// POST: Sync user from Clerk to Supabase (manual sync for when webhook fails)
export async function POST() {
  try {
    const { userId } = await auth()

    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    console.log('Syncing user:', userId)

    const supabase = createAdminClient()

    // Check if user already exists
    const { data: existingUser } = await supabase
      .from('users')
      .select('id, email, tier, credits')
      .eq('clerk_id', userId)
      .single()

    if (existingUser) {
      console.log('User already exists:', existingUser)
      return NextResponse.json({
        message: 'User already exists',
        user: existingUser,
        synced: false
      })
    }

    console.log('User not found in Supabase, fetching from Clerk...')

    // Get user details from Clerk
    const client = await clerkClient()
    const clerkUser = await client.users.getUser(userId)

    console.log('Clerk user data:', {
      id: clerkUser.id,
      email: clerkUser.emailAddresses[0]?.emailAddress,
      firstName: clerkUser.firstName,
      lastName: clerkUser.lastName
    })

    const email = clerkUser.emailAddresses?.[0]?.emailAddress

    if (!email) {
      return NextResponse.json(
        { error: 'No email found in Clerk user' },
        { status: 400 }
      )
    }

    // Create user in Supabase using ADMIN client to bypass RLS
    const adminClient = createAdminClient()

    const { data: newUser, error: insertError } = await adminClient
      .from('users')
      .insert({
        clerk_id: clerkUser.id,
        email,
        first_name: clerkUser.firstName || null,
        last_name: clerkUser.lastName || null,
        full_name: clerkUser.firstName && clerkUser.lastName
          ? `${clerkUser.firstName} ${clerkUser.lastName}`
          : clerkUser.firstName || null,
        image_url: clerkUser.imageUrl || null,
        tier: 'free',
        credits: 1,
      })
      .select()
      .single()

    if (insertError) {
      console.error('Error creating user:', insertError)
      return NextResponse.json(
        { error: 'Failed to create user', details: insertError },
        { status: 500 }
      )
    }

    console.log('User synced successfully:', newUser.id)

    return NextResponse.json({
      message: 'User synced successfully',
      user: newUser,
      synced: true
    })
  } catch (error) {
    console.error('Error in user sync API:', error)
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    )
  }
}

// PATCH: Update user preferences
export async function PATCH(request: NextRequest) {
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
    const { data: user } = await supabase
      .from('users')
      .select('id, first_name, last_name')
      .eq('clerk_id', userId)
      .single()

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Parse and validate request body
    const body = await request.json()
    const validatedData = userUpdateSchema.parse(body)

    // Build update object
    const updateData: Record<string, unknown> = {}

    if (validatedData.first_name !== undefined) {
      updateData.first_name = validatedData.first_name
    }

    if (validatedData.last_name !== undefined) {
      updateData.last_name = validatedData.last_name
    }

    // Update full_name if either first or last name is being updated
    if (validatedData.first_name || validatedData.last_name) {
      const firstName = validatedData.first_name || user.first_name
      const lastName = validatedData.last_name || user.last_name
      updateData.full_name = `${firstName || ''} ${lastName || ''}`.trim()
    }

    if (validatedData.preferences) {
      updateData.preferences = validatedData.preferences
    }

    updateData.updated_at = new Date().toISOString()

    // Update user
    const { data: updatedUser, error } = await supabase
      .from('users')
      .update(updateData)
      .eq('id', user.id)
      .select()
      .single()

    if (error) {
      console.error('Error updating user:', error)
      return NextResponse.json(
        { error: 'Failed to update user' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      user: updatedUser,
      message: 'User updated successfully',
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.issues },
        { status: 400 }
      )
    }

    console.error('Error in PATCH /api/user:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

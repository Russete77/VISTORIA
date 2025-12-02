import { NextRequest, NextResponse } from 'next/server'
import { auth, clerkClient } from '@clerk/nextjs/server'
import { createAdminClient } from '@/lib/supabase/server'
import { z } from 'zod'

const deleteAccountSchema = z.object({
  confirmEmail: z.string().email(),
})

export async function DELETE(request: NextRequest) {
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
      .select('id, email, clerk_id')
      .eq('clerk_id', userId)
      .is('deleted_at', null)
      .single()

    if (userError || !user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    // Parse and validate request body
    const body = await request.json()
    const validatedData = deleteAccountSchema.parse(body)

    // Verify email matches
    if (validatedData.confirmEmail.toLowerCase() !== user.email.toLowerCase()) {
      return NextResponse.json(
        { error: 'Email confirmation does not match' },
        { status: 400 }
      )
    }

    // Check for pending transactions
    const { data: pendingTransactions } = await supabase
      .from('transactions')
      .select('id')
      .eq('user_id', user.id)
      .eq('status', 'pending')
      .limit(1)

    if (pendingTransactions && pendingTransactions.length > 0) {
      return NextResponse.json(
        { error: 'Cannot delete account with pending transactions. Please contact support.' },
        { status: 400 }
      )
    }

    const now = new Date().toISOString()

    // Soft delete user (set deleted_at timestamp)
    const { error: userDeleteError } = await supabase
      .from('users')
      .update({ deleted_at: now })
      .eq('id', user.id)

    if (userDeleteError) {
      console.error('Error soft deleting user:', userDeleteError)
      return NextResponse.json(
        { error: 'Failed to delete account' },
        { status: 500 }
      )
    }

    // Soft delete related entities (but keep for audit trail)
    await Promise.all([
      // Properties
      supabase
        .from('properties')
        .update({ deleted_at: now })
        .eq('user_id', user.id)
        .is('deleted_at', null),

      // Inspections
      supabase
        .from('inspections')
        .update({ deleted_at: now })
        .eq('user_id', user.id)
        .is('deleted_at', null),

      // Inspection Photos
      supabase
        .from('inspection_photos')
        .update({ deleted_at: now })
        .eq('user_id', user.id)
        .is('deleted_at', null),
    ])

    // Keep transactions and credit_usage for financial audit (DO NOT DELETE)

    // Delete from Clerk
    try {
      const client = await clerkClient()
      await client.users.deleteUser(userId)
    } catch (clerkError) {
      console.error('Error deleting from Clerk:', clerkError)
      // Continue even if Clerk deletion fails - user is already soft deleted
    }

    return NextResponse.json({
      success: true,
      message: 'Account deleted successfully',
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.issues },
        { status: 400 }
      )
    }

    console.error('Error in delete account API:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

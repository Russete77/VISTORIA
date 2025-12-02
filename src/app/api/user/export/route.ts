import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { createAdminClient } from '@/lib/supabase/server'

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
      .select('*')
      .eq('clerk_id', userId)
      .is('deleted_at', null)
      .single()

    if (userError || !user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    // Fetch all user data in parallel
    const [
      { data: properties },
      { data: inspections },
      { data: photos },
      { data: comparisons },
      { data: transactions },
      { data: creditUsage },
    ] = await Promise.all([
      supabase
        .from('properties')
        .select('*')
        .eq('user_id', user.id)
        .is('deleted_at', null),

      supabase
        .from('inspections')
        .select('*')
        .eq('user_id', user.id)
        .is('deleted_at', null),

      supabase
        .from('inspection_photos')
        .select('*')
        .eq('user_id', user.id)
        .is('deleted_at', null),

      supabase
        .from('comparisons')
        .select('*')
        .eq('user_id', user.id),

      supabase
        .from('transactions')
        .select('*')
        .eq('user_id', user.id),

      supabase
        .from('credit_usage')
        .select('*')
        .eq('user_id', user.id),
    ])

    // Generate photo download URLs (valid for 1 hour)
    const photosWithUrls = await Promise.all(
      photos?.map(async (photo) => {
        const { data: urlData } = await supabase.storage
          .from('inspection-photos')
          .createSignedUrl(photo.storage_path, 3600) // 1 hour

        return {
          ...photo,
          download_url: urlData?.signedUrl || null,
        }
      }) || []
    )

    // Compile all data
    const exportData = {
      export_info: {
        generated_at: new Date().toISOString(),
        user_id: user.id,
        email: user.email,
        version: '1.0',
      },
      user: {
        ...user,
        clerk_id: undefined, // Remove sensitive IDs
      },
      properties: properties || [],
      inspections: inspections || [],
      photos: photosWithUrls,
      comparisons: comparisons || [],
      transactions: transactions || [],
      credit_usage: creditUsage || [],
      statistics: {
        total_properties: properties?.length || 0,
        total_inspections: inspections?.length || 0,
        total_photos: photos?.length || 0,
        total_comparisons: comparisons?.length || 0,
        total_transactions: transactions?.length || 0,
        current_credits: user.credits,
        account_tier: user.tier,
      },
    }

    // Return JSON data directly (frontend will handle download)
    return new NextResponse(JSON.stringify(exportData, null, 2), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Content-Disposition': `attachment; filename="vistoria-pro-data-${user.id}-${Date.now()}.json"`,
      },
    })
  } catch (error) {
    console.error('Error in export data API:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

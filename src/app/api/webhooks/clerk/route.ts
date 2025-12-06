import { NextResponse } from 'next/server'
import { Webhook } from 'svix'
import { createAdminClient } from '@/lib/supabase/server'

export const runtime = 'nodejs'

export async function POST(req: Request) {
  const WEBHOOK_SECRET = (process.env.CLERK_WEBHOOK_SECRET || '').trim()

  if (!WEBHOOK_SECRET) {
    console.error('Missing CLERK_WEBHOOK_SECRET')
    return NextResponse.json(
      { error: 'Server configuration error' },
      { status: 500 }
    )
  }

  const svixId = req.headers.get('svix-id')
  const svixTimestamp = req.headers.get('svix-timestamp')
  const svixSignature = req.headers.get('svix-signature')

  if (!svixId || !svixTimestamp || !svixSignature) {
    return NextResponse.json(
      { error: 'Missing svix headers' },
      { status: 400 }
    )
  }

  // Use the raw body for signature verification — DO NOT parse before verify
  const body = await req.text()

  const wh = new Webhook(WEBHOOK_SECRET)

  let evt: {
    type: string
    data: {
      id: string
      email_addresses: Array<{ email_address: string }>
      first_name?: string
      last_name?: string
      image_url?: string
    }
  }

  try {
    // Pass the raw signature header string to svix verify
    evt = wh.verify(body, svixSignature as string) as typeof evt
  } catch (err: any) {
    console.error('Error verifying webhook:', err?.message || err)
    return NextResponse.json(
      { error: 'Invalid signature' },
      { status: 400 }
    )
  }

  const { type, data } = evt
  const supabase = createAdminClient()

  try {
    switch (type) {
      case 'user.created': {
        const email = data.email_addresses[0]?.email_address

        if (!email) {
          throw new Error('No email found in webhook data')
        }

        // Use upsert on clerk_id to avoid unique constraint errors
        const { error } = await supabase.from('users').upsert(
          {
            clerk_id: data.id,
            email,
            first_name: data.first_name || null,
            last_name: data.last_name || null,
            full_name: data.first_name && data.last_name
              ? `${data.first_name} ${data.last_name}`
              : data.first_name || null,
            image_url: data.image_url || null,
            tier: 'free',
            credits: 1, // Free tier gets 1 inspection
          },
          { onConflict: 'clerk_id' }
        )

        if (error) throw error

        console.log(`User created/updated in database: ${data.id}`)
        break
      }

      case 'user.updated': {
        const email = data.email_addresses[0]?.email_address

        const { error } = await supabase
          .from('users')
          .update({
            email: email || undefined,
            first_name: data.first_name || null,
            last_name: data.last_name || null,
            full_name: data.first_name && data.last_name
              ? `${data.first_name} ${data.last_name}`
              : data.first_name || null,
            image_url: data.image_url || null,
            updated_at: new Date().toISOString(),
          })
          .eq('clerk_id', data.id)

        if (error) throw error

        console.log(`User updated in database: ${data.id}`)
        break
      }

      case 'user.deleted': {
        const { error } = await supabase
          .from('users')
          .update({
            deleted_at: new Date().toISOString(),
          })
          .eq('clerk_id', data.id)

        if (error) throw error

        console.log(`User soft-deleted in database: ${data.id}`)
        break
      }

      default:
        console.log(`Unhandled webhook event type: ${type}`)
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error processing webhook:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

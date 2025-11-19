import { headers } from 'next/headers'
import { NextResponse } from 'next/server'
import { Webhook } from 'svix'
import { createAdminClient } from '@/lib/supabase/server'

export async function POST(req: Request) {
  const WEBHOOK_SECRET = process.env.CLERK_WEBHOOK_SECRET

  if (!WEBHOOK_SECRET) {
    console.error('Missing CLERK_WEBHOOK_SECRET')
    return NextResponse.json(
      { error: 'Server configuration error' },
      { status: 500 }
    )
  }

  const headerPayload = await headers()
  const svixId = headerPayload.get('svix-id')
  const svixTimestamp = headerPayload.get('svix-timestamp')
  const svixSignature = headerPayload.get('svix-signature')

  if (!svixId || !svixTimestamp || !svixSignature) {
    return NextResponse.json(
      { error: 'Missing svix headers' },
      { status: 400 }
    )
  }

  const payload = await req.json()
  const body = JSON.stringify(payload)

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
    evt = wh.verify(body, {
      'svix-id': svixId,
      'svix-timestamp': svixTimestamp,
      'svix-signature': svixSignature,
    }) as typeof evt
  } catch (err) {
    console.error('Error verifying webhook:', err)
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

        const { error } = await supabase.from('users').insert({
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
        })

        if (error) throw error

        console.log(`User created in database: ${data.id}`)
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

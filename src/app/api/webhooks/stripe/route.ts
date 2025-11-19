import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'
import Stripe from 'stripe'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2024-11-20.acacia',
})

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!

/**
 * POST /api/webhooks/stripe
 * Handle Stripe webhook events
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.text()
    const signature = request.headers.get('stripe-signature')

    if (!signature) {
      return NextResponse.json({ error: 'Missing signature' }, { status: 400 })
    }

    // Verify webhook signature
    let event: Stripe.Event
    try {
      event = stripe.webhooks.constructEvent(body, signature, webhookSecret)
    } catch (err) {
      console.error('Webhook signature verification failed:', err)
      return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
    }

    const supabase = createAdminClient()

    // Handle the event
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session

        // Get metadata
        const userId = session.metadata?.user_id
        const credits = parseInt(session.metadata?.credits || '0')
        const packageId = session.metadata?.package_id

        if (!userId || !credits) {
          console.error('Missing metadata in webhook:', session.metadata)
          return NextResponse.json({ error: 'Missing metadata' }, { status: 400 })
        }

        // Get current user credits
        const { data: user, error: userError } = await supabase
          .from('users')
          .select('credits')
          .eq('id', userId)
          .single()

        if (userError || !user) {
          console.error('User not found:', userId)
          return NextResponse.json({ error: 'User not found' }, { status: 404 })
        }

        // Add credits to user
        const newCredits = (user.credits || 0) + credits
        const { error: updateError } = await supabase
          .from('users')
          .update({ credits: newCredits })
          .eq('id', userId)

        if (updateError) {
          console.error('Failed to update user credits:', updateError)
          return NextResponse.json({ error: 'Failed to update credits' }, { status: 500 })
        }

        // Record transaction
        const { error: transactionError } = await supabase
          .from('credit_transactions')
          .insert({
            user_id: userId,
            type: 'credit',
            amount: credits,
            description: `Compra de ${credits} créditos - Pacote ${packageId}`,
            stripe_session_id: session.id,
            stripe_payment_intent_id: session.payment_intent as string,
            metadata: {
              package_id: packageId,
              amount_paid: session.amount_total,
              currency: session.currency,
            },
          })

        if (transactionError) {
          console.error('Failed to record transaction:', transactionError)
          // Don't return error - credits were added successfully
        }

        console.log(`✅ Added ${credits} credits to user ${userId}`)
        break
      }

      case 'checkout.session.expired': {
        const session = event.data.object as Stripe.Checkout.Session
        console.log(`⏱️ Checkout session expired: ${session.id}`)
        break
      }

      case 'payment_intent.succeeded': {
        const paymentIntent = event.data.object as Stripe.PaymentIntent
        console.log(`💰 Payment succeeded: ${paymentIntent.id}`)
        break
      }

      case 'payment_intent.payment_failed': {
        const paymentIntent = event.data.object as Stripe.PaymentIntent
        console.error(`❌ Payment failed: ${paymentIntent.id}`)
        break
      }

      default:
        console.log(`Unhandled event type: ${event.type}`)
    }

    return NextResponse.json({ received: true })
  } catch (error) {
    console.error('Webhook error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

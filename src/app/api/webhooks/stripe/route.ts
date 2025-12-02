import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'
import Stripe from 'stripe'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-10-29.clover',
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
        const discount = parseFloat(session.metadata?.discount || '0')
        const type = session.metadata?.type || 'credit_purchase'

        if (!userId || !credits) {
          console.error('Missing metadata in webhook:', session.metadata)
          return NextResponse.json({ error: 'Missing metadata' }, { status: 400 })
        }

        console.log(`[Stripe Webhook] Processing payment for user ${userId}: ${credits} credits`)

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
        const amountInReais = (session.amount_total || 0) / 100
        const { error: transactionError } = await supabase
          .from('credit_transactions')
          .insert({
            user_id: userId,
            type: 'credit',
            amount: credits,
            description: `Compra de ${credits} crédito${credits > 1 ? 's' : ''} via ${session.payment_method_types?.[0] || 'stripe'}${discount > 0 ? ` (${(discount * 100).toFixed(0)}% desconto)` : ''}`,
            stripe_session_id: session.id,
            stripe_payment_intent_id: session.payment_intent as string,
            metadata: {
              credits,
              discount,
              amount_paid: amountInReais,
              currency: session.currency,
              payment_method: session.payment_method_types?.[0],
              type,
            },
          })

        if (transactionError) {
          console.error('Failed to record transaction:', transactionError)
          // Don't return error - credits were added successfully
        }

        console.log(`✅ Added ${credits} credits to user ${userId} (paid R$ ${amountInReais.toFixed(2)})`)
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

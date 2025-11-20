import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { createAdminClient } from '@/lib/supabase/server'
import Stripe from 'stripe'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2024-11-20.acacia',
})

/**
 * POST /api/billing/create-checkout
 * Create Stripe checkout session for purchasing credits
 */
export async function POST(request: NextRequest) {
  try {
    const authResult = await auth()
    if (!authResult.userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { credits } = await request.json()

    if (!credits || credits < 1) {
      return NextResponse.json({ error: 'Credits must be at least 1' }, { status: 400 })
    }

    if (credits > 1000) {
      return NextResponse.json({ error: 'Maximum 1000 credits per purchase' }, { status: 400 })
    }

    const supabase = createAdminClient()

    // Get user
    const { data: user } = await supabase
      .from('users')
      .select('id, email, name')
      .eq('clerk_id', authResult.userId)
      .single()

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Preço base por crédito em centavos (R$ 9,90 = 990 centavos)
    const PRICE_PER_CREDIT = 990

    // Calculate discount based on quantity
    let discount = 0
    let discountLabel = ''

    if (credits >= 100) {
      discount = 0.30 // 30% off
      discountLabel = 'Economize 30%'
    } else if (credits >= 50) {
      discount = 0.20 // 20% off
      discountLabel = 'Economize 20%'
    } else if (credits >= 25) {
      discount = 0.15 // 15% off
      discountLabel = 'Economize 15%'
    } else if (credits >= 10) {
      discount = 0.10 // 10% off
      discountLabel = 'Economize 10%'
    }

    const basePrice = credits * PRICE_PER_CREDIT
    const finalPrice = Math.round(basePrice * (1 - discount))
    const selectedPackage = {
      credits,
      price: finalPrice,
      name: `${credits} Crédito${credits > 1 ? 's' : ''} VistorIA Pro`,
      description: discount > 0
        ? `${credits} créditos • ${discountLabel}`
        : `${credits} créditos`,
    }

    // Create Stripe checkout session with PIX and Boleto support
    const session = await stripe.checkout.sessions.create({
      // Support for Card, PIX (instant), and Boleto (3 days)
      payment_method_types: ['card', 'boleto', 'pix'],
      line_items: [
        {
          price_data: {
            currency: 'brl',
            product_data: {
              name: selectedPackage.name,
              description: selectedPackage.description,
            },
            unit_amount: selectedPackage.price,
          },
          quantity: 1,
        },
      ],
      mode: 'payment',
      success_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/billing/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/billing`,
      customer_email: user.email,
      client_reference_id: user.id,
      metadata: {
        user_id: user.id,
        clerk_id: authResult.userId,
        credits: credits.toString(),
        discount: discount.toString(),
        type: 'credit_purchase',
      },
      // Boleto-specific configuration
      payment_method_options: {
        boleto: {
          expires_after_days: 3, // Boleto expires in 3 days
        },
      },
      // Brazilian Portuguese locale
      locale: 'pt-BR',
    })

    return NextResponse.json({
      sessionId: session.id,
      url: session.url,
      amount: finalPrice,
      credits,
      discount: discount * 100, // Return as percentage
    })
  } catch (error) {
    console.error('Create checkout error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

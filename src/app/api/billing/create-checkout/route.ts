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

    const { packageId } = await request.json()

    if (!packageId) {
      return NextResponse.json({ error: 'Package ID required' }, { status: 400 })
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

    // Define credit packages
    const packages: Record<string, { credits: number; price: number; name: string }> = {
      starter: {
        credits: 10,
        price: 2990, // R$ 29.90 in cents
        name: 'Pacote Starter - 10 Créditos',
      },
      pro: {
        credits: 30,
        price: 7990, // R$ 79.90 in cents (save ~11%)
        name: 'Pacote Pro - 30 Créditos',
      },
      enterprise: {
        credits: 100,
        price: 19990, // R$ 199.90 in cents (save ~33%)
        name: 'Pacote Enterprise - 100 Créditos',
      },
    }

    const selectedPackage = packages[packageId]
    if (!selectedPackage) {
      return NextResponse.json({ error: 'Invalid package' }, { status: 400 })
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
              description: `Compre ${selectedPackage.credits} créditos para criar vistorias e gerar laudos`,
              images: ['https://vistoria-pro.com/logo.png'], // Add your logo URL
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
        credits: selectedPackage.credits.toString(),
        package_id: packageId,
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
    })
  } catch (error) {
    console.error('Create checkout error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

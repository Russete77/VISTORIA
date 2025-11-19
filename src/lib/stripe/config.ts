import Stripe from 'stripe'

if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error('Missing STRIPE_SECRET_KEY environment variable')
}

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2025-10-29.clover',
  typescript: true,
})

export const STRIPE_CONFIG = {
  currency: 'brl',
  plans: {
    payPerUse: {
      price: 990, // R$ 9,90 em centavos
      name: 'Vistoria Avulsa',
    },
    starterPack: {
      price: 8900, // R$ 89,00
      credits: 10,
      name: 'Starter Pack',
    },
    proPack: {
      price: 19900, // R$ 199,00
      credits: 25,
      name: 'Pro Pack',
    },
    businessPack: {
      price: 44900, // R$ 449,00
      credits: 60,
      name: 'Business Pack',
    },
    professional: {
      price: 29900, // R$ 299,00/mês
      credits: 50,
      name: 'Professional',
    },
    business: {
      price: 69900, // R$ 699,00/mês
      credits: 150,
      name: 'Business',
    },
  },
  addOns: {
    comparison: {
      price: 500, // R$ 5,00
      name: 'Comparação Entrada/Saída',
    },
    googleVision: {
      price: 200, // R$ 2,00
      name: 'Google Vision',
    },
  },
} as const

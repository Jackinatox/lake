import 'server-only'

import Stripe from 'stripe'
import { env } from 'next-runtime-env'

let _stripe: Stripe | null = null

function getStripe(): Stripe {
  if (!_stripe) {
    const apiKey = env('STRIPE_SECRET_KEY')
    if (!apiKey) {
      throw new Error('STRIPE_SECRET_KEY is not defined')
    }
    _stripe = new Stripe(apiKey, { apiVersion: '2025-09-30.clover' })
  }
  return _stripe
}

export const stripe = getStripe()
import 'server-only'

import Stripe from 'stripe'
import { env } from 'next-runtime-env'

export function getStripe() {
  return new Stripe(env('STRIPE_SECRET_KEY'), { apiVersion: '2025-07-30.basil'})
}

// For backwards compatibility, also export as a getter
export const stripe = new Proxy({} as Stripe, {
  get() {
    return getStripe()
  }
}) as any
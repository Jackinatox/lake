import 'server-only'

import Stripe from 'stripe'
import { env } from 'next-runtime-env'

// export function getStripe() {
//   return new Stripe(env('STRIPE_SECRET_KEY'), { apiVersion: '2025-09-30.clover'})
// }

// For backwards compatibility, also export as a getter
export const stripe = new Stripe(env('STRIPE_SECRET_KEY'), { apiVersion: '2025-09-30.clover'})
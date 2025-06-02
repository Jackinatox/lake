'use server'

import { headers } from 'next/headers'

import { stripe } from '../../lib/stripe'
import { auth } from '@/auth'

export async function fetchClientSecret() {
  const origin = (await headers()).get('origin')
  const userSesh = await auth();

  // Create Checkout Sessions from body params.
  const session = await stripe.checkout.sessions.create({
    ui_mode: 'embedded',
    customer_email: userSesh?.user.email,
    submit_type: 'pay',
    line_items: [
      {
        // Provide the exact Price ID (for example, price_1234) of
        // the product you want to sell
        price: 'price_1RVclq2Lz5JRnnZTF1UZZC0h',
        quantity: 1
      }
    ],
    mode: 'payment',
    return_url: `${origin}/return?session_id={CHECKOUT_SESSION_ID}`,
  })

  return session.client_secret
}
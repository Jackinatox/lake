import 'server-only'

import Stripe from 'stripe'
import { env } from 'next-runtime-env'

export const stripe = new Stripe(env('STRIPE_SECRET_KEY'), { apiVersion: '2025-09-30.clover'})
import { env } from 'next-runtime-env';
import 'server-only';

import Stripe from 'stripe';

export const stripe = new Stripe(env('STRIPE_SECRET_KEY') ?? 'sample_key', {
    apiVersion: '2026-01-28.clover',
});

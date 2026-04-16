'use client';

import { cn } from '@/lib/utils';
import { EmbeddedCheckout, EmbeddedCheckoutProvider } from '@stripe/react-stripe-js';
import { loadStripe } from '@stripe/stripe-js';
import { env } from 'next-runtime-env';
const stripePromise = loadStripe(env('NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY')!);

interface CustomServerPaymentElementsProps {
    clientSecret: string;
    className?: string;
}

function CustomServerPaymentElements({
    clientSecret,
    className,
}: CustomServerPaymentElementsProps) {
    const ready = !!clientSecret;

    return (
        <div className={cn('w-full', className)}>
            {!ready ? (
                <div className="flex flex-col items-center justify-center gap-3 py-20">
                    <div className="relative h-9 w-9">
                        <div className="absolute inset-0 rounded-full border-2 border-border" />
                        <div className="absolute inset-0 rounded-full border-2 border-t-primary animate-spin" />
                    </div>
                    <p className="text-sm text-muted-foreground">Loading secure payment form…</p>
                </div>
            ) : (
                <EmbeddedCheckoutProvider stripe={stripePromise} options={{ clientSecret }}>
                    <EmbeddedCheckout />
                </EmbeddedCheckoutProvider>
            )}
        </div>
    );
}

export default CustomServerPaymentElements;

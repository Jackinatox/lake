 'use client'

import React, { useEffect, useState } from 'react'
import { Elements, EmbeddedCheckout, EmbeddedCheckoutProvider, PaymentElement } from '@stripe/react-stripe-js';
import { loadStripe } from '@stripe/stripe-js';
import { cn } from '@/lib/utils';


const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY);

interface CustomServerPaymentElementsProps {
    clientSecret: string;
    className?: string; // optional container class to control width/layout
}

function CustomServerPaymentElements({ clientSecret, className }: CustomServerPaymentElementsProps) {
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (clientSecret) {
            setLoading(false)
        }
    }, [clientSecret]);


    const options = {
        clientSecret: `${clientSecret}`
    }

    return (
        <div className={cn("w-full", className)}>
            {loading ? (
                <div className="flex items-center justify-center min-h-[200px]">
                    <div className="text-center space-y-4">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                        <p className="text-sm text-muted-foreground">Loading payment form...</p>
                    </div>
                </div>
            ) : (
                <div className="bg-card rounded-lg border shadow-sm w-full">
                    <EmbeddedCheckoutProvider
                        stripe={stripePromise}
                        options={options}
                    >
                        <div className="p-2 sm:p-4 md:p-6">
                            <EmbeddedCheckout />
                        </div>
                    </EmbeddedCheckoutProvider>
                </div>
            )}
        </div>
    );
};

export default CustomServerPaymentElements
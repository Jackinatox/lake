'use client'

import React, { useEffect, useState } from 'react'
import { Elements, EmbeddedCheckout, EmbeddedCheckoutProvider, PaymentElement } from '@stripe/react-stripe-js';
import { loadStripe } from '@stripe/stripe-js';
import { createPaymentSession } from '@/app/[locale]/booking2/[gameId]/bookServerPayment';


const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY);

interface CustomServerPaymentElementsProps {
    orderId: string;
}

function CustomServerPaymentElements({ orderId }: CustomServerPaymentElementsProps) {
    const [loading, setLoading] = useState(true);
    const [clientSecret, setClientSecret] = useState('');

    useEffect(() => {
        const fetchSecret = async () => {
            if (orderId) {

                try {
                    const secrect = await createPaymentSession(orderId);
                    // TODO: show an error if failed
                    setClientSecret(secrect);
                    // console.log(secrect)



                    setLoading(false)
                } catch (error) {

                } finally {
                }
            }
        };

        fetchSecret();
    }, [orderId]);


    const options = {
        clientSecret: `${clientSecret}`
    }

    return (
        <div className="w-full max-w-4xl mx-auto">
            {loading ? (
                <div className="flex items-center justify-center min-h-[200px]">
                    <div className="text-center space-y-4">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                        <p className="text-sm text-muted-foreground">Loading payment form...</p>
                    </div>
                </div>
            ) : (
                <div className="bg-card rounded-lg border shadow-sm">
                    <EmbeddedCheckoutProvider
                        stripe={stripePromise}
                        options={options}
                    >
                        <div className="p-4 sm:p-6">
                            <EmbeddedCheckout />
                        </div>
                    </EmbeddedCheckoutProvider>
                </div>
            )}
        </div>
    );
};

export default CustomServerPaymentElements
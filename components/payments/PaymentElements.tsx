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
        <>
            {
                loading ? <div>laoding</div> :
                    <EmbeddedCheckoutProvider
                        stripe={stripePromise}
                        options={options}
                    >
                        <EmbeddedCheckout />
                    </EmbeddedCheckoutProvider>
            }
        </>);
};

export default CustomServerPaymentElements
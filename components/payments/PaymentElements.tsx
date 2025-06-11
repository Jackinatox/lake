'use client'

import React, { useEffect, useState } from 'react'
import { Elements, EmbeddedCheckout, EmbeddedCheckoutProvider, PaymentElement } from '@stripe/react-stripe-js';
import { loadStripe } from '@stripe/stripe-js';
import { bookServerPayment } from '@/app/[locale]/booking2/[gameId]/bookServerPayment';


const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY);

interface CustomServerPaymentElementsProps {
    intendId: string;
}

function CustomServerPaymentElements({ intendId }: CustomServerPaymentElementsProps) {
    const [loading, setLoading] = useState(true);
    const [clientSecret, setClientSecret] = useState('');

    useEffect(() => {
        const fetchSecret = async () => {
            if (intendId) {

                try {
                    const secrect = await bookServerPayment(intendId);
                    setClientSecret(secrect);
                    // console.log(secrect)



                    setLoading(false)
                } catch (error) {

                } finally {
                }
            }
        };

        fetchSecret();
    }, [intendId]);


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
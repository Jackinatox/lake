'use client';

import { Checkbox } from '@/components/ui/checkbox';
import { cn } from '@/lib/utils';
import {
    BillingAddressElement,
    CheckoutElementsProvider,
    PaymentElement,
    useCheckoutElements,
} from '@stripe/react-stripe-js/checkout';
import type { Appearance } from '@stripe/stripe-js';

const BILLING_ADDRESS_THRESHOLD_CENTS = 5000;
import { loadStripe } from '@stripe/stripe-js';
import { env } from 'next-runtime-env';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Lock, ShoppingCart } from 'lucide-react';
import { Separator } from '../ui/separator';

const stripePromise = loadStripe(env('NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY')!);

function buildAppearance(isDark: boolean): Appearance {

    if (isDark) {
        return {
            theme: 'night',
            variables: {
                colorPrimary: '#60a5fa',
                colorBackground: '#12161f',
                colorText: '#f1f5f9',
                colorDanger: '#f87171',
                colorTextSecondary: '#94a3b8',
                colorTextPlaceholder: '#64748b',
                borderRadius: '6px',
                buttonBorderRadius: '6px',
            },
        };
    }
    return {
        theme: 'flat',
        variables: {
            borderRadius: '6px',
            buttonBorderRadius: '6px',
        },
    };
}

interface CustomServerPaymentElementsProps {
    clientSecret: string;
    sessionId: string;
    className?: string;
}

function CustomServerPaymentElements({
    clientSecret,
    sessionId,
    className,
}: CustomServerPaymentElementsProps) {
    const [isDark, setIsDark] = useState(
        () =>
            typeof document !== 'undefined' && document.documentElement.classList.contains('dark'),
    );

    useEffect(() => {
        const observer = new MutationObserver(() => {
            setIsDark(document.documentElement.classList.contains('dark'));
        });
        observer.observe(document.documentElement, {
            attributes: true,
            attributeFilter: ['class'],
        });
        return () => observer.disconnect();
    }, []);

    return (
        <div className={cn('w-full', className)}>
            <CheckoutElementsProvider
                stripe={stripePromise}
                options={{ clientSecret, elementsOptions: { appearance: buildAppearance(isDark) } }}
            >
                <CheckoutForm sessionId={sessionId} isDark={isDark} />
            </CheckoutElementsProvider>
        </div>
    );
}

function CheckoutForm({ sessionId, isDark }: { sessionId: string; isDark: boolean }) {
    const result = useCheckoutElements();
    const router = useRouter();

    const [tosAccepted, setTosAccepted] = useState(false);
    const [widerrufsAccepted, setWiderrufsAccepted] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const returnUrl = `${typeof window !== 'undefined' ? window.location.origin : ''}/checkout/return?session_id=${sessionId}`;

    if (result.type === 'loading') {
        return (
            <div className="flex flex-col items-center justify-center gap-3 py-20">
                <div className="relative h-9 w-9">
                    <div className="absolute inset-0 rounded-full border-2 border-border" />
                    <div className="absolute inset-0 rounded-full border-2 border-t-primary animate-spin" />
                </div>
                <p className="text-sm text-muted-foreground">Loading secure payment form…</p>
            </div>
        );
    }

    if (result.type === 'error') {
        return <p className="text-sm text-destructive text-center py-10">{result.error.message}</p>;
    }

    const { checkout } = result;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!tosAccepted || !widerrufsAccepted) return;

        setLoading(true);
        setError(null);

        const confirmResult = await checkout.confirm({
            returnUrl,
            redirect: 'if_required',
        });

        if (confirmResult.type === 'error') {
            setError(confirmResult.error.message);
            setLoading(false);
        } else {
            router.push(`/checkout/return?session_id=${sessionId}`);
        }
    };

    const requiresBillingAddress =
        checkout.total.total.minorUnitsAmount >= BILLING_ADDRESS_THRESHOLD_CENTS;
    const canSubmit = tosAccepted && widerrufsAccepted && checkout.canConfirm && !loading;

    const formattedTotal = new Intl.NumberFormat('de-DE', {
        style: 'currency',
        currency: checkout.currency.toUpperCase(),
    }).format(checkout.total.total.minorUnitsAmount / 100);

    return (
        <form onSubmit={handleSubmit} className="flex flex-col gap-2 md:gap-6 px-0">
            <div
                className="rounded-[6px] px-4 py-3.5 flex items-center justify-between gap-3 border"
                style={
                    isDark
                        ? { background: '#12161f', borderColor: '#2a3040' }
                        : { background: '#f8fafc', borderColor: '#e2e8f0' }
                }
            >
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <ShoppingCart className="h-4 w-4 shrink-0" />
                    <span>Gesamtbetrag</span>
                </div>
                <span className="text-lg font-bold tabular-nums">{formattedTotal}</span>
            </div>

            <Separator />

            <PaymentElement/>

            {requiresBillingAddress && (
                <BillingAddressElement
                    options={{
                        display: { name: 'split' },
                    }}
                />
            )}

            <div className="flex flex-col gap-3 pt-1">
                <label className="flex items-start gap-3 cursor-pointer">
                    <Checkbox
                        checked={tosAccepted}
                        onCheckedChange={(v) => setTosAccepted(!!v)}
                        className="mt-0.5 shrink-0"
                    />
                    <span className="text-sm text-muted-foreground leading-snug">
                        Ich stimme den{' '}
                        <a
                            href="/de/legal/tos"
                            target="_blank"
                            className="underline underline-offset-2 hover:text-foreground"
                        >
                            AGB
                        </a>{' '}
                        zu.
                    </span>
                </label>

                <label className="flex items-start gap-3 cursor-pointer">
                    <Checkbox
                        checked={widerrufsAccepted}
                        onCheckedChange={(v) => setWiderrufsAccepted(!!v)}
                        className="mt-0.5 shrink-0"
                    />
                    <span className="text-sm text-muted-foreground leading-snug">
                        Ich verlange den sofortigen Beginn der Dienstleistung und bestätige, dass
                        ich mein Widerrufsrecht bei vollständiger Erfüllung verliere. Die{' '}
                        <a
                            href="/de/legal/returns"
                            target="_blank"
                            className="underline underline-offset-2 hover:text-foreground"
                        >
                            Widerrufsbelehrung
                        </a>{' '}
                        habe ich zur Kenntnis genommen.
                    </span>
                </label>
            </div>

            {error && <p className="text-sm text-destructive">{error}</p>}

            <Button type="submit" disabled={!canSubmit} className="w-full">
                {loading ? (
                    <span className="flex items-center gap-2">
                        <span className="h-4 w-4 rounded-full border-2 border-primary-foreground/30 border-t-primary-foreground animate-spin" />
                        Processing…
                    </span>
                ) : (
                    <span className="flex items-center gap-2">
                        <Lock className="h-4 w-4" />
                        Jetzt {formattedTotal} bezahlen
                    </span>
                )}
            </Button>
        </form>
    );
}

export default CustomServerPaymentElements;

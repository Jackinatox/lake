'use client';

import { AlertTriangle, CheckCircle2, CreditCard, Loader2, WifiOff } from 'lucide-react';
import { useTranslations } from 'next-intl';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useMemo, useRef, useState } from 'react';

import { Button } from '@/components/ui/button';
import checkPaymentStatus from './checkPaymentStatus';
import { OrderStatus } from '@/app/client/generated/enums';

export default function ServerReadyPoller({ sessionId }: { sessionId: string }) {
    const [orderStatus, setOrderStatus] = useState<OrderStatus | null>(null);
    const [workerJobId, setWorkerJobId] = useState<string | null>(null);
    const [networkError, setNetworkError] = useState<string | null>(null);
    const [pollingSignal, setPollingSignal] = useState(0);
    const [isRedirecting, setIsRedirecting] = useState(false);
    const redirectStartedRef = useRef(false);

    const pollerT = useTranslations('checkout.return.poller');
    const router = useRouter();

    useEffect(() => {
        let stopped = false;
        let timeoutId: number | undefined;

        const poll = async () => {
            if (stopped) return;
            try {
                setNetworkError(null);
                const { orderStatus, workerJobId } = await checkPaymentStatus(sessionId);
                if (stopped) return;

                setOrderStatus(orderStatus);

                if (orderStatus === 'PAID' && workerJobId) {
                    setWorkerJobId(workerJobId);
                    return;
                }

                if (orderStatus === 'PAYMENT_FAILED' || orderStatus === 'EXPIRED') {
                    return;
                }

                timeoutId = window.setTimeout(poll, 2000);
            } catch (e) {
                if (stopped) return;
                setNetworkError(e instanceof Error ? e.message : pollerT('unknownError'));
            }
        };

        poll();

        return () => {
            stopped = true;
            if (timeoutId !== undefined) window.clearTimeout(timeoutId);
        };
    }, [sessionId, pollerT, pollingSignal]);

    useEffect(() => {
        if (!workerJobId || orderStatus !== 'PAID') return;

        if (redirectStartedRef.current || isRedirecting) {
            return;
        }

        redirectStartedRef.current = true;
        setIsRedirecting(true);
        router.push(`/products/wait/${workerJobId}`);
    }, [workerJobId, orderStatus, router, isRedirecting]);

    const isError = orderStatus === 'PAYMENT_FAILED' || orderStatus === 'EXPIRED';

    const handleRetry = () => {
        setNetworkError(null);
        setOrderStatus(null);
        setPollingSignal((prev) => prev + 1);
    };

    return (
        <div className="relative flex min-h-screen items-center justify-center bg-linear-to-b from-background via-background to-muted/70 py-16 md:px-4">
            <div className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(circle_at_top,rgba(99,102,241,0.12),transparent_45%)]" />
            <div className="relative z-10 w-full max-w-2xl">
                <div className="rounded-3xl border border-border/60 bg-card/80 p-8 shadow-2xl backdrop-blur-md md:p-10">
                    <div className="flex flex-col items-center gap-6 text-center">
                        {!networkError && !isError ? (
                            <>
                                <span className="relative flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 text-primary">
                                    <Loader2 className="h-8 w-8 animate-spin" />
                                </span>
                                <div className="space-y-2">
                                    <h1 className="text-2xl font-semibold tracking-tight text-foreground md:text-3xl">
                                        {pollerT('waitingForPayment')}
                                    </h1>
                                    <p className="text-sm text-muted-foreground md:text-base">
                                        {pollerT('paymentProcessing')}
                                    </p>
                                </div>
                            </>
                        ) : (
                            <>
                                <span className="relative flex h-16 w-16 items-center justify-center rounded-full bg-destructive/15 text-destructive">
                                    {networkError ? (
                                        <WifiOff className="h-8 w-8" />
                                    ) : (
                                        <AlertTriangle className="h-8 w-8" />
                                    )}
                                </span>
                                <div className="space-y-2">
                                    <h1 className="text-2xl font-semibold tracking-tight text-destructive md:text-3xl">
                                        {networkError
                                            ? pollerT('networkHeadline')
                                            : pollerT('paymentFailedTitle')}
                                    </h1>
                                    <p className="text-sm text-destructive md:text-base">
                                        {networkError
                                            ? pollerT('networkSubheadline')
                                            : pollerT('paymentFailedSubtitle')}
                                    </p>
                                </div>

                                {networkError && (
                                    <div className="w-full rounded-xl border border-destructive/40 bg-destructive/10 p-4 text-left">
                                        <p className="wrap-break-word text-xs text-destructive/80">
                                            {networkError}
                                        </p>
                                    </div>
                                )}

                                <div className="flex flex-col gap-2 sm:flex-row">
                                    {networkError ? (
                                        <>
                                            <Button onClick={handleRetry}>
                                                {pollerT('retry')}
                                            </Button>
                                            <Button asChild variant="outline">
                                                <Link href="/support">
                                                    {pollerT('contactSupport')}
                                                </Link>
                                            </Button>
                                        </>
                                    ) : (
                                        <>
                                            <Button asChild>
                                                <Link href="/support">
                                                    {pollerT('contactSupport')}
                                                </Link>
                                            </Button>
                                            <Button asChild variant="outline">
                                                <Link href="/">{pollerT('returnHome')}</Link>
                                            </Button>
                                        </>
                                    )}
                                </div>
                            </>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}

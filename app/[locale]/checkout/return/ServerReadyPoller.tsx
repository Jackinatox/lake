'use client';

import { AlertTriangle, CheckCircle2, CreditCard, Loader2, WifiOff } from 'lucide-react';
import { useTranslations } from 'next-intl';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useMemo, useRef, useState } from 'react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
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
        <div className="flex min-h-screen items-center justify-center p-4">
            <Card className="w-full max-w-md">
                {!networkError && !isError ? (
                    <>
                        <CardHeader className="text-center">
                            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
                                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                            </div>
                            <CardTitle>{pollerT('waitingForPayment')}</CardTitle>
                            <CardDescription>{pollerT('paymentProcessing')}</CardDescription>
                        </CardHeader>
                    </>
                ) : (
                    <>
                        <CardHeader className="text-center">
                            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-destructive/10">
                                {networkError ? (
                                    <WifiOff className="h-8 w-8 text-destructive" />
                                ) : (
                                    <AlertTriangle className="h-8 w-8 text-destructive" />
                                )}
                            </div>
                            <CardTitle className="text-destructive">
                                {networkError
                                    ? pollerT('networkHeadline')
                                    : pollerT('paymentFailedTitle')}
                            </CardTitle>
                            <CardDescription>
                                {networkError
                                    ? pollerT('networkSubheadline')
                                    : pollerT('paymentFailedSubtitle')}
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            {networkError && (
                                <Alert variant="destructive">
                                    <AlertDescription className="break-words text-sm">
                                        {networkError}
                                    </AlertDescription>
                                </Alert>
                            )}

                            <div className="flex flex-col gap-2 sm:flex-row">
                                {networkError ? (
                                    <>
                                        <Button onClick={handleRetry} className="flex-1">
                                            {pollerT('retry')}
                                        </Button>
                                        <Button asChild variant="outline" className="flex-1">
                                            <Link href="/support">{pollerT('contactSupport')}</Link>
                                        </Button>
                                    </>
                                ) : (
                                    <>
                                        <Button asChild className="flex-1">
                                            <Link href="/support">{pollerT('contactSupport')}</Link>
                                        </Button>
                                        <Button asChild variant="outline" className="flex-1">
                                            <Link href="/">{pollerT('returnHome')}</Link>
                                        </Button>
                                    </>
                                )}
                            </div>
                        </CardContent>
                    </>
                )}
            </Card>
        </div>
    );
}

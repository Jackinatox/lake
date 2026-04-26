'use server';

import { auth } from '@/auth';
import CustomServerPaymentElements from '@/components/payments/PaymentElements';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { createPrivateMetadata, getMetadataCopy } from '@/lib/metadata';
import prisma from '@/lib/prisma';
import { orderCheckoutSearchParamsSchema } from '@/lib/validation/order';
import { ArrowLeft, Lock, ShieldCheck } from 'lucide-react';
import type { Metadata } from 'next';
import Link from 'next/link';
import { headers } from 'next/headers';
import { cache } from 'react';

const getCheckoutOrder = cache(async (userId: string, orderId: string) => {
    return prisma.gameServerOrder.findFirst({
        where: { id: orderId, userId },
        select: {
            stripeClientSecret: true,
            type: true,
            ramMB: true,
            cpuPercent: true,
            diskMB: true,
            backupCount: true,
            gameConfig: true,
            expiresAt: true,
            createdAt: true,
            creationLocationId: true,
            creationGameData: {
                select: { slug: true, name: true },
            },
            creationLocation: {
                select: { name: true },
            },
        },
    });
});

export async function generateMetadata({
    params,
    searchParams,
}: {
    params: Promise<{ locale: string }>;
    searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}): Promise<Metadata> {
    const [{ locale }, awaitedSearchParams] = await Promise.all([params, searchParams]);
    const copy = getMetadataCopy(locale);
    const parsedSearchParams = orderCheckoutSearchParamsSchema.safeParse({
        orderId: awaitedSearchParams.orderId,
    });
    const session = await auth.api.getSession({
        headers: await headers(),
    });

    if (!session?.user || !parsedSearchParams.success) {
        return createPrivateMetadata({
            title: copy.orderCheckoutTitle,
            description: copy.orderCheckoutDescription,
        });
    }

    const order = await getCheckoutOrder(session.user.id, parsedSearchParams.data.orderId);

    if (!order || !order.stripeClientSecret) {
        return createPrivateMetadata({
            title: copy.orderCheckoutTitle,
            description: copy.orderCheckoutDescription,
        });
    }

    return createPrivateMetadata({
        title: copy.checkoutOrderTitle(order.creationGameData.name, order.creationLocation?.name),
        description: copy.checkoutOrderDescription(
            order.creationGameData.name,
            order.creationLocation?.name,
        ),
    });
}

export default async function OrderCheckoutPage({
    searchParams,
}: {
    searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
    const session = await auth.api.getSession({
        headers: await headers(),
    });
    const awaitedSearchParams = await searchParams;
    const parsedSearchParams = orderCheckoutSearchParamsSchema.safeParse({
        orderId: awaitedSearchParams['orderId'],
    });

    if (!session?.user || !parsedSearchParams.success) {
        return <NotFoundComp />;
    }
    const { orderId } = parsedSearchParams.data;

    const order = await getCheckoutOrder(session.user.id, orderId);

    if (!order || !order.stripeClientSecret) {
        return <NotFoundComp />;
    }

    const durationDays = Math.round(
        (order.expiresAt.getTime() - order.createdAt.getTime()) / (1000 * 60 * 60 * 24),
    );

    let backHref = `/order/${order.creationGameData.slug}`;

    if (order.type === 'PACKAGE') {
        const matchingPackage = await prisma.package.findFirst({
            where: {
                ramMB: order.ramMB,
                cpuPercent: order.cpuPercent,
                diskMB: order.diskMB,
                enabled: true,
            },
            select: { id: true },
        });
        if (matchingPackage) {
            backHref = `/order/${order.creationGameData.slug}/package/${matchingPackage.id}?days=${durationDays}&orderId=${orderId}`;
        }
    } else if (order.type === 'NEW') {
        const cpuCores = order.cpuPercent / 100;
        const ramGb = order.ramMB / 1024;
        backHref = `/order/${order.creationGameData.slug}/setup?pf=${order.creationLocationId}&cpu=${cpuCores}&ram=${ramGb}&days=${durationDays}&orderId=${orderId}`;
    }

    return (
        <div className="md:-my-4">
            {/* Sticky top bar */}
            <div className="sticky top-0 z-10 bg-background/80 backdrop-blur-md border-b py-3">
                <div className="w-full px-4 max-w-7xl mx-auto">
                    <div className="flex items-center gap-3">
                        <Button variant="ghost" size="icon" className="shrink-0" asChild>
                            <Link href={backHref}>
                                <ArrowLeft className="h-4 w-4" />
                            </Link>
                        </Button>
                        <div className="flex-1 min-w-0">
                            <h1 className="text-base sm:text-lg font-bold leading-tight">
                                Payment
                            </h1>
                            <p className="text-xs text-muted-foreground hidden sm:block">
                                Final step — secure checkout
                            </p>
                        </div>
                        <Lock className="h-4 w-4 text-muted-foreground shrink-0" />
                    </div>

                    {/* Progress: step 3 of 3 */}
                    <div className="mt-2 flex gap-2">
                        <div className="h-1.5 flex-1 rounded bg-primary" />
                        <div className="h-1.5 flex-1 rounded bg-primary" />
                        <div className="h-1.5 flex-1 rounded bg-primary" />
                    </div>
                </div>
            </div>

            {/* Content */}
            <div className="w-full  pb-28 max-w-2xl mx-auto md:px-4">
                <CustomServerPaymentElements clientSecret={order.stripeClientSecret} />
            </div>

            {/* Sticky bottom bar */}
            <div className="sticky bottom-0 z-10 bg-background/95 backdrop-blur-md border-t p-4">
                <div className="w-full max-w-7xl mx-auto flex items-center justify-between gap-4">
                    <Button variant="outline" asChild>
                        <Link href={backHref}>
                            <ArrowLeft className="h-4 w-4 mr-2" />
                            Back
                        </Link>
                    </Button>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <ShieldCheck className="h-4 w-4 shrink-0" />
                        <span className="hidden sm:inline">256-bit SSL · Secured by Stripe</span>
                        <span className="sm:hidden">Secured by Stripe</span>
                    </div>
                </div>
            </div>
        </div>
    );
}

function NotFoundComp() {
    return (
        <div className="min-h-screen bg-background flex items-center justify-center px-4">
            <Card className="w-full max-w-md p-8 text-center">
                <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center mx-auto mb-4">
                    <ShieldCheck className="h-6 w-6 text-muted-foreground" />
                </div>
                <h2 className="text-lg font-semibold mb-2">No active checkout session</h2>
                <p className="text-sm text-muted-foreground mb-6">
                    It looks like you navigated here directly. Please start an order first.
                </p>
                <Button asChild className="w-full">
                    <Link href="/order">
                        <ArrowLeft className="h-4 w-4 mr-2" />
                        Browse Games
                    </Link>
                </Button>
            </Card>
        </div>
    );
}

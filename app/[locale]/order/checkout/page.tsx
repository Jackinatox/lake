'use server';

import { auth } from '@/auth';
import CustomServerPaymentElements from '@/components/payments/PaymentElements';
import { Button } from '@/components/ui/button';
import prisma from '@/lib/prisma';
import { orderCheckoutSearchParamsSchema } from '@/lib/validation/order';
import { ArrowLeft, Lock, ShieldCheck } from 'lucide-react';
import Link from 'next/link';
import { headers } from 'next/headers';
import { Card } from '@/components/ui/card';

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

    const order = await prisma.gameServerOrder.findFirst({
        where: { id: orderId, userId: session.user.id },
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
                select: {
                    slug: true,
                },
            },
        },
    });

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
        <div className="min-h-screen bg-background">
            <div className="max-w-2xl mx-auto md:px-4  md:py-12">
                {/* Header */}
                <div className="flex items-center gap-3 mb-8">
                    <Button variant="ghost" size="icon" className="shrink-0 rounded-full" asChild>
                        <Link href={backHref}>
                            <ArrowLeft className="h-4 w-4" />
                        </Link>
                    </Button>
                    <div>
                        <h1 className="text-xl font-semibold tracking-tight">
                            Complete your order
                        </h1>
                        <p className="text-sm text-muted-foreground mt-0.5">
                            Secure checkout powered by Stripe
                        </p>
                    </div>
                    <Lock className="h-4 w-4 text-muted-foreground ml-auto shrink-0 mr-4" />
                </div>

                {/* Payment form — no wrapper border, Stripe provides its own UI */}
                <CustomServerPaymentElements clientSecret={order.stripeClientSecret} />

                {/* Trust line */}
                <div className="mt-6 flex items-center justify-center gap-2 text-xs text-muted-foreground">
                    <ShieldCheck className="h-3.5 w-3.5" />
                    <span>256-bit SSL encryption · Payments processed by Stripe</span>
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

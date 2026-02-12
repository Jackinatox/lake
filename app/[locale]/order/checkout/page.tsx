'use server';

import CustomServerPaymentElements from '@/components/payments/PaymentElements';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import prisma from '@/lib/prisma';
import { ArrowLeft, ShieldCheck } from 'lucide-react';
import Link from 'next/link';

export default async function OrderCheckoutPage({
    searchParams,
}: {
    searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
    const awaitedSearchParams = await searchParams;
    const rawOrderId = awaitedSearchParams['orderId'];
    const orderId = Array.isArray(rawOrderId) ? rawOrderId[0] : rawOrderId || null;

    if (!orderId) {
        return NotFoundComp();
    }

    const order = await prisma.gameServerOrder.findUnique({
        where: { id: orderId },
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
        return NotFoundComp();
    }

    // Calculate duration from order dates
    const durationDays = Math.round(
        (order.expiresAt.getTime() - order.createdAt.getTime()) / (1000 * 60 * 60 * 24),
    );

    // Build back link based on order type
    let backHref = `/order/${order.creationGameData.slug}`;

    if (order.type === 'PACKAGE') {
        // Find matching package
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
        // Reverse-engineer URL params from order data
        const cpuCores = order.cpuPercent / 100;
        const ramGb = order.ramMB / 1024;
        backHref = `/order/${order.creationGameData.slug}/setup?pf=${order.creationLocationId}&cpu=${cpuCores}&ram=${ramGb}&days=${durationDays}&orderId=${orderId}`;
    }

    return (
        <div className="max-w-4xl mx-auto py-4">
            <div className="mb-6 flex items-center gap-4">
                <Button variant="ghost" size="icon" asChild>
                    <Link href={backHref}>
                        <ArrowLeft className="h-4 w-4" />
                    </Link>
                </Button>
                <div>
                    <h1 className="text-2xl md:text-3xl font-bold">Complete Payment</h1>
                    <p className="text-muted-foreground mt-1">
                        Review your order and complete the payment below.
                    </p>
                </div>
            </div>

            <Card className="p-2 md:p-6">
                <CustomServerPaymentElements clientSecret={order?.stripeClientSecret} />
            </Card>

            <div className="mt-4 flex items-center gap-2 text-sm text-muted-foreground justify-center">
                <ShieldCheck className="h-4 w-4" />
                <span>Payments are securely processed by Stripe</span>
            </div>
        </div>
    );
}

function NotFoundComp() {
    return (
        <div className="max-w-2xl mx-auto py-16 text-center">
            <Card className="p-8">
                <h2 className="text-xl font-semibold mb-2">No active checkout session</h2>
                <p className="text-muted-foreground mb-6">
                    It looks like you navigated here directly. Please start an order first.
                </p>
                <Button asChild>
                    <Link href="/order">
                        <ArrowLeft className="h-4 w-4 mr-2" />
                        Browse Games
                    </Link>
                </Button>
            </Card>
        </div>
    );
}

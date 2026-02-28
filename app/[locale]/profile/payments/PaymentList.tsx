'use server';

import { auth } from '@/auth';
import NotLoggedIn from '@/components/auth/NoAuthMessage';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import prisma from '@/lib/prisma';

import { CreditCard } from 'lucide-react';
import { PaymentItem } from './paymentItem';
import { headers } from 'next/headers';
import { getTranslations } from 'next-intl/server';
import { FreeServerSection } from './FreeServerSection';
import { Separator } from '@/components/ui/separator';

async function PaymentList() {
    const session = await auth.api.getSession({
        headers: await headers(),
    });

    if (!session) {
        return <NotLoggedIn />;
    }

    const payments = await prisma.gameServerOrder.findMany({
        where: {
            userId: session.user.id,
            status: { in: ['PAID', 'REFUNDED', 'PARTIALLY_REFUNDED'] },
        },
        include: {
            gameServer: {
                select: { ptServerId: true, status: true, type: true, id: true },
            },
            refunds: {
                select: { amount: true, status: true, isAutomatic: true, type: true },
            },
        },
        orderBy: { createdAt: 'desc' },
    });

    // Separate free server orders from paid orders
    const freeServerPayments = payments.filter(
        (pay) => pay.type === 'FREE_SERVER' || pay.gameServer?.type === 'FREE',
    );
    const paidPayments = payments.filter(
        (pay) => pay.type !== 'FREE_SERVER' && pay.gameServer?.type !== 'FREE',
    );

    const totalSpent = paidPayments.reduce((acc, pay) => acc + pay.price, 0);
    const totalRefunded = paidPayments.reduce((acc, pay) => {
        const refunded = pay.refunds
            .filter((r) => r.status === 'SUCCEEDED')
            .reduce((sum, r) => sum + r.amount, 0);
        return acc + refunded;
    }, 0);
    const t = await getTranslations('payments');

    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <CreditCard className="h-5 w-5" />
                    {t('historyTitle')}
                </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 p-2 md:p-3">
                <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                    <span className="font-medium">{t('totalSpend')}:</span>
                    <div className="text-right">
                        <span className="font-medium">{(totalSpent / 100).toFixed(2)} €</span>
                        {totalRefunded > 0 && (
                            <p className="text-xs text-muted-foreground">
                                {t('refund.totalRefunded')}: {(totalRefunded / 100).toFixed(2)} €
                            </p>
                        )}
                    </div>
                </div>

                {/* Paid payments section */}
                <div className="space-y-3">
                    {paidPayments.length === 0 && freeServerPayments.length === 0 && (
                        <div>{t('noPayments')}</div>
                    )}
                    {paidPayments.map((pay) => {
                        const refundedCents = pay.refunds
                            .filter((r) => r.status === 'SUCCEEDED')
                            .reduce((sum, r) => sum + r.amount, 0);
                        const hasUserWithdrawal = pay.refunds.some(
                            (r) =>
                                r.type === 'WITHDRAWAL' &&
                                (r.status === 'SUCCEEDED' || r.status === 'PENDING'),
                        );
                        return (
                            <PaymentItem
                                key={pay.id}
                                amount={pay.price}
                                paymentType={pay.type}
                                date={pay.createdAt}
                                receiptUrl={pay.receipt_url ?? undefined}
                                gameServerUrl={
                                    pay.gameServer?.ptServerId
                                        ? `/gameserver/${pay.gameServer.ptServerId}`
                                        : undefined
                                }
                                serverStatus={pay.gameServer?.status}
                                serverType={pay.gameServer?.type}
                                orderId={pay.id}
                                orderStatus={pay.status}
                                refundStatus={pay.refundStatus}
                                totalRefundedCents={refundedCents}
                                hasUserRefund={hasUserWithdrawal}
                            />
                        );
                    })}
                </div>

                {/* Free server section - collapsible */}
                {freeServerPayments.length > 0 && (
                    <>
                        <Separator />
                        <FreeServerSection payments={freeServerPayments} />
                    </>
                )}
            </CardContent>
        </Card>
    );
}

export default PaymentList;

'use server';

import prisma from '@/lib/prisma';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { FileX2, History } from 'lucide-react';
import { getTranslations } from 'next-intl/server';
import { Separator } from '@/components/ui/separator';
import { WithdrawableOrderItem } from './WithdrawableOrderItem';
import { RefundHistoryItem } from './RefundHistoryItem';
import { WITHDRAWAL_WINDOW_DAYS } from '@/lib/refund/refundLogic';
import Link from 'next/link';

interface WithdrawalContentProps {
    userId: string;
}

export async function WithdrawalContent({ userId }: WithdrawalContentProps) {
    const t = await getTranslations('withdrawalPage');

    // Fetch orders that could potentially be withdrawn (paid within 14 days, not free)
    const withdrawalWindowDate = new Date();
    withdrawalWindowDate.setDate(withdrawalWindowDate.getDate() - WITHDRAWAL_WINDOW_DAYS);

    const eligibleOrders = await prisma.gameServerOrder.findMany({
        where: {
            userId,
            status: { in: ['PAID', 'PARTIALLY_REFUNDED'] },
            type: { notIn: ['FREE_SERVER'] },
            createdAt: { gte: withdrawalWindowDate },
        },
        include: {
            gameServer: {
                select: { ptServerId: true, name: true, status: true, type: true },
            },
            creationGameData: { select: { name: true } },
            refunds: {
                select: {
                    id: true,
                    amount: true,
                    status: true,
                    type: true,
                    isAutomatic: true,
                    reason: true,
                    receiptNumber: true,
                    createdAt: true,
                    serverAction: true,
                },
            },
        },
        orderBy: { createdAt: 'desc' },
    });

    // Filter out orders where the user already used their withdrawal right
    const withdrawableOrders = eligibleOrders.filter((order) => {
        const hasUsedWithdrawal = order.refunds.some(
            (r) =>
                r.isAutomatic &&
                r.type === 'WITHDRAWAL' &&
                (r.status === 'SUCCEEDED' || r.status === 'PENDING'),
        );
        return !hasUsedWithdrawal && order.refundStatus !== 'FULL';
    });

    // Fetch all refunds for this user (completed, pending, failed)
    const allRefunds = await prisma.refund.findMany({
        where: {
            order: { userId },
        },
        include: {
            order: {
                select: {
                    id: true,
                    type: true,
                    price: true,
                    invoicePdfUrl: true,
                    creationGameData: { select: { name: true } },
                    gameServer: { select: { name: true, ptServerId: true } },
                },
            },
        },
        orderBy: { createdAt: 'desc' },
    });

    const totalRefunded = allRefunds
        .filter((r) => r.status === 'SUCCEEDED')
        .reduce((sum, r) => sum + r.amount, 0);

    return (
        <div className="space-y-6">
            {/* Withdrawable Orders */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <FileX2 className="h-5 w-5" />
                        {t('eligibleOrders.title')}
                    </CardTitle>
                    <p className="text-sm text-muted-foreground">
                        {t('eligibleOrders.description', { days: WITHDRAWAL_WINDOW_DAYS })}
                    </p>
                </CardHeader>
                <CardContent className="space-y-3 p-2 md:p-3">
                    {withdrawableOrders.length === 0 ? (
                        <div className="text-sm text-muted-foreground py-4 text-center">
                            {t('eligibleOrders.noOrders')}
                        </div>
                    ) : (
                        withdrawableOrders.map((order) => (
                            <WithdrawableOrderItem
                                key={order.id}
                                orderId={order.id}
                                orderType={order.type}
                                price={order.price}
                                createdAt={order.createdAt}
                                expiresAt={order.expiresAt}
                                gameName={order.creationGameData.name}
                                serverName={order.gameServer?.name ?? undefined}
                                existingRefunds={order.refunds}
                            />
                        ))
                    )}
                </CardContent>
            </Card>

            {/* Refund History */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <History className="h-5 w-5" />
                        {t('history.title')}
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3 p-2 md:p-3">
                    {totalRefunded > 0 && (
                        <>
                            <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                                <span className="font-medium text-sm">
                                    {t('history.totalRefunded')}:
                                </span>
                                <span className="font-medium text-sm">
                                    {(totalRefunded / 100).toFixed(2)} €
                                </span>
                            </div>
                            <Separator />
                        </>
                    )}

                    {allRefunds.length === 0 ? (
                        <div className="text-sm text-muted-foreground py-4 text-center">
                            {t('history.noRefunds')}
                        </div>
                    ) : (
                        allRefunds.map((refund) => (
                            <RefundHistoryItem
                                key={refund.id}
                                refundId={refund.id}
                                amount={refund.amount}
                                status={refund.status}
                                type={refund.type}
                                reason={refund.reason}
                                receiptNumber={refund.receiptNumber}
                                serverAction={refund.serverAction}
                                createdAt={refund.createdAt}
                                orderId={refund.order.id}
                                orderType={refund.order.type}
                                originalPrice={refund.order.price}
                                gameName={refund.order.creationGameData.name}
                                serverName={refund.order.gameServer?.name ?? undefined}
                                chargeReceiptUrl={refund.order.invoicePdfUrl ?? undefined}
                            />
                        ))
                    )}
                </CardContent>
            </Card>

            {/* Legal info */}
            <div className="text-xs text-muted-foreground space-y-1 px-1">
                <p>{t('legalNote')}</p>
                <p>
                    {t('supportNote')}{' '}
                    <Link href="/support" className="underline hover:text-foreground">
                        {t('supportLink')}
                    </Link>
                </p>
            </div>
        </div>
    );
}

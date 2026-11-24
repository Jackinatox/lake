import { auth } from '@/auth';
import NotLoggedIn from '@/components/auth/NoAuthMessage';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import prisma from '@/lib/prisma';

import { CreditCard } from 'lucide-react';
import { ServerPaymentGroups } from './ServerPaymentGroups';
import { PaymentRow } from './paymentShared';
import { headers } from 'next/headers';
import { getTranslations } from 'next-intl/server';
import { Euro } from '@/components/Euro';
import { FreeServerSection } from './FreeServerSection';
import { Separator } from '@/components/ui/separator';
import { hasGameIcon } from '@/lib/gameIcons';

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
                select: {
                    ptServerId: true,
                    status: true,
                    type: true,
                    id: true,
                    name: true,
                    cpuPercent: true,
                    ramMB: true,
                    expires: true,
                    gameData: { select: { name: true, slug: true } },
                },
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

    const toRow = (pay: (typeof payments)[number]): PaymentRow => ({
        amount: pay.price,
        paymentType: pay.type,
        date: pay.paidAt ?? pay.createdAt,
        receiptUrl: pay.invoicePdfUrl ?? undefined,
        gameServerId: pay.gameServer?.id,
        gameServerUrl: pay.gameServer?.ptServerId
            ? `/gameserver/${pay.gameServer.ptServerId}`
            : undefined,
        serverName: pay.gameServer?.name,
        serverStatus: pay.gameServer?.status,
        serverType: pay.gameServer?.type,
        serverInfo: pay.gameServer
            ? {
                  gameName: pay.gameServer.gameData.name,
                  // Only games with drawn art get an icon (docs/game-images.md)
                  gameIconSlug: hasGameIcon(pay.gameServer.gameData.slug)
                      ? pay.gameServer.gameData.slug
                      : null,
                  cpuPercent: pay.gameServer.cpuPercent,
                  ramMB: pay.gameServer.ramMB,
                  expires: pay.gameServer.expires,
              }
            : undefined,
        orderId: pay.id,
        orderStatus: pay.status,
        refundStatus: pay.refundStatus,
        totalRefundedCents: pay.refunds
            .filter((r) => r.status === 'SUCCEEDED')
            .reduce((sum, r) => sum + r.amount, 0),
        hasUserRefund: pay.refunds.some(
            (r) => r.type === 'WITHDRAWAL' && (r.status === 'SUCCEEDED' || r.status === 'PENDING'),
        ),
    });
    const paidRows = paidPayments.map(toRow);
    const freeRows = freeServerPayments.map(toRow);

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
                        <span className="font-medium">
                            <Euro cents={totalSpent} />
                        </span>
                        {totalRefunded > 0 && (
                            <p className="text-xs text-muted-foreground">
                                {t('refund.totalRefunded')}: <Euro cents={totalRefunded} />
                            </p>
                        )}
                    </div>
                </div>

                {/* Paid payments, grouped per server */}
                {paidPayments.length === 0 && freeServerPayments.length === 0 && (
                    <div>{t('noPayments')}</div>
                )}
                <ServerPaymentGroups rows={paidRows} />

                {/* Free server section - collapsible */}
                {freeServerPayments.length > 0 && (
                    <>
                        <Separator />
                        <FreeServerSection rows={freeRows} />
                    </>
                )}
            </CardContent>
        </Card>
    );
}

export default PaymentList;

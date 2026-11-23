'use client';

import { Button } from '@/components/ui/button';
import { RefundRequestButton } from '@/components/payments/RefundRequestButton';
import { Receipt } from 'lucide-react';
import { useLocale, useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';
import { Euro } from '@/components/Euro';
import { ThemeImage } from '@/components/ui/theme-image';
import { formatVCoresFromPercent } from '@/lib/GlobalFunctions/formatVCores';
import {
    formatOrderDate,
    getOrderRefundState,
    getServerState,
    PaymentRow,
    ServerButton,
} from './paymentShared';

// Mobile: type + price, date below, buttons in a full-width row.
// md+: one line per order with fixed columns (date | type + refund state | price | actions),
// so dates, prices and buttons line up within a group and across groups.
// Receipt is always the last button, so it sits at the same spot on every row and Withdraw
// (only on some orders) appears next to it.
const ROW_GRID =
    'grid grid-cols-[minmax(0,1fr)_auto] items-center gap-x-3 gap-y-1 md:grid-cols-[5.5rem_minmax(0,1fr)_5.5rem_14.5rem] md:gap-y-0';
const ROW_BUTTON = 'h-8 flex-1 basis-0 gap-1.5 px-2 text-xs md:h-7 md:w-[7rem] md:flex-none';
const ROW_ICON = 'h-3.5 w-3.5 shrink-0';

/**
 * Payment history: one card per server, its orders listed inside (newest first).
 * Expects `rows` sorted newest first; groups keep that order by their newest order.
 */
export function ServerPaymentGroups({ rows }: { rows: PaymentRow[] }) {
    const groups = new Map<string, PaymentRow[]>();
    for (const row of rows) {
        // Orders without a server stay on their own
        const key = row.gameServerId ?? `order:${row.orderId}`;
        groups.set(key, [...(groups.get(key) ?? []), row]);
    }

    return (
        <div className="space-y-3">
            {[...groups.entries()].map(([key, orders]) => (
                <ServerGroup key={key} orders={orders} />
            ))}
        </div>
    );
}

function ServerGroup({ orders }: { orders: PaymentRow[] }) {
    const t = useTranslations('payments');
    const locale = useLocale();
    const server = orders[0];
    const info = server.serverInfo;
    const serverState = getServerState(server.serverStatus);
    const isDeleted = server.serverStatus === 'DELETED';

    // Expired servers name the date in the state; running ones get "runs until" in the specs
    const stateLabel =
        server.serverStatus === 'EXPIRED' && info
            ? t('serverState.expiredOn', { date: formatOrderDate(info.expires, locale) })
            : serverState.labelKey && t(serverState.labelKey);

    const hardware = info
        ? [
              info.gameName,
              formatVCoresFromPercent(info.cpuPercent),
              t('serverState.ram', {
                  gb: new Intl.NumberFormat(locale, { maximumFractionDigits: 1 }).format(
                      info.ramMB / 1024,
                  ),
              }),
          ].join(' · ')
        : null;
    const runsUntil =
        info && !isDeleted && server.serverStatus !== 'EXPIRED'
            ? t('serverState.runsUntil', { date: formatOrderDate(info.expires, locale) })
            : null;

    return (
        <div className="overflow-hidden rounded-lg border">
            {/* Mobile: the specs get their own full-width block under name + button, split
                into a hardware line and a date line, so nothing wraps mid-list.
                md+: specs sit as one line under the name, the button on the right. */}
            <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-x-3 gap-y-2 border-b bg-muted/40 px-3 py-2.5">
                <div className="flex min-w-0 items-center gap-2.5">
                    {info?.gameIconSlug && (
                        <ThemeImage
                            src={`games/icons/${info.gameIconSlug}.webp`}
                            alt=""
                            width={28}
                            height={28}
                            className="h-7 w-7 shrink-0 rounded"
                        />
                    )}
                    <div className="min-w-0">
                        <div className="flex min-w-0 items-baseline gap-2">
                            <p className="truncate font-medium">
                                {server.serverName ?? t(`orderType.${server.paymentType}`)}
                            </p>
                            {stateLabel && (
                                <span className={`shrink-0 text-xs ${serverState.color}`}>
                                    {stateLabel}
                                </span>
                            )}
                        </div>
                        {hardware && (
                            <p className="hidden truncate text-xs text-muted-foreground md:block">
                                {hardware}
                                {runsUntil && <> · {runsUntil}</>}
                            </p>
                        )}
                    </div>
                </div>
                <ServerButton
                    gameServerUrl={server.gameServerUrl}
                    serverStatus={server.serverStatus}
                    className="h-8 shrink-0 gap-1.5 px-3 text-xs"
                    iconClass={ROW_ICON}
                />
                {hardware && (
                    <div className="col-span-2 space-y-0.5 text-xs text-muted-foreground md:hidden">
                        <p className="truncate">{hardware}</p>
                        {runsUntil && <p>{runsUntil}</p>}
                    </div>
                )}
            </div>
            <div className="divide-y">
                {orders.map((order) => (
                    <OrderRow key={order.orderId} order={order} />
                ))}
            </div>
        </div>
    );
}

function OrderRow({ order }: { order: PaymentRow }) {
    const t = useTranslations('payments');
    const locale = useLocale();
    const { isFreeServer, isRefunded, canRequestRefund, refundLabelKey } =
        getOrderRefundState(order);
    const refundedCents = order.totalRefundedCents ?? 0;

    return (
        <div className={`${ROW_GRID} px-3 py-3 text-sm md:py-2 ${isRefunded ? 'bg-muted/30' : ''}`}>
            <span className="col-start-1 row-start-2 text-xs tabular-nums text-muted-foreground md:row-start-1 md:text-sm">
                {formatOrderDate(order.date, locale)}
            </span>

            <div className="col-start-1 row-start-1 min-w-0 truncate md:col-start-2">
                {/* Free orders only live in the "free servers" section, the type adds nothing */}
                {!isFreeServer && t(`orderType.${order.paymentType}`)}
                {refundLabelKey && (
                    <span
                        className={`ml-2 text-xs font-medium ${
                            isRefunded ? 'text-destructive' : 'text-orange-600 dark:text-orange-400'
                        }`}
                    >
                        {t(refundLabelKey)}
                        {refundedCents > 0 && (
                            <>
                                {' '}
                                <Euro cents={refundedCents} />
                            </>
                        )}
                    </span>
                )}
            </div>

            <span
                className={`col-start-2 row-start-1 text-right font-medium tabular-nums md:col-start-3 ${
                    isRefunded ? 'text-muted-foreground line-through' : ''
                }`}
            >
                {!isFreeServer && <Euro cents={order.amount} />}
            </span>

            {!isFreeServer && (
                <div className="col-span-2 row-start-3 mt-2 flex gap-2 md:col-span-1 md:col-start-4 md:row-start-1 md:mt-0 md:justify-end">
                    {canRequestRefund && order.orderId && (
                        <RefundRequestButton
                            orderId={order.orderId}
                            orderAmount={order.amount}
                            orderType={order.paymentType}
                            className={ROW_BUTTON}
                        />
                    )}
                    {order.receiptUrl ? (
                        <Button variant="outline" size="sm" className={ROW_BUTTON} asChild>
                            <Link
                                href={order.receiptUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                title={t('viewReceipt')}
                            >
                                <Receipt className={ROW_ICON} />
                                {t('receipt')}
                            </Link>
                        </Button>
                    ) : (
                        <Button
                            variant="outline"
                            size="sm"
                            className={ROW_BUTTON}
                            disabled
                            title={t('noReceipt')}
                        >
                            <Receipt className={ROW_ICON} />
                            {t('receipt')}
                        </Button>
                    )}
                </div>
            )}
        </div>
    );
}

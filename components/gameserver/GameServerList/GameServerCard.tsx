'use client';

import { Card, CardContent } from '@/components/ui/card';
import { ThemeImage } from '@/components/ui/theme-image';
import { ClientServer } from '@/models/prisma';
import { AlertTriangle, Calendar, Cpu, HardDrive, MemoryStick, ShieldAlert } from 'lucide-react';
import Link from 'next/link';
import GameServerStatus from './GameServerStatus';
import { useTranslations } from 'next-intl';
import { formatBytes, formatMBToGiB } from '@/lib/GlobalFunctions/ptResourceLogic';
import { formatVCoresFromPercent } from '@/lib/GlobalFunctions/formatVCores';
import formatDate from '@/lib/formatDate';
import { Button } from '@/components/ui/button';
import { getActiveSuspension, isSuspensionProcessing } from '@/lib/gameserver/suspension';

type ExpirationUrgency = 'ok' | 'warn' | 'urgent' | 'expired';

function getExpiration(date: Date): { text: string; urgency: ExpirationUrgency } {
    const diffDays = Math.ceil((date.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
    const text = formatDate(date, true);

    if (diffDays < 0) return { text: 'Expired', urgency: 'expired' };
    if (diffDays <= 7) return { text, urgency: 'urgent' };
    if (diffDays <= 30) return { text, urgency: 'warn' };
    return { text, urgency: 'ok' };
}

const expiryColor: Record<ExpirationUrgency, string> = {
    ok: 'text-slate-500 dark:text-slate-400',
    warn: 'text-yellow-600 dark:text-yellow-400',
    urgent: 'text-orange-600 dark:text-orange-400',
    expired: 'text-red-600 dark:text-red-400',
};

function ServerCard({
    server,
    apiKey,
    isFreeServer,
}: {
    server: ClientServer;
    apiKey: string;
    isFreeServer: boolean;
}) {
    const t = useTranslations('gameserver');
    const tSuspended = useTranslations('ServerSuspended');
    const isExpired = server.status === 'EXPIRED';
    const isCreationFailed = server.status === 'CREATION_FAILED';
    const suspension = getActiveSuspension(server);
    const suspendedUntil = suspension ? formatDate(suspension.expiresAt, true) : null;
    // Grace window: the suspension has run out but the worker has not released or deleted the
    // server yet, so the end date is in the past and must not be shown as a deadline.
    const suspensionProcessing = isSuspensionProcessing(suspension);
    const supportHref = suspension
        ? `/support?category=SUSPENSION&subject=${encodeURIComponent(
              tSuspended('ticketSubject', { serverName: server.name }),
          )}`
        : null;

    const expiration = isExpired
        ? { text: 'Expired', urgency: 'expired' as ExpirationUrgency }
        : getExpiration(server.expires);

    // TODO: Use value from KeyValue Table
    const deletionDate = isExpired
        ? new Date(new Date(server.expires).getTime() + 90 * 24 * 60 * 60 * 1000)
        : null;
    const deletionDateFormatted = deletionDate ? formatDate(deletionDate) : null;

    const inner = (
        <CardContent className="p-3 sm:p-4">
            <div className="flex gap-3">
                {/* Game icon */}
                <div className="shrink-0">
                    <ThemeImage
                        src={`/images/games/icons/${server.gameData.name.toLowerCase()}.webp`}
                        alt={server.gameData.name}
                        width={48}
                        height={48}
                        className="w-11 h-11 rounded-lg object-cover"
                        priority
                    />
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0 flex flex-col gap-1.5">
                    {/* Name + status */}
                    <div className="flex items-center justify-between gap-2">
                        <h3 className="font-semibold text-base text-slate-900 dark:text-slate-100 truncate leading-snug min-w-0">
                            {server.name}
                        </h3>
                        <div className="shrink-0">
                            <GameServerStatus apiKey={apiKey} server={server} />
                        </div>
                    </div>

                    {/* Suspension notice */}
                    {suspension && suspendedUntil && (
                        <div className="flex flex-col gap-1 text-xs text-red-600 dark:text-red-400">
                            <span className="flex items-center gap-1.5">
                                <ShieldAlert className="w-3.5 h-3.5 shrink-0" />
                                <span>
                                    {suspensionProcessing
                                        ? tSuspended(
                                              suspension.deleteAfterExpiry
                                                  ? 'processingDeletion'
                                                  : 'processing',
                                          )
                                        : tSuspended('suspendedUntil', { date: suspendedUntil })}
                                </span>
                            </span>
                            <span className="text-slate-600 dark:text-slate-300">
                                {tSuspended('reasonLabel')}: {suspension.reason}
                            </span>
                            {suspension.deleteAfterExpiry && !suspensionProcessing && (
                                <span className="font-medium">
                                    {tSuspended('deletionWarning', { date: suspendedUntil })}
                                </span>
                            )}
                        </div>
                    )}

                    {/* Creation failed notice */}
                    {isCreationFailed && (
                        <div className="flex items-center gap-1.5 text-xs text-red-600 dark:text-red-400">
                            <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                            <span>
                                {t('creationFailed')} — {t('creationFailedMessage')}
                            </span>
                        </div>
                    )}

                    {/* Specs */}
                    <div className="flex items-center gap-3 text-xs text-slate-500 dark:text-slate-400">
                        <span className="flex items-center gap-1">
                            <Cpu className="w-3.5 h-3.5 text-blue-400" />
                            {formatVCoresFromPercent(server.cpuPercent)}
                        </span>
                        <span className="flex items-center gap-1">
                            <MemoryStick className="w-3.5 h-3.5 text-purple-400" />
                            {formatMBToGiB(server.ramMB)}
                        </span>
                        <span className="flex items-center gap-1">
                            <HardDrive className="w-3.5 h-3.5 text-emerald-400" />
                            {formatBytes(server.diskMB * 1024 * 1024)}
                        </span>
                    </div>

                    {/* Bottom row: expiration + free label */}
                    <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-1 text-xs min-w-0">
                            <Calendar className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                            <span className={expiryColor[expiration.urgency]}>
                                {expiration.text}
                            </span>
                            {deletionDateFormatted && (
                                <span className="text-slate-400 dark:text-slate-500 truncate">
                                    &nbsp;· {t('willBeDeleted', { date: deletionDateFormatted })}
                                </span>
                            )}
                        </div>
                        {suspension && supportHref ? (
                            <Button
                                asChild
                                variant="outline"
                                size="sm"
                                className="h-7 shrink-0 text-xs"
                            >
                                <Link href={supportHref}>{tSuspended('contactSupport')}</Link>
                            </Button>
                        ) : (
                            server.type === 'FREE' && (
                                <span className="text-xs text-emerald-600 dark:text-emerald-400 font-medium shrink-0">
                                    {t('freeServer')}
                                </span>
                            )
                        )}
                    </div>
                </div>
            </div>
        </CardContent>
    );

    return (
        <Card
            className={`group transition-all duration-200 ${
                isCreationFailed || suspension
                    ? 'border-red-400/60 dark:border-red-600/60 bg-red-50/50 dark:bg-red-950/20'
                    : 'hover:shadow-md hover:border-slate-300 dark:hover:border-slate-600'
            }`}
        >
            {isCreationFailed || suspension ? (
                inner
            ) : (
                <Link
                    href={`/gameserver/${server.ptServerId}${isExpired ? `/upgrade${isFreeServer ? '' : '?extend=30'}` : ''}`}
                >
                    {inner}
                </Link>
            )}
        </Card>
    );
}

export { ServerCard };

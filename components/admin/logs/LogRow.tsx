'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ChevronRight, Filter } from 'lucide-react';
import { LogLevel } from '@/app/client/generated/enums';
import { ApplicationLogWithRelations } from '@/models/prisma';
import { cn } from '@/lib/utils';
import { getUserDisplayName } from '@/lib/auth/getUserDisplayName';
import { useTranslations } from 'next-intl';

type LogRowProps = {
    log: ApplicationLogWithRelations;
    onFilterUser: (userId: string) => void;
    onFilterServer: (serverId: string, ownerId: string | null) => void;
};

/** Text + accent colours per level. No badges: the level is just coloured text. */
const LEVEL_STYLES: Record<LogLevel, { text: string; accent: string; row?: string }> = {
    TRACE: { text: 'text-muted-foreground', accent: 'border-l-muted-foreground/30' },
    INFO: { text: 'text-sky-600 dark:text-sky-400', accent: 'border-l-sky-500/70' },
    WARN: { text: 'text-amber-600 dark:text-amber-400', accent: 'border-l-amber-500' },
    ERROR: { text: 'text-red-600 dark:text-red-400', accent: 'border-l-red-500' },
    FATAL: {
        text: 'text-red-700 dark:text-red-300',
        accent: 'border-l-red-700',
        row: 'bg-red-500/5',
    },
};

const TIME_FORMAT = new Intl.DateTimeFormat('de-DE', {
    day: '2-digit',
    month: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
});

function formatLogTime(date: Date) {
    // "18.08., 14:32:07" -> "18.08. 14:32:07"
    return TIME_FORMAT.format(new Date(date)).replace(',', '');
}

/** One clickable label plus a funnel button that filters the log list in place. */
function ContextLink({
    label,
    href,
    linkTitle,
    filterTitle,
    onFilter,
}: {
    label: string;
    href: string;
    linkTitle: string;
    filterTitle: string;
    onFilter: () => void;
}) {
    return (
        <span className="flex min-w-0 items-center gap-1">
            <button
                type="button"
                title={filterTitle}
                aria-label={filterTitle}
                onClick={(e) => {
                    e.stopPropagation();
                    onFilter();
                }}
                className="shrink-0 text-muted-foreground opacity-0 transition-opacity hover:text-foreground focus-visible:opacity-100 group-hover:opacity-100"
            >
                <Filter className="h-3 w-3" />
            </button>
            <Link
                href={href}
                title={linkTitle}
                onClick={(e) => e.stopPropagation()}
                className="truncate text-muted-foreground underline-offset-2 hover:text-foreground hover:underline"
            >
                {label}
            </Link>
        </span>
    );
}

function DetailRow({ label, children }: { label: string; children: React.ReactNode }) {
    return (
        <div className="flex gap-2">
            <span className="w-24 shrink-0 text-muted-foreground">{label}</span>
            <span className="min-w-0 break-all font-mono">{children}</span>
        </div>
    );
}

export default function LogRow({ log, onFilterUser, onFilterServer }: LogRowProps) {
    const [expanded, setExpanded] = useState(false);
    const t = useTranslations('adminLogs.entry');

    const style = LEVEL_STYLES[log.level] ?? LEVEL_STYLES.TRACE;
    const server = log.gameServer;
    const serverOwnerId = server?.userId ?? log.userId ?? null;

    const serverHref = server
        ? `/admin/gameservers?${new URLSearchParams({
              ...(serverOwnerId ? { userId: serverOwnerId } : {}),
              serverId: server.id,
          }).toString()}`
        : '';

    return (
        <div
            className={cn('group border-l-2 border-b border-b-border/50', style.accent, style.row)}
        >
            <div
                role="button"
                tabIndex={0}
                aria-expanded={expanded}
                onClick={() => setExpanded((value) => !value)}
                onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        setExpanded((value) => !value);
                    }
                }}
                className="flex h-7 cursor-pointer items-center gap-2 px-1.5 text-xs hover:bg-muted/60 md:gap-3"
            >
                <ChevronRight
                    className={cn(
                        'h-3 w-3 shrink-0 text-muted-foreground transition-transform',
                        expanded && 'rotate-90',
                    )}
                />
                <time
                    dateTime={new Date(log.createdAt).toISOString()}
                    title={new Date(log.createdAt).toLocaleString()}
                    className="w-[110px] shrink-0 whitespace-nowrap font-mono text-[11px] tabular-nums text-muted-foreground"
                >
                    {formatLogTime(log.createdAt)}
                </time>
                <span
                    className={cn(
                        'w-10 shrink-0 font-mono text-[11px] font-semibold uppercase',
                        style.text,
                    )}
                >
                    {log.level}
                </span>
                <span className="hidden w-32 shrink-0 truncate text-[11px] text-muted-foreground lg:block">
                    {log.type.replace(/_/g, ' ').toLowerCase()}
                </span>
                <span className="min-w-0 flex-1 truncate" title={log.message}>
                    {log.message}
                </span>
                <span className="hidden w-36 shrink-0 text-[11px] md:block">
                    {log.user && (
                        <ContextLink
                            label={getUserDisplayName(log.user)}
                            href={`/admin/gameservers?userId=${log.user.id}`}
                            linkTitle={t('openUserInAdmin')}
                            filterTitle={t('filterByUser')}
                            onFilter={() => onFilterUser(log.user!.id)}
                        />
                    )}
                </span>
                <span className="hidden w-36 shrink-0 text-[11px] md:block">
                    {server && (
                        <ContextLink
                            label={server.name}
                            href={serverHref}
                            linkTitle={t('openServerInAdmin')}
                            filterTitle={t('filterByServer')}
                            onFilter={() => onFilterServer(server.id, serverOwnerId)}
                        />
                    )}
                </span>
            </div>

            {expanded && (
                <div className="space-y-2 border-t bg-muted/40 px-3 py-2 text-[11px] md:px-8">
                    <div className="grid gap-x-8 gap-y-1 md:grid-cols-2">
                        <DetailRow label={t('time')}>
                            {new Date(log.createdAt).toLocaleString()}
                        </DetailRow>
                        <DetailRow label={t('logId')}>{log.id}</DetailRow>
                        {(log.method || log.path) && (
                            <DetailRow label={t('request')}>
                                {[log.method, log.path].filter(Boolean).join(' ')}
                            </DetailRow>
                        )}
                        {log.instanceId && (
                            <DetailRow label={t('instance')}>{log.instanceId}</DetailRow>
                        )}
                        {log.ipAddress && <DetailRow label={t('ip')}>{log.ipAddress}</DetailRow>}
                        {log.userAgent && (
                            <DetailRow label={t('userAgent')}>{log.userAgent}</DetailRow>
                        )}
                        {log.user && (
                            <DetailRow label={t('user')}>
                                <Link
                                    href={`/admin/gameservers?userId=${log.user.id}`}
                                    className="underline underline-offset-2"
                                >
                                    {log.user.email}
                                </Link>
                            </DetailRow>
                        )}
                        {server && (
                            <DetailRow label={t('server')}>
                                <Link href={serverHref} className="underline underline-offset-2">
                                    {server.name}
                                </Link>{' '}
                                <span className="text-muted-foreground">({server.id})</span>
                            </DetailRow>
                        )}
                    </div>

                    {/* Full message, in case the row truncated it */}
                    <div className="whitespace-pre-wrap break-words font-mono">{log.message}</div>

                    {log.details != null && (
                        <pre className="max-h-96 overflow-auto rounded border bg-background p-2 font-mono text-[11px] leading-snug">
                            {JSON.stringify(log.details, null, 2)}
                        </pre>
                    )}
                </div>
            )}
        </div>
    );
}

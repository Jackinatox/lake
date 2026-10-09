'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
    Ban,
    Check,
    ChevronRight,
    Copy,
    ExternalLink,
    Filter,
    PlugZap,
    ScrollText,
    Trash2,
    TriangleAlert,
    Undo2,
} from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import { formatDate } from '@/lib/formatDate';
import { getUserDisplayName } from '@/lib/auth/getUserDisplayName';
import { getActiveSuspension, isSuspensionProcessing } from '@/lib/gameserver/suspension';
import {
    ERROR_WINDOW_HOURS,
    EXPIRY_WARNING_HOURS,
    formatCents,
    formatRelative,
    formatThreads,
} from '@/lib/gameserver/adminFleet';
import {
    panelAdminServerUrl,
    panelAdminUserUrl,
    panelServerUrl,
} from '@/lib/Pterodactyl/panelUrls';
import { GameServerAdminRow } from '@/models/prisma';
import { AdminServerActionsMenu } from './AdminServerActionsMenu';
import { STATUS_META, TYPE_META, expiryTone } from './presentation';

type ServerRowProps = {
    server: GameServerAdminRow;
    errorCount: number;
    selected: boolean;
    onSelect: (checked: boolean) => void;
    onFilterUser: (userId: string) => void;
    onEdit: () => void;
    onChanged: () => void;
    suspensionDefaultReason: string;
};

/** Click-to-copy with a brief check mark, shared by both copy controls below. */
function useCopy(value: string) {
    const [copied, setCopied] = useState(false);

    const copy = (event: React.MouseEvent) => {
        // Never let a copy toggle the row it sits in
        event.stopPropagation();
        navigator.clipboard.writeText(value);
        setCopied(true);
        setTimeout(() => setCopied(false), 1200);
    };

    return { copied, copy };
}

/** The value *is* the button — for bare ids, where there is nothing else to click. */
function CopyValue({ value, className }: { value: string; className?: string }) {
    const { copied, copy } = useCopy(value);

    return (
        <button
            type="button"
            onClick={copy}
            title="Copy"
            className={cn(
                'group/copy flex min-w-0 items-center gap-1 font-mono hover:text-foreground',
                className,
            )}
        >
            <span className="truncate">{value}</span>
            {copied ? (
                <Check className="h-3 w-3 shrink-0 text-emerald-500" />
            ) : (
                <Copy className="h-3 w-3 shrink-0 opacity-60 group-hover/copy:opacity-100" />
            )}
        </button>
    );
}

/** Icon only — for values that already carry their own action, such as a link. */
function CopyButton({ value, title }: { value: string; title: string }) {
    const { copied, copy } = useCopy(value);

    return (
        <button
            type="button"
            onClick={copy}
            title={title}
            aria-label={title}
            className="shrink-0 text-muted-foreground opacity-60 transition-opacity hover:text-foreground hover:opacity-100"
        >
            {copied ? <Check className="h-3 w-3 text-emerald-500" /> : <Copy className="h-3 w-3" />}
        </button>
    );
}

function Detail({ label, children }: { label: string; children: React.ReactNode }) {
    return (
        <div className="flex gap-2">
            <span className="w-24 shrink-0 text-muted-foreground">{label}</span>
            <span className="min-w-0 break-all">{children}</span>
        </div>
    );
}

/** Small icon link that never toggles the row it sits in. */
function IconLink({
    href,
    title,
    children,
    tone,
}: {
    href: string;
    title: string;
    children: React.ReactNode;
    tone?: string;
}) {
    return (
        <Tooltip>
            <TooltipTrigger asChild>
                <a
                    href={href}
                    target="_blank"
                    rel="noreferrer"
                    onClick={(event) => event.stopPropagation()}
                    className={cn(
                        'text-muted-foreground transition-colors hover:text-foreground',
                        tone,
                    )}
                >
                    {children}
                </a>
            </TooltipTrigger>
            <TooltipContent>{title}</TooltipContent>
        </Tooltip>
    );
}

export default function ServerRow({
    server,
    errorCount,
    selected,
    onSelect,
    onFilterUser,
    onEdit,
    onChanged,
    suspensionDefaultReason,
}: ServerRowProps) {
    const [expanded, setExpanded] = useState(false);

    const status = STATUS_META[server.status];
    const type = TYPE_META[server.type];
    const suspension = getActiveSuspension(server);
    const ptPanel = panelServerUrl(server.ptServerId);
    const ptAdmin = panelAdminServerUrl(server.ptAdminId);
    const ptUser = panelAdminUserUrl(server.user.ptUserId);
    const missingPtLink =
        (server.status === 'ACTIVE' || server.status === 'CREATED') &&
        (!server.ptServerId || !server.ptAdminId);

    const logsHref = `/admin/logs?${new URLSearchParams({
        userId: server.userId,
        serverId: server.id,
        range: '7d',
    })}`;
    const errorLogsHref = `/admin/logs?${new URLSearchParams({
        userId: server.userId,
        serverId: server.id,
        level: 'ERROR',
        range: '1d',
    })}`;

    return (
        <TooltipProvider>
            <div
                className={cn(
                    'group border-b border-b-border/50 border-l-2',
                    suspension ? 'border-l-red-500' : 'border-l-transparent',
                    server.status === 'CREATION_FAILED' && 'bg-red-500/5',
                    selected && 'bg-muted/50',
                )}
            >
                <div
                    role="button"
                    tabIndex={0}
                    aria-expanded={expanded}
                    onClick={() => setExpanded((value) => !value)}
                    onKeyDown={(event) => {
                        if (event.key === 'Enter' || event.key === ' ') {
                            event.preventDefault();
                            setExpanded((value) => !value);
                        }
                    }}
                    className="flex h-8 cursor-pointer items-center gap-2 px-1.5 text-xs hover:bg-muted/60 md:gap-3"
                >
                    <input
                        type="checkbox"
                        checked={selected}
                        onClick={(event) => event.stopPropagation()}
                        onChange={(event) => onSelect(event.target.checked)}
                        className="h-3 w-3 shrink-0"
                        aria-label={`Select ${server.name}`}
                    />
                    <ChevronRight
                        className={cn(
                            'h-3 w-3 shrink-0 text-muted-foreground transition-transform',
                            expanded && 'rotate-90',
                        )}
                    />

                    <Tooltip>
                        <TooltipTrigger asChild>
                            <span
                                className={cn('h-2 w-2 shrink-0 rounded-full', status.dot)}
                                aria-label={status.label}
                            />
                        </TooltipTrigger>
                        <TooltipContent>{status.label}</TooltipContent>
                    </Tooltip>

                    <span className="flex min-w-0 flex-1 items-center gap-1.5">
                        <span className="truncate" title={server.name}>
                            {server.name}
                        </span>
                        {server.type === 'FREE' && (
                            <span className="shrink-0 text-[10px] uppercase tracking-wide text-emerald-600 dark:text-emerald-400">
                                free
                            </span>
                        )}
                        {suspension && (
                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <Ban className="h-3.5 w-3.5 shrink-0 text-red-500" />
                                </TooltipTrigger>
                                <TooltipContent className="max-w-sm">
                                    <span className="block font-medium">
                                        Suspended · {formatDate(suspension.expiresAt, true)}
                                        {isSuspensionProcessing(suspension) && ' (processing)'}
                                    </span>
                                    <span className="block">{suspension.reason}</span>
                                </TooltipContent>
                            </Tooltip>
                        )}
                        {missingPtLink && (
                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <PlugZap className="h-3.5 w-3.5 shrink-0 text-amber-500" />
                                </TooltipTrigger>
                                <TooltipContent>
                                    Live server without a Pterodactyl id
                                </TooltipContent>
                            </Tooltip>
                        )}
                        {errorCount > 0 && (
                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <Link
                                        href={errorLogsHref}
                                        onClick={(event) => event.stopPropagation()}
                                        className="flex shrink-0 items-center gap-0.5 rounded-full border border-red-500/40 px-1 font-mono text-[10px] text-red-600 dark:text-red-400"
                                    >
                                        <TriangleAlert className="h-2.5 w-2.5" />
                                        {errorCount}
                                    </Link>
                                </TooltipTrigger>
                                <TooltipContent>
                                    {errorCount} error/fatal log entries in the last{' '}
                                    {ERROR_WINDOW_HOURS} h — open them
                                </TooltipContent>
                            </Tooltip>
                        )}
                    </span>

                    {/* Owner: funnel filters this list, the name opens the owner's other servers */}
                    <span className="hidden w-36 shrink-0 items-center gap-1 md:flex">
                        <button
                            type="button"
                            title="Filter by this owner"
                            onClick={(event) => {
                                event.stopPropagation();
                                onFilterUser(server.userId);
                            }}
                            className="shrink-0 text-muted-foreground opacity-0 transition-opacity hover:text-foreground focus-visible:opacity-100 group-hover:opacity-100"
                        >
                            <Filter className="h-3 w-3" />
                        </button>
                        <span className="truncate text-muted-foreground" title={server.user.email}>
                            {getUserDisplayName(server.user)}
                        </span>
                        <CopyButton value={getUserDisplayName(server.user)} title="Copy username" />
                    </span>

                    <span className="hidden w-20 shrink-0 truncate text-muted-foreground xl:block">
                        {server.gameData.name}
                    </span>
                    <span className="hidden w-16 shrink-0 truncate text-muted-foreground xl:block">
                        {server.location.name}
                    </span>

                    <span className="hidden w-32 shrink-0 font-mono text-[11px] tabular-nums text-muted-foreground lg:block">
                        {formatThreads(server.cpuPercent)} · {(server.ramMB / 1024).toFixed(0)}G ·{' '}
                        {(server.diskMB / 1024).toFixed(0)}G
                    </span>
                    <span className="hidden w-28 shrink-0 font-mono text-[11px] tabular-nums text-muted-foreground lg:block">
                        {server.backupCount}b · {server.allocations}p
                    </span>

                    <span className={cn('w-14 shrink-0 text-right tabular-nums', type.text)}>
                        {server.type === 'FREE' ? '—' : formatCents(server.price)}
                    </span>

                    <Tooltip>
                        <TooltipTrigger asChild>
                            <span
                                className={cn(
                                    'w-16 shrink-0 text-right tabular-nums',
                                    expiryTone(server.expires, EXPIRY_WARNING_HOURS),
                                )}
                            >
                                {formatRelative(server.expires)}
                            </span>
                        </TooltipTrigger>
                        <TooltipContent>Expires {formatDate(server.expires, true)}</TooltipContent>
                    </Tooltip>

                    {/* The id admins paste into the panel or a ticket — one click copies it */}
                    <span className="hidden w-20 shrink-0 md:block">
                        {server.ptServerId ? (
                            <CopyValue
                                value={server.ptServerId}
                                className="text-[11px] text-muted-foreground"
                            />
                        ) : (
                            <span className="text-[11px] text-muted-foreground/60">—</span>
                        )}
                    </span>

                    <span className="flex w-12 shrink-0 items-center justify-end gap-1.5">
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <Link
                                    href={logsHref}
                                    onClick={(event) => event.stopPropagation()}
                                    className="text-muted-foreground hover:text-foreground"
                                >
                                    <ScrollText className="h-3.5 w-3.5" />
                                </Link>
                            </TooltipTrigger>
                            <TooltipContent>Logs of this server (7 d)</TooltipContent>
                        </Tooltip>
                        {ptAdmin && (
                            <IconLink href={ptAdmin} title="Open in Pterodactyl admin">
                                <ExternalLink className="h-3.5 w-3.5" />
                            </IconLink>
                        )}
                    </span>

                    {/* The trigger is squeezed into the 24px row rhythm */}
                    <span
                        className="shrink-0 [&>button]:h-6 [&>button]:w-6 [&>button]:p-0"
                        onClick={(event) => event.stopPropagation()}
                        role="presentation"
                    >
                        <AdminServerActionsMenu
                            server={server}
                            suspensionDefaultReason={suspensionDefaultReason}
                            onEdit={onEdit}
                            onSuccess={onChanged}
                        />
                    </span>
                </div>

                {expanded && (
                    <div className="space-y-2 border-t bg-muted/40 px-3 py-2 text-[11px] md:px-8">
                        {/* Three groups, each its own column: who it is, what it is, when it
                            happened — so the dates read as a timeline instead of being
                            scattered through the grid. */}
                        <div className="grid gap-x-8 gap-y-1 md:grid-cols-2 xl:grid-cols-3">
                            <div className="space-y-1">
                                <Detail label="Server id">
                                    <CopyValue value={server.id} />
                                </Detail>
                                <Detail label="Owner">
                                    <span className="inline-flex items-center gap-1.5">
                                        <Link
                                            href={`/admin/gameservers?userId=${server.userId}`}
                                            className="underline underline-offset-2"
                                        >
                                            {server.user.email}
                                        </Link>
                                        <CopyButton
                                            value={server.user.email}
                                            title="Copy email address"
                                        />
                                    </span>
                                </Detail>
                                <Detail label="PT server">
                                    {server.ptServerId ? (
                                        <CopyValue value={server.ptServerId} />
                                    ) : (
                                        <span className="text-amber-600 dark:text-amber-400">
                                            not provisioned
                                        </span>
                                    )}
                                </Detail>
                                <Detail label="PT admin id">
                                    {server.ptAdminId ? (
                                        <CopyValue value={String(server.ptAdminId)} />
                                    ) : (
                                        <span className="text-amber-600 dark:text-amber-400">
                                            —
                                        </span>
                                    )}
                                </Detail>
                            </div>

                            <div className="space-y-1">
                                <Detail label="Status">
                                    <span className={status.text}>{status.label}</span>
                                </Detail>
                                <Detail label="Game">
                                    {server.gameData.name}{' '}
                                    <span className="text-muted-foreground">
                                        ({server.gameData.slug})
                                    </span>
                                </Detail>
                                <Detail label="Plan">
                                    <span className={type.text}>{type.label}</span>
                                </Detail>
                                {/* Everything that was sold with the server, in one line */}
                                <Detail label="Resources">
                                    <span className="font-mono">
                                        {server.cpuPercent}% CPU · {server.ramMB} MB RAM ·{' '}
                                        {server.diskMB} MB disk · {server.backupCount} backups ·{' '}
                                        {server.allocations} port
                                        {server.allocations === 1 ? '' : 's'}
                                        {server.resourceTier?.name &&
                                            ` · tier ${server.resourceTier.name}`}
                                    </span>
                                </Detail>
                            </div>

                            <div className="space-y-1">
                                <Detail label="Created">
                                    {formatDate(server.createdAt, true)}
                                </Detail>
                                <Detail label="Last extended">
                                    {formatDate(server.lastExtended, true)}
                                </Detail>
                                <Detail label="Expires">
                                    <span
                                        className={expiryTone(server.expires, EXPIRY_WARNING_HOURS)}
                                    >
                                        {formatDate(server.expires, true)}
                                    </span>
                                    <span className="ml-1.5 text-muted-foreground">
                                        ({formatRelative(server.expires)})
                                    </span>
                                </Detail>
                            </div>
                        </div>

                        {server.errorText && (
                            <div className="rounded border border-red-500/40 bg-red-500/5 p-2 font-mono text-red-600 dark:text-red-400">
                                {server.errorText}
                            </div>
                        )}

                        {suspension && (
                            <div className="rounded border border-red-500/40 bg-red-500/5 p-2">
                                <div className="flex flex-wrap items-center gap-2 font-medium text-red-600 dark:text-red-400">
                                    {suspension.deleteAfterExpiry ? (
                                        <Trash2 className="h-3.5 w-3.5" />
                                    ) : (
                                        <Undo2 className="h-3.5 w-3.5" />
                                    )}
                                    {suspension.type} since {formatDate(suspension.createdAt, true)}
                                    <span className="text-muted-foreground">
                                        {suspension.deleteAfterExpiry ? 'deleted' : 'lifted'} at{' '}
                                        {formatDate(suspension.expiresAt, true)}
                                        {isSuspensionProcessing(suspension) &&
                                            ' · waiting for the worker'}
                                    </span>
                                </div>
                                <p className="mt-1 whitespace-pre-wrap">{suspension.reason}</p>
                            </div>
                        )}

                        <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                            <Link href={logsHref} className="underline underline-offset-2">
                                Logs (7 d)
                            </Link>
                            <Link href={errorLogsHref} className="underline underline-offset-2">
                                Errors (24 h)
                            </Link>
                            <Link
                                href={`/admin/gameservers?userId=${server.userId}`}
                                className="underline underline-offset-2"
                            >
                                All servers of this owner
                            </Link>
                            {ptPanel && (
                                <a
                                    href={ptPanel}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="underline underline-offset-2"
                                >
                                    PT console
                                </a>
                            )}
                            {ptAdmin && (
                                <a
                                    href={ptAdmin}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="underline underline-offset-2"
                                >
                                    PT admin
                                </a>
                            )}
                            {ptUser && (
                                <a
                                    href={ptUser}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="underline underline-offset-2"
                                >
                                    PT user
                                </a>
                            )}
                        </div>

                        {server.gameConfig != null && (
                            <pre className="max-h-64 overflow-auto rounded border bg-background p-2 font-mono text-[11px] leading-snug">
                                {JSON.stringify(server.gameConfig, null, 2)}
                            </pre>
                        )}
                    </div>
                )}
            </div>
        </TooltipProvider>
    );
}

import type { Prisma } from '@/app/client/generated/browser';
import { suspendedServerWhere } from './suspension';

/**
 * Shared vocabulary of the admin gameserver panel (`/admin/gameservers`): what counts as the
 * default scope, which states are worth an admin's attention, and how upcoming renewals are bucketed.
 *
 * Everything here is pure data plus `Prisma.GameServerWhereInput` fragments (type-only import,
 * so client components can read the labels without pulling in the Prisma client). The page uses
 * the same fragment both for the chip's count and for the filtered list, so a chip that says
 * "3" always lists exactly those 3 servers.
 */

/** A server that was created but never reported ACTIVE for this long is almost certainly stuck. */
export const STUCK_INSTALL_MINUTES = 30;

/** How far back the "recent errors" flag and the per-row error badge look. */
export const ERROR_WINDOW_HOURS = 24;

/** Renewal is "imminent" below this many hours — used for the red expiry colour in the list. */
export const EXPIRY_WARNING_HOURS = 24;

/**
 * The default scope = everything except servers that are already gone. DELETED rows are kept forever
 * for auditing, so counting them would make every total meaningless over time.
 */
export function notDeletedWhere(): Prisma.GameServerWhereInput {
    return { status: { not: 'DELETED' } };
}

export type AttentionKey = 'failed' | 'stuck' | 'orphaned' | 'overdue' | 'suspended' | 'errors';

export const ATTENTION_KEYS: AttentionKey[] = [
    'failed',
    'stuck',
    'orphaned',
    'overdue',
    'suspended',
    'errors',
];

/** Label plus the one-line explanation of *why* the state is wrong, shown as a tooltip. */
export const ATTENTION_META: Record<AttentionKey, { label: string; hint: string }> = {
    failed: {
        label: 'Creation failed',
        hint: 'Pterodactyl rejected the create call — these were never provisioned.',
    },
    stuck: {
        label: 'Install stuck',
        hint: `Still CREATED after ${STUCK_INSTALL_MINUTES} min — the install never reported back.`,
    },
    orphaned: {
        label: 'Missing PT link',
        hint: 'Live server without a Pterodactyl id — nothing in lake can reach it.',
    },
    overdue: {
        label: 'Past expiry',
        hint: 'Still ACTIVE although the expiry date has passed — the worker has not caught up.',
    },
    suspended: {
        label: 'Suspended',
        hint: 'Currently quarantined (or waiting for the worker to process the expiry).',
    },
    errors: {
        label: 'Recent errors',
        hint: `ERROR or FATAL log entries in the last ${ERROR_WINDOW_HOURS} h.`,
    },
};

export function attentionWhere(key: AttentionKey, now: Date = new Date()) {
    const fragments: Record<AttentionKey, Prisma.GameServerWhereInput> = {
        failed: { status: 'CREATION_FAILED' },
        stuck: {
            status: 'CREATED',
            createdAt: { lt: new Date(now.getTime() - STUCK_INSTALL_MINUTES * 60 * 1000) },
        },
        orphaned: {
            status: { in: ['CREATED', 'ACTIVE'] },
            OR: [{ ptServerId: null }, { ptAdminId: null }],
        },
        overdue: { status: 'ACTIVE', expires: { lt: now } },
        suspended: { suspensions: suspendedServerWhere() },
        errors: {
            ApplicationLog: {
                some: {
                    level: { in: ['ERROR', 'FATAL'] },
                    createdAt: { gte: errorWindowStart(now) },
                },
            },
        },
    };

    return fragments[key];
}

export function errorWindowStart(now: Date = new Date()) {
    return new Date(now.getTime() - ERROR_WINDOW_HOURS * 60 * 60 * 1000);
}

/**
 * Timespan filter — "created in the last …". It filters `createdAt`, not `expires`: the
 * renewal side already has its own exclusive buckets (`renewalWhere`), so the
 * question this one answers is "what came in recently".
 */
export type CreatedRangeKey = 'ALL' | '1d' | '7d' | '30d' | '90d' | '365d';

export const CREATED_RANGE_KEYS: CreatedRangeKey[] = ['ALL', '1d', '7d', '30d', '90d', '365d'];

/**
 * What the panel shows without a `created` param. A month of history is what an admin almost
 * always wants, and it keeps the first query off the full table; `ALL` is one click away and
 * is then carried in the URL like any other filter.
 */
export const DEFAULT_CREATED_RANGE: CreatedRangeKey = '30d';

export const CREATED_RANGE_META: Record<CreatedRangeKey, string> = {
    ALL: 'Any time',
    '1d': 'Last 24 h',
    '7d': 'Last 7 days',
    '30d': 'Last 30 days',
    '90d': 'Last 90 days',
    '365d': 'Last year',
};

const CREATED_RANGE_MS: Record<Exclude<CreatedRangeKey, 'ALL'>, number> = {
    '1d': 24 * 60 * 60 * 1000,
    '7d': 7 * 24 * 60 * 60 * 1000,
    '30d': 30 * 24 * 60 * 60 * 1000,
    '90d': 90 * 24 * 60 * 60 * 1000,
    '365d': 365 * 24 * 60 * 60 * 1000,
};

/** `undefined` for `ALL`, so the caller can leave the fragment out entirely. */
export function createdRangeWhere(
    key: CreatedRangeKey,
    now: Date = new Date(),
): Prisma.GameServerWhereInput | undefined {
    if (key === 'ALL') return undefined;
    return { createdAt: { gte: new Date(now.getTime() - CREATED_RANGE_MS[key]) } };
}

export type RenewalKey = 'overdue' | 'day' | 'week' | 'month' | 'later';

export const RENEWAL_KEYS: RenewalKey[] = ['overdue', 'day', 'week', 'month', 'later'];

export const RENEWAL_META: Record<RenewalKey, { label: string; hint: string }> = {
    overdue: { label: 'Overdue', hint: 'Expiry date has passed' },
    day: { label: 'Next 24 h', hint: 'Expires within a day' },
    week: { label: '1–7 days', hint: 'Expires this week' },
    month: { label: '7–30 days', hint: 'Expires this month' },
    later: { label: '30+ days', hint: 'Expires in more than 30 days' },
};

/**
 * Exclusive buckets, so the five counts add up to the live servers exactly once. Deliberately not
 * cumulative: "expires in the next 7 days" that also contains the overdue ones hides the only
 * bucket an admin has to act on.
 */
export function renewalWhere(key: RenewalKey, now: Date = new Date()): Prisma.GameServerWhereInput {
    const plus = (hours: number) => new Date(now.getTime() + hours * 60 * 60 * 1000);

    const ranges: Record<RenewalKey, Prisma.DateTimeFilter> = {
        overdue: { lt: now },
        day: { gte: now, lt: plus(24) },
        week: { gte: plus(24), lt: plus(24 * 7) },
        month: { gte: plus(24 * 7), lt: plus(24 * 30) },
        later: { gte: plus(24 * 30) },
    };

    // Renewal pressure is only a question for servers that are still running; an EXPIRED or
    // failed server has no renewal date worth chasing.
    return { status: { in: ['CREATED', 'ACTIVE'] }, expires: ranges[key] };
}

/** Pterodactyl counts one thread as 100% CPU, which is how the whole app stores it. */
export function cpuPercentToThreads(cpuPercent: number): number {
    return cpuPercent / 100;
}

export function formatThreads(cpuPercent: number): string {
    const threads = cpuPercentToThreads(cpuPercent);
    return `${threads % 1 === 0 ? threads : threads.toFixed(1)}t`;
}

export function formatGiB(mb: number, decimals = 0): string {
    return `${(mb / 1024).toFixed(decimals)}`;
}

/** Cents (`GameServer.price`) to a euro string. */
export function formatCents(cents: number): string {
    return `€${(cents / 100).toFixed(2)}`;
}

const SHORT_DATE = new Intl.DateTimeFormat('de-DE', {
    day: '2-digit',
    month: '2-digit',
    year: '2-digit',
});

/**
 * "09.10.26" — the booking date has to line up with invoices and tickets, so it stays an
 * absolute date; the relative distance lives in the cell's tooltip.
 */
export function formatShortDate(date: Date): string {
    return SHORT_DATE.format(new Date(date));
}

/**
 * Short, sortable-looking relative time: "in 12d", "in 5h", "3d ago". Admins scan this column
 * for outliers, so the unit matters more than the precision.
 */
export function formatRelative(date: Date, now: Date = new Date()): string {
    const diffMs = new Date(date).getTime() - now.getTime();
    const past = diffMs < 0;
    const minutes = Math.round(Math.abs(diffMs) / 60000);

    const value =
        minutes < 1
            ? 'now'
            : minutes < 60
              ? `${minutes}m`
              : minutes < 60 * 24
                ? `${Math.round(minutes / 60)}h`
                : minutes < 60 * 24 * 60
                  ? `${Math.round(minutes / (60 * 24))}d`
                  : `${Math.round(minutes / (60 * 24 * 30))}mo`;

    if (value === 'now') return 'now';
    return past ? `${value} ago` : `in ${value}`;
}

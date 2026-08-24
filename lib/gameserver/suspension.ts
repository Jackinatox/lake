import type { Prisma } from '@/app/client/generated/browser';

/**
 * A server counts as suspended while a `GameServerSuspension` row has not been lifted and has
 * not run out — plus a grace window, see `SUSPENSION_GRACE_MINUTES`. This is deliberately kept
 * out of `GameServerStatus`: a suspension is orthogonal to the lifecycle (a server can be
 * suspended while ACTIVE *or* while EXPIRED), so folding it into the status enum would destroy
 * the state that unsuspending has to restore.
 */
export type ActiveSuspension = Prisma.GameServerSuspensionGetPayload<{
    select: {
        id: true;
        type: true;
        reason: true;
        expiresAt: true;
        deleteAfterExpiry: true;
        createdAt: true;
    };
}>;

export const activeSuspensionSelect = {
    id: true,
    type: true,
    reason: true,
    expiresAt: true,
    deleteAfterExpiry: true,
    createdAt: true,
} as const;

/**
 * How long a lapsed suspension keeps counting as active, in minutes.
 *
 * `expiresAt` is only the moment the suspension *may* be processed — the worker's
 * `PROCESS_SUSPENSIONS` job is what actually PT-unsuspends or deletes the server, and it runs
 * on an interval. Between the two the server is still frozen (or still waiting to be deleted)
 * in Pterodactyl, so treating it as free the second the clock ticks over would make lake show
 * a dashboard that PT refuses to serve, or a "released" server that is about to disappear.
 *
 * The cushion has to cover the worst case: the job firing right *before* a suspension lapses,
 * so the next run is a full interval away, plus the run itself. Keep it comfortably above the
 * job interval (5 minutes at the time of writing).
 *
 * The window closes early on its own: the worker sets `liftedAt` as part of processing, and
 * every predicate here also requires `liftedAt IS NULL`. So the extra minutes are only ever
 * spent waiting for work that has not happened yet — never after it has.
 */
export const SUSPENSION_GRACE_MINUTES = 10;

const SUSPENSION_GRACE_MS = SUSPENSION_GRACE_MINUTES * 60 * 1000;

/**
 * The `expiresAt` cutoff for "still counts as suspended": now minus the grace window.
 *
 * Every query and guard that asks "is this server suspended?" must compare against this, not
 * against `new Date()`, or the answers drift apart between the UI, the admin filter and the
 * unsuspend guard.
 */
export function suspensionActiveCutoff(now: Date = new Date()) {
    return new Date(now.getTime() - SUSPENSION_GRACE_MS);
}

/**
 * True while a suspension has run out but the worker has not processed it yet — i.e. we are
 * inside the grace window. The UI uses it to say "this is being processed" instead of naming
 * an end date that has already passed.
 */
export function isSuspensionProcessing(
    suspension: { expiresAt: Date } | null | undefined,
    now: Date = new Date(),
) {
    return Boolean(suspension && suspension.expiresAt.getTime() <= now.getTime());
}

/**
 * Prisma fragment that pulls the single active suspension onto a `GameServer` query.
 *
 * Must stay a function: `new Date()` inside a module-level object would be frozen at import
 * time and every request would compare against the moment the process booted.
 */
export function activeSuspensionInclude() {
    return {
        suspensions: {
            where: { liftedAt: null, expiresAt: { gt: suspensionActiveCutoff() } },
            orderBy: { expiresAt: 'desc' },
            take: 1,
            select: activeSuspensionSelect,
        },
    } satisfies Prisma.GameServerInclude;
}

/** Same fragment, for queries that use `select` instead of `include`. */
export function activeSuspensionSubSelect() {
    return activeSuspensionInclude().suspensions;
}

/** Narrows the `take: 1` array down to the one suspension (or null). */
export function getActiveSuspension<T>(server: { suspensions?: T[] } | null | undefined): T | null {
    return server?.suspensions?.[0] ?? null;
}

/** Prisma `where` fragment for "this server is currently suspended". */
export function suspendedServerWhere() {
    return { some: { liftedAt: null, expiresAt: { gt: suspensionActiveCutoff() } } };
}

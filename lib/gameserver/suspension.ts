import type { Prisma } from '@/app/client/generated/browser';

/**
 * A server counts as suspended while a `GameServerSuspension` row has not been lifted and
 * has not run out. This is deliberately kept out of `GameServerStatus`: a suspension is
 * orthogonal to the lifecycle (a server can be suspended while ACTIVE *or* while EXPIRED),
 * so folding it into the status enum would destroy the state that unsuspending has to
 * restore.
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
 * Prisma fragment that pulls the single active suspension onto a `GameServer` query.
 *
 * Must stay a function: `new Date()` inside a module-level object would be frozen at import
 * time and every request would compare against the moment the process booted.
 */
export function activeSuspensionInclude() {
    return {
        suspensions: {
            where: { liftedAt: null, expiresAt: { gt: new Date() } },
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
    return { some: { liftedAt: null, expiresAt: { gt: new Date() } } };
}

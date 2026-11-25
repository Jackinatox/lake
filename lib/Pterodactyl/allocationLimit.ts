/**
 * Pterodactyl allocation limit for a server whose purchased ports go down outside of checkout
 * (refund revert, backfill). The tier's `ports` is the limit, but it never drops below the
 * ports the server already has assigned: a lower limit would not remove them, it would only
 * block port fixes. See docs/server-ports.md.
 */
export function allocationLimitToKeep(purchasedAllocations: number, assignedCount: number): number {
    return Math.max(purchasedAllocations, assignedCount, 1);
}

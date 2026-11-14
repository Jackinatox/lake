/**
 * Pterodactyl allocation limit for a server whose purchased ports change (upgrade,
 * refund revert). The tier's `ports` is the limit, but it never drops below the ports
 * the server already has assigned: a lower limit would not remove them, it would only
 * block port fixes. See docs/server-ports.md.
 */
export function allocationLimitToKeep(purchasedAllocations: number, assignedCount: number): number {
    return Math.max(purchasedAllocations, assignedCount, 1);
}

/** Number of allocations assigned to the server in Pterodactyl (application API). */
export async function getAssignedAllocationCount(ptAdminId: number): Promise<number> {
    const response = await fetch(
        `${process.env.NEXT_PUBLIC_PTERODACTYL_URL}/api/application/servers/${ptAdminId}?include=allocations`,
        {
            headers: {
                Authorization: `Bearer ${process.env.PTERODACTYL_API_KEY}`,
                Accept: 'application/json',
            },
        },
    );
    if (!response.ok) {
        throw new Error(`Failed to load allocations of server ${ptAdminId}: ${response.status}`);
    }
    const json = await response.json();
    const allocations = json?.attributes?.relationships?.allocations?.data;
    if (!Array.isArray(allocations)) {
        throw new Error(`No allocations in response for server ${ptAdminId}`);
    }
    return allocations.length;
}

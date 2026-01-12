import { env } from 'next-runtime-env';
import { logger } from '@/lib/logger';

interface AllocationAttributes {
    id: number;
    ip: string;
    ip_alias: string | null;
    port: number;
    notes: string | null;
    is_default: boolean;
}

interface AllocationResponse {
    object: string;
    attributes: AllocationAttributes;
}

interface AllocationListResponse {
    object: string;
    data: AllocationResponse[];
}

/**
 * Get all allocations for a server
 */
export async function listServerAllocations(
    serverId: string,
    apiKey: string,
): Promise<AllocationAttributes[]> {
    const panelUrl = env('NEXT_PUBLIC_PTERODACTYL_URL');
    if (!panelUrl) {
        throw new Error('NEXT_PUBLIC_PTERODACTYL_URL is not defined');
    }

    const response = await fetch(`${panelUrl}/api/client/servers/${serverId}/network/allocations`, {
        headers: {
            Authorization: `Bearer ${apiKey}`,
            Accept: 'Application/vnd.pterodactyl.v1+json',
            'Content-Type': 'application/json',
        },
    });

    if (!response.ok) {
        const errorData = await response.text();
        throw new Error(
            `Failed to list allocations: ${response.status} ${response.statusText} - ${errorData}`,
        );
    }

    const data: AllocationListResponse = await response.json();
    return data.data.map((allocation) => allocation.attributes);
}

/**
 * Assign a new allocation to a server
 * If ip and port are not specified, the system will auto-assign from the pool
 */
export async function assignAllocation(
    serverId: string,
    apiKey: string,
    ip?: string,
    port?: number,
): Promise<AllocationAttributes> {
    const panelUrl = env('NEXT_PUBLIC_PTERODACTYL_URL');
    if (!panelUrl) {
        throw new Error('NEXT_PUBLIC_PTERODACTYL_URL is not defined');
    }

    const body: { ip?: string; port?: number } = {};
    if (ip) body.ip = ip;
    if (port) body.port = port;

    const response = await fetch(`${panelUrl}/api/client/servers/${serverId}/network/allocations`, {
        method: 'POST',
        headers: {
            Authorization: `Bearer ${apiKey}`,
            Accept: 'Application/vnd.pterodactyl.v1+json',
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
    });

    if (!response.ok) {
        const errorData = await response.text();
        throw new Error(
            `Failed to assign allocation: ${response.status} ${response.statusText} - ${errorData}`,
        );
    }

    const data: AllocationResponse = await response.json();
    return data.attributes;
}

/**
 * Set an allocation as the primary (default) allocation
 * Note: Server must be stopped to change primary allocation
 */
export async function setPrimaryAllocation(
    serverId: string,
    apiKey: string,
    allocationId: number,
): Promise<AllocationAttributes> {
    const panelUrl = env('NEXT_PUBLIC_PTERODACTYL_URL');
    if (!panelUrl) {
        throw new Error('NEXT_PUBLIC_PTERODACTYL_URL is not defined');
    }

    const response = await fetch(
        `${panelUrl}/api/client/servers/${serverId}/network/allocations/${allocationId}/primary`,
        {
            method: 'POST',
            headers: {
                Authorization: `Bearer ${apiKey}`,
                Accept: 'Application/vnd.pterodactyl.v1+json',
                'Content-Type': 'application/json',
            },
        },
    );

    if (!response.ok) {
        const errorData = await response.text();
        throw new Error(
            `Failed to set primary allocation: ${response.status} ${response.statusText} - ${errorData}`,
        );
    }

    const data: AllocationResponse = await response.json();
    return data.attributes;
}

/**
 * Remove an allocation from a server
 * Note: Cannot remove primary allocation - set another as primary first
 * Note: Server must be stopped to remove allocations
 */
export async function removeAllocation(
    serverId: string,
    apiKey: string,
    allocationId: number,
): Promise<void> {
    const panelUrl = env('NEXT_PUBLIC_PTERODACTYL_URL');
    if (!panelUrl) {
        throw new Error('NEXT_PUBLIC_PTERODACTYL_URL is not defined');
    }

    const response = await fetch(
        `${panelUrl}/api/client/servers/${serverId}/network/allocations/${allocationId}`,
        {
            method: 'DELETE',
            headers: {
                Authorization: `Bearer ${apiKey}`,
                Accept: 'Application/vnd.pterodactyl.v1+json',
                'Content-Type': 'application/json',
            },
        },
    );

    if (!response.ok) {
        const errorData = await response.text();
        throw new Error(
            `Failed to remove allocation: ${response.status} ${response.statusText} - ${errorData}`,
        );
    }
}

/**
 * Update allocation notes
 */
export async function updateAllocationNotes(
    serverId: string,
    apiKey: string,
    allocationId: number,
    notes: string,
): Promise<AllocationAttributes> {
    const panelUrl = env('NEXT_PUBLIC_PTERODACTYL_URL');
    if (!panelUrl) {
        throw new Error('NEXT_PUBLIC_PTERODACTYL_URL is not defined');
    }

    const response = await fetch(
        `${panelUrl}/api/client/servers/${serverId}/network/allocations/${allocationId}`,
        {
            method: 'POST',
            headers: {
                Authorization: `Bearer ${apiKey}`,
                Accept: 'Application/vnd.pterodactyl.v1+json',
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ notes }),
        },
    );

    if (!response.ok) {
        const errorData = await response.text();
        throw new Error(
            `Failed to update allocation notes: ${response.status} ${response.statusText} - ${errorData}`,
        );
    }

    const data: AllocationResponse = await response.json();
    return data.attributes;
}

/**
 * Ensure a server has the specified number of allocations
 * Will add or remove allocations as needed to reach the target count
 */
export async function setAllocationCount(
    serverId: string,
    apiKey: string,
    targetCount: number,
): Promise<AllocationAttributes[]> {
    const currentAllocations = await listServerAllocations(serverId, apiKey);
    const currentCount = currentAllocations.length;

    if (currentCount === targetCount) {
        logger.trace(`Server ${serverId} already has ${targetCount} allocations`, 'GAME_SERVER');
        return currentAllocations;
    }

    if (currentCount < targetCount) {
        // Add allocations
        const allocationsToAdd = targetCount - currentCount;

        for (let i = 0; i < allocationsToAdd; i++) {
            try {
                await assignAllocation(serverId, apiKey);
            } catch (error) {
                logger.error(
                    `Failed to add allocation ${i + 1} of ${allocationsToAdd} to server ${serverId}`,
                    'GAME_SERVER',
                    { details: { error } },
                );
                throw error;
            }
        }
    } else {
        // Remove allocations (cannot remove primary)
        const allocationsToRemove = currentCount - targetCount;

        const nonPrimaryAllocations = currentAllocations.filter((a) => !a.is_default);

        if (nonPrimaryAllocations.length < allocationsToRemove) {
            throw new Error(
                `Cannot remove ${allocationsToRemove} allocations - only ${nonPrimaryAllocations.length} non-primary allocations available`,
            );
        }

        for (let i = 0; i < allocationsToRemove; i++) {
            try {
                await removeAllocation(serverId, apiKey, nonPrimaryAllocations[i].id);
            } catch (error) {
                logger.error(
                    `Failed to remove allocation ${i + 1} of ${allocationsToRemove} from server ${serverId}`,
                    'GAME_SERVER',
                    { details: { error } },
                );
                throw error;
            }
        }
    }

    // Return updated allocations
    return await listServerAllocations(serverId, apiKey);
}

/**
 * Update a server environment variable
 */
export async function updateServerEnvironmentVariable(
    serverId: string,
    apiKey: string,
    envVarName: string,
    value: string | number,
): Promise<void> {
    const panelUrl = env('NEXT_PUBLIC_PTERODACTYL_URL');
    if (!panelUrl) {
        throw new Error('NEXT_PUBLIC_PTERODACTYL_URL is not defined');
    }

    const response = await fetch(`${panelUrl}/api/client/servers/${serverId}/startup/variable`, {
        method: 'PUT',
        headers: {
            Authorization: `Bearer ${apiKey}`,
            Accept: 'Application/vnd.pterodactyl.v1+json',
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            key: envVarName,
            value: String(value),
        }),
    });

    if (!response.ok) {
        const errorData = await response.text();
        logger.error(
            `Failed to update environment variable ${envVarName} for server ${serverId}: ${response.status} ${response.statusText} - ${errorData}`,
            'GAME_SERVER',
        );
    }

    logger.trace(
        `Updated environment variable ${envVarName} to ${value} for server ${serverId}`,
        'GAME_SERVER',
    );
}

'use client';

import { useState, useEffect, useCallback } from 'react';
import { env } from 'next-runtime-env';
import type { Allocation, AllocationListResponse, PtErrorResponse } from './types';

type UseAllocationsReturn = {
    allocations: Allocation[];
    loading: boolean;
    error: string | null;
    refetch: () => Promise<void>;
    setPrimary: (allocationId: number) => Promise<boolean>;
    updateNotes: (allocationId: number, notes: string) => Promise<boolean>;
    addAllocation: () => Promise<boolean>;
    removeAllocation: (allocationId: number) => Promise<boolean>;
};

function getHeaders(apiKey: string) {
    return {
        Authorization: `Bearer ${apiKey}`,
        Accept: 'Application/vnd.pterodactyl.v1+json',
        'Content-Type': 'application/json',
    };
}

function baseUrl(serverId: string) {
    const ptUrl = env('NEXT_PUBLIC_PTERODACTYL_URL');
    return `${ptUrl}/api/client/servers/${serverId}/network/allocations`;
}

async function extractError(res: Response): Promise<string> {
    try {
        const body = (await res.json()) as PtErrorResponse;
        return body.errors?.[0]?.detail ?? `Request failed (${res.status})`;
    } catch {
        return `Request failed (${res.status})`;
    }
}

export function useAllocations(serverId: string, apiKey: string): UseAllocationsReturn {
    const [allocations, setAllocations] = useState<Allocation[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const refetch = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const res = await fetch(baseUrl(serverId), {
                headers: getHeaders(apiKey),
            });
            if (!res.ok) {
                setError(await extractError(res));
                return;
            }
            const data = (await res.json()) as AllocationListResponse;
            setAllocations(data.data.map((d) => d.attributes));
        } catch (e) {
            setError(e instanceof Error ? e.message : 'Failed to fetch allocations');
        } finally {
            setLoading(false);
        }
    }, [serverId, apiKey]);

    useEffect(() => {
        refetch();
    }, [refetch]);

    const setPrimary = useCallback(
        async (allocationId: number): Promise<boolean> => {
            try {
                const res = await fetch(`${baseUrl(serverId)}/${allocationId}/primary`, {
                    method: 'POST',
                    headers: getHeaders(apiKey),
                });
                if (!res.ok) {
                    setError(await extractError(res));
                    return false;
                }
                // Update local state optimistically
                setAllocations((prev) =>
                    prev.map((a) => ({
                        ...a,
                        is_default: a.id === allocationId,
                    })),
                );
                return true;
            } catch (e) {
                setError(e instanceof Error ? e.message : 'Failed to set primary allocation');
                return false;
            }
        },
        [serverId, apiKey],
    );

    const updateNotes = useCallback(
        async (allocationId: number, notes: string): Promise<boolean> => {
            try {
                const res = await fetch(`${baseUrl(serverId)}/${allocationId}`, {
                    method: 'POST',
                    headers: getHeaders(apiKey),
                    body: JSON.stringify({ notes }),
                });
                if (!res.ok) {
                    setError(await extractError(res));
                    return false;
                }
                setAllocations((prev) =>
                    prev.map((a) => (a.id === allocationId ? { ...a, notes } : a)),
                );
                return true;
            } catch (e) {
                setError(e instanceof Error ? e.message : 'Failed to update notes');
                return false;
            }
        },
        [serverId, apiKey],
    );

    const addAllocation = useCallback(async (): Promise<boolean> => {
        try {
            const res = await fetch(baseUrl(serverId), {
                method: 'POST',
                headers: getHeaders(apiKey),
            });
            if (!res.ok) {
                setError(await extractError(res));
                return false;
            }
            await refetch();
            return true;
        } catch (e) {
            setError(e instanceof Error ? e.message : 'Failed to add allocation');
            return false;
        }
    }, [serverId, apiKey, refetch]);

    const removeAllocation = useCallback(
        async (allocationId: number): Promise<boolean> => {
            try {
                const res = await fetch(`${baseUrl(serverId)}/${allocationId}`, {
                    method: 'DELETE',
                    headers: getHeaders(apiKey),
                });
                if (!res.ok) {
                    setError(await extractError(res));
                    return false;
                }
                setAllocations((prev) => prev.filter((a) => a.id !== allocationId));
                return true;
            } catch (e) {
                setError(e instanceof Error ? e.message : 'Failed to remove allocation');
                return false;
            }
        },
        [serverId, apiKey],
    );

    return {
        allocations,
        loading,
        error,
        refetch,
        setPrimary,
        updateNotes,
        addAllocation,
        removeAllocation,
    };
}

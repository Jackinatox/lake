'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { useTransition } from 'react';

export type ParamPatch = Record<string, string | number | undefined | null>;

/**
 * Every control of the panel writes to the URL, so any state an admin is looking at can be
 * pasted into a ticket. `pending` comes from the transition around `router.push`, which lets
 * the list dim itself while the server component re-renders instead of freezing silently.
 */
export function useServerParams() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const [pending, startTransition] = useTransition();

    /** Applies a patch; an empty/undefined value removes the param. Resets paging by default. */
    const setParams = (patch: ParamPatch, options?: { keepPage?: boolean }) => {
        const next = new URLSearchParams(searchParams.toString());

        for (const [key, value] of Object.entries(patch)) {
            if (value === undefined || value === null || value === '' || value === 'all') {
                next.delete(key);
            } else {
                next.set(key, String(value));
            }
        }

        if (!options?.keepPage) next.delete('page');

        const query = next.toString();
        startTransition(() => router.push(query ? `?${query}` : '?', { scroll: false }));
    };

    /** Sets the param unless it already holds this value, in which case it is cleared. */
    const toggleParam = (key: string, value: string) => {
        setParams({ [key]: searchParams.get(key) === value ? undefined : value });
    };

    /**
     * Replaces the whole filter set with `patch`, dropping every other filter but keeping the
     * page size. Used by the distribution bars: clicking a slice should show *that* slice, not
     * that slice intersected with whatever was filtered before.
     */
    const only = (patch: ParamPatch) => {
        const next = new URLSearchParams();
        const limit = searchParams.get('limit');
        if (limit) next.set('limit', limit);
        for (const [key, value] of Object.entries(patch)) {
            if (value !== undefined && value !== null && value !== '') next.set(key, String(value));
        }
        const query = next.toString();
        startTransition(() => router.push(query ? `?${query}` : '?', { scroll: false }));
    };

    return { searchParams, setParams, toggleParam, only, pending };
}

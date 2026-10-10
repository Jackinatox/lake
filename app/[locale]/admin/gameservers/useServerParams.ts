'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { useTransition } from 'react';

export type ParamPatch = Record<string, string | number | undefined | null>;

/** How the table is laid out — never a filter, so nothing ever clears these. */
const LAYOUT_PARAMS = ['limit', 'sort', 'dir'] as const;

/**
 * What `only` carries over: the layout, plus the timespan. `created` *is* a filter (it has a
 * control and it counts towards the filter badge), but it is a standing one the admin set
 * deliberately — a click in the chart must not revert it behind their back.
 */
const VIEW_PARAMS = [...LAYOUT_PARAMS, 'created'] as const;

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

    const replace = (patch: ParamPatch, carry: readonly string[]) => {
        const next = new URLSearchParams();
        for (const key of carry) {
            const value = searchParams.get(key);
            if (value) next.set(key, value);
        }
        for (const [key, value] of Object.entries(patch)) {
            if (value !== undefined && value !== null && value !== '') next.set(key, String(value));
        }
        const query = next.toString();
        startTransition(() => router.push(query ? `?${query}` : '?', { scroll: false }));
    };

    /**
     * Replaces the dimension filters with `patch`. Used by the distribution bars: clicking a
     * slice should show *that* slice, not that slice intersected with whatever was filtered
     * before.
     *
     * It keeps `VIEW_PARAMS` — including the timespan. Dropping `created` here would snap the
     * view back to its 30-day default and could hide the very servers whose slice was clicked.
     */
    const only = (patch: ParamPatch) => replace(patch, VIEW_PARAMS);

    /** "Clear": every filter goes, the timespan included; only the layout settings survive. */
    const clearAll = () => replace({}, LAYOUT_PARAMS);

    return { searchParams, setParams, toggleParam, only, clearAll, pending };
}

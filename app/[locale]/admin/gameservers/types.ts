import type { GameServerStatus, GameServerType } from '@/app/client/generated/enums';
import type { AttentionKey, CreatedRangeKey, RenewalKey } from '@/lib/gameserver/adminServers';

/** One bar in the distribution card: a named slice of the selection plus the filter that isolates it. */
export type ServerSlice = {
    key: string;
    label: string;
    count: number;
    ramMB: number;
    cpuPercent: number;
    /** Query params that filter the list down to exactly this slice. */
    filter: Record<string, string>;
    /**
     * Palette slot for the dimensions without a meaning-colour (location, game). Assigned from
     * the *complete* list of that entity, never from the slices present in the current view —
     * otherwise filtering one location out would repaint every other one.
     */
    colorIndex?: number;
};

/**
 * Numbers for the **current selection** — the same `where` the list uses, so the summary, the
 * distribution bar and the rows always describe one set of servers. Only the per-facet counts
 * differ: each drops its own filter (see `selection()` in `page.tsx`) so a dimension you have
 * filtered on still shows its alternatives.
 */
export type ServerStats = {
    total: number;
    byStatus: Record<GameServerStatus, number>;
    byType: Record<GameServerType, number>;
    ramMB: number;
    cpuPercent: number;
    diskMB: number;
    /** Sum of the stored extension price of all ACTIVE paid servers, in cents. */
    renewalValueCents: number;
    attention: Record<AttentionKey, number>;
    renewals: Record<RenewalKey, number>;
    byLocation: ServerSlice[];
    byGame: ServerSlice[];
};

export type ServerFilterState = {
    search?: string;
    userId?: string;
    serverId?: string;
    type?: GameServerType;
    locationId?: string;
    gameId?: string;
    status?: GameServerStatus | 'ANY';
    attention?: AttentionKey;
    renewal?: RenewalKey;
    /** Timespan filter on `createdAt`; `'ALL'` (the default) applies nothing. */
    created?: CreatedRangeKey;
};

export type SortKey = 'created' | 'expires' | 'name' | 'price' | 'ram' | 'cpu';

export type SortState = { sort: SortKey; dir: 'asc' | 'desc' };

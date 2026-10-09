import { auth } from '@/auth';
import NoAdmin from '@/components/admin/NoAdminMessage';
import AdminBreadcrumb from '@/components/admin/AdminBreadcrumb';
import prisma from '@/lib/prisma';
import type { Prisma } from '@/app/client/generated/client';
import { GameServerStatus, GameServerType } from '@/app/client/generated/enums';
import { headers } from 'next/headers';
import { activeSuspensionInclude, suspendedServerWhere } from '@/lib/gameserver/suspension';
import { getKeyValueString } from '@/lib/keyValue';
import { SUSPENSION_DEFAULT_REASON } from '@/app/GlobalConstants';
import {
    ATTENTION_KEYS,
    AttentionKey,
    CREATED_RANGE_KEYS,
    CreatedRangeKey,
    RENEWAL_KEYS,
    RenewalKey,
    attentionWhere,
    createdRangeWhere,
    errorWindowStart,
    notDeletedWhere,
    renewalWhere,
} from '@/lib/gameserver/adminServers';
import { GameServerAdminRow } from '@/models/prisma';
import { hasGameIcon } from '@/lib/gameIcons';
import ServerSummary from './ServerSummary';
import ServerDistribution from './ServerDistribution';
import ServerFilters from './ServerFilters';
import ServerList from './ServerList';
import type { ServerSlice, ServerStats, ServerFilterState, SortKey, SortState } from './types';

interface SearchParams {
    page?: string;
    limit?: string;
    search?: string;
    userId?: string;
    serverId?: string;
    type?: GameServerType;
    locationId?: string;
    gameId?: string;
    status?: GameServerStatus | 'ANY';
    attention?: AttentionKey;
    renewal?: RenewalKey;
    created?: CreatedRangeKey;
    sort?: SortKey;
    dir?: 'asc' | 'desc';
    /** Legacy: the old table's suspension filter. Kept so bookmarked links keep working. */
    suspended?: string;
}

const PAGE_SIZES = [25, 50, 100, 200];

const SORT_FIELDS: Record<SortKey, keyof Prisma.GameServerOrderByWithRelationInput> = {
    created: 'createdAt',
    expires: 'expires',
    name: 'name',
    price: 'price',
    ram: 'ramMB',
    cpu: 'cpuPercent',
};

/** Numeric query param, or `undefined` when it is missing or not a number. */
function toId(value: string | undefined): number | undefined {
    if (!value) return undefined;
    const parsed = Number(value);
    return Number.isInteger(parsed) ? parsed : undefined;
}

function isEnumValue<T extends Record<string, string>>(
    enumObject: T,
    value: string | undefined,
): value is T[keyof T] {
    return !!value && Object.values(enumObject).includes(value);
}

async function Gameservers({ searchParams }: { searchParams: Promise<SearchParams> }) {
    const session = await auth.api.getSession({ headers: await headers() });

    if (session?.user.role !== 'admin') {
        return <NoAdmin />;
    }

    const params = await searchParams;
    const now = new Date();

    const page = Math.max(1, parseInt(params.page || '1') || 1);
    const limit = PAGE_SIZES.includes(Number(params.limit)) ? Number(params.limit) : 50;
    const skip = (page - 1) * limit;

    const sort: SortKey = params.sort && params.sort in SORT_FIELDS ? params.sort : 'created';
    const dir = params.dir === 'asc' ? 'asc' : 'desc';
    const sortState: SortState = { sort, dir };

    const search = params.search?.trim() ?? '';
    const attention = ATTENTION_KEYS.includes(params.attention as AttentionKey)
        ? (params.attention as AttentionKey)
        : undefined;
    const renewal = RENEWAL_KEYS.includes(params.renewal as RenewalKey)
        ? (params.renewal as RenewalKey)
        : undefined;
    const status = isEnumValue(GameServerStatus, params.status)
        ? params.status
        : params.status === 'ANY'
          ? 'ANY'
          : undefined;
    const type = isEnumValue(GameServerType, params.type) ? params.type : undefined;
    // A hand-edited URL must not reach Prisma with NaN — that is a 500, not an empty result.
    const locationId = toId(params.locationId);
    const gameId = toId(params.gameId);

    const created: CreatedRangeKey = CREATED_RANGE_KEYS.includes(params.created as CreatedRangeKey)
        ? (params.created as CreatedRangeKey)
        : 'ALL';

    const filters: ServerFilterState = {
        search: search || undefined,
        userId: params.userId,
        serverId: params.serverId,
        type,
        locationId: locationId !== undefined ? String(locationId) : undefined,
        gameId: gameId !== undefined ? String(gameId) : undefined,
        status,
        attention,
        renewal,
        created,
    };

    // ---- the filter, kept in named pieces --------------------------------------------
    // Summary, chart and list all read the *same* selection — a slice of the bar is always
    // exactly a slice of the list. The attention chips are the one exception: each counts
    // without its own filter applied, or selecting one chip would zero out (and disable)
    // all the others, leaving no way to switch between them.
    type FilterKey =
        | 'scope'
        | 'search'
        | 'user'
        | 'server'
        | 'type'
        | 'location'
        | 'game'
        | 'status'
        | 'attention'
        | 'renewal'
        | 'created';

    const parts: { key: FilterKey; where: Prisma.GameServerWhereInput }[] = [];

    // Default view hides deleted servers. A pinpoint lookup (a deep link from the log viewer, or a
    // search) must still find deleted rows — that is usually exactly why it is used. An
    // explicit non-deleted status keeps the scope too, so the Status facet stays meaningful.
    const pinpoint = Boolean(params.serverId || search);
    const wantsDeleted = status === 'ANY' || status === 'DELETED';
    if (!wantsDeleted && !pinpoint) parts.push({ key: 'scope', where: notDeletedWhere() });
    if (status && status !== 'ANY') parts.push({ key: 'status', where: { status } });

    if (search) {
        const numeric = /^\d+$/.test(search) ? parseInt(search) : undefined;
        parts.push({
            key: 'search',
            where: {
                OR: [
                    { name: { contains: search, mode: 'insensitive' } },
                    { id: search },
                    { ptServerId: { contains: search, mode: 'insensitive' } },
                    ...(numeric !== undefined ? [{ ptAdminId: numeric }] : []),
                    { user: { email: { contains: search, mode: 'insensitive' } } },
                    { user: { username: { contains: search, mode: 'insensitive' } } },
                ],
            },
        });
    }

    if (params.userId) parts.push({ key: 'user', where: { userId: params.userId } });
    if (params.serverId) parts.push({ key: 'server', where: { id: params.serverId } });
    if (type) parts.push({ key: 'type', where: { type } });
    if (locationId !== undefined) parts.push({ key: 'location', where: { locationId } });
    if (gameId !== undefined) parts.push({ key: 'game', where: { gameDataId: gameId } });
    if (attention) parts.push({ key: 'attention', where: attentionWhere(attention, now) });
    if (renewal) parts.push({ key: 'renewal', where: renewalWhere(renewal, now) });
    const createdWhere = createdRangeWhere(created, now);
    if (createdWhere) parts.push({ key: 'created', where: createdWhere });
    // Legacy param from the previous table
    if (!attention && params.suspended === 'true') {
        parts.push({ key: 'attention', where: { suspensions: suspendedServerWhere() } });
    }

    /** The selection, optionally without one of its own pieces (see the attention chips). */
    const selection = (...without: FilterKey[]): Prisma.GameServerWhereInput => {
        const list = parts.filter((part) => !without.includes(part.key)).map((part) => part.where);
        return list.length ? { AND: list } : {};
    };

    const where = selection();
    const filterCount = parts.filter((part) => part.key !== 'scope').length;

    // ---- one round trip for the page, the selection aggregates and the filter options -
    const [
        servers,
        totalCount,
        selectionTotals,
        statusGroups,
        typeGroups,
        locationGroups,
        gameGroups,
        renewalValue,
        attentionCounts,
        renewalCounts,
        locations,
        games,
        suspensionDefaultReason,
    ] = await Promise.all([
        prisma.gameServer.findMany({
            where,
            skip,
            take: limit,
            include: {
                user: {
                    select: { id: true, email: true, name: true, username: true, ptUserId: true },
                },
                location: { select: { id: true, name: true } },
                gameData: { select: { id: true, name: true, slug: true } },
                resourceTier: { select: { id: true, name: true } },
                ...activeSuspensionInclude(),
            },
            orderBy: [{ [SORT_FIELDS[sort]]: dir }, { id: 'asc' }],
        }),
        prisma.gameServer.count({ where }),
        prisma.gameServer.aggregate({
            where,
            _count: { _all: true },
            _sum: { ramMB: true, cpuPercent: true, diskMB: true },
        }),
        // The chart is the selection, nothing else: same `where` as the list, every time
        prisma.gameServer.groupBy({ by: ['status'], where, _count: { _all: true } }),
        prisma.gameServer.groupBy({ by: ['type'], where, _count: { _all: true } }),
        prisma.gameServer.groupBy({
            by: ['locationId'],
            where,
            _count: { _all: true },
            _sum: { ramMB: true, cpuPercent: true },
        }),
        prisma.gameServer.groupBy({
            by: ['gameDataId'],
            where,
            _count: { _all: true },
            _sum: { ramMB: true, cpuPercent: true },
        }),
        prisma.gameServer.aggregate({
            where: { AND: [where, { status: 'ACTIVE', type: { not: 'FREE' } }] },
            _sum: { price: true },
        }),
        Promise.all(
            ATTENTION_KEYS.map((key) =>
                prisma.gameServer.count({
                    where: { AND: [selection('attention'), attentionWhere(key, now)] },
                }),
            ),
        ),
        Promise.all(
            RENEWAL_KEYS.map((key) =>
                prisma.gameServer.count({
                    where: { AND: [where, renewalWhere(key, now)] },
                }),
            ),
        ),
        prisma.location.findMany({ select: { id: true, name: true }, orderBy: { name: 'asc' } }),
        prisma.gameData.findMany({
            select: { id: true, name: true, slug: true },
            orderBy: { name: 'asc' },
        }),
        // Prefill for the suspend dialog, admin-editable at /admin/keyvalue.
        getKeyValueString(SUSPENSION_DEFAULT_REASON),
    ]);

    // ---- per-row error badges: closes the loop with /admin/logs ------------------------
    const serverIds = servers.map((server) => server.id);
    const errorGroups = serverIds.length
        ? await prisma.applicationLog.groupBy({
              by: ['gameServerId'],
              where: {
                  gameServerId: { in: serverIds },
                  level: { in: ['ERROR', 'FATAL'] },
                  createdAt: { gte: errorWindowStart(now) },
              },
              _count: { _all: true },
          })
        : [];

    const errorCounts: Record<string, number> = {};
    for (const group of errorGroups) {
        if (group.gameServerId) errorCounts[group.gameServerId] = group._count._all;
    }

    const locationNames = new Map(locations.map((location) => [location.id, location.name]));
    const gameNames = new Map(games.map((game) => [game.id, game.name]));

    type ResourceGroup = {
        _count: { _all: number };
        _sum: { ramMB: number | null; cpuPercent: number | null };
    };

    const toSlices = <T extends ResourceGroup>(
        groups: T[],
        id: (group: T) => number,
        name: (group: T) => string,
        param: string,
    ): ServerSlice[] =>
        groups
            .map((group) => ({
                key: String(id(group)),
                label: name(group),
                count: group._count._all,
                ramMB: group._sum.ramMB ?? 0,
                cpuPercent: group._sum.cpuPercent ?? 0,
                filter: { [param]: String(id(group)) },
            }))
            .sort((a, b) => b.count - a.count);

    const countBy = <G extends { _count: { _all: number } }, T extends string>(
        groups: G[],
        key: (group: G) => T,
        keys: T[],
    ) => {
        const result = Object.fromEntries(keys.map((value) => [value, 0])) as Record<T, number>;
        for (const group of groups) result[key(group)] = group._count._all;
        return result;
    };

    const stats: ServerStats = {
        total: selectionTotals._count._all,
        byStatus: countBy(statusGroups, (group) => group.status, Object.values(GameServerStatus)),
        byType: countBy(typeGroups, (group) => group.type, Object.values(GameServerType)),
        ramMB: selectionTotals._sum.ramMB ?? 0,
        cpuPercent: selectionTotals._sum.cpuPercent ?? 0,
        diskMB: selectionTotals._sum.diskMB ?? 0,
        renewalValueCents: renewalValue._sum.price ?? 0,
        attention: Object.fromEntries(
            ATTENTION_KEYS.map((key, index) => [key, attentionCounts[index]]),
        ) as Record<AttentionKey, number>,
        renewals: Object.fromEntries(
            RENEWAL_KEYS.map((key, index) => [key, renewalCounts[index]]),
        ) as Record<RenewalKey, number>,
        byLocation: toSlices(
            locationGroups,
            (group) => group.locationId,
            (group) => locationNames.get(group.locationId) ?? `Location ${group.locationId}`,
            'locationId',
        ),
        byGame: toSlices(
            gameGroups,
            (group) => group.gameDataId,
            (group) => gameNames.get(group.gameDataId) ?? `Game ${group.gameDataId}`,
            'gameId',
        ),
    };

    // The user behind `userId`, so the picker can show a name on first paint instead of
    // resolving the id client-side (a round trip, and a visible flash of the raw cuid).
    const selectedUser = params.userId
        ? await prisma.user.findUnique({
              where: { id: params.userId },
              select: { id: true, name: true, username: true, email: true, image: true },
          })
        : null;

    // The filter bar shows a themed icon per game where one exists
    const gameOptions = games.map((game) => ({ ...game, hasIcon: hasGameIcon(game.slug) }));

    return (
        // Deep bottom padding: the dense list runs right into the site footer otherwise, and
        // the last row's actions menu needs somewhere to open.
        <div className="space-y-4 pb-24">
            <AdminBreadcrumb items={[{ label: 'Gameservers' }]} />

            {/* Filters first: everything below them describes the selection they define */}
            <ServerFilters
                filters={filters}
                locations={locations}
                games={gameOptions}
                selectedUser={selectedUser}
                filterCount={filterCount}
            />

            <ServerSummary stats={stats} activeAttention={attention} filterCount={filterCount} />
            <ServerDistribution stats={stats} filters={filters} />

            <ServerList
                servers={servers as GameServerAdminRow[]}
                errorCounts={errorCounts}
                totalCount={totalCount}
                page={page}
                limit={limit}
                pageSizes={PAGE_SIZES}
                sortState={sortState}
                suspensionDefaultReason={suspensionDefaultReason ?? ''}
            />
        </div>
    );
}

export default Gameservers;

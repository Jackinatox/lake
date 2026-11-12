'use server';

import { requireAdmin } from '@/lib/auth/requireAdmin';
import prisma from '@/lib/prisma';
import { GameServerType, LogLevel, LogType, WorkerJobType } from '@/app/client/generated/enums';
import { Prisma } from '@/app/client/generated/client';
import { LogWithRelations } from '@/models/prisma';
import {
    LOG_SOURCES,
    LOG_TIME_RANGES,
    logFiltersSchema,
    logUserSearchSchema,
    logUserServersSchema,
} from '@/lib/validation/adminContent';
import { getValidationMessage } from '@/lib/validation/common';

export type TimeRange = (typeof LOG_TIME_RANGES)[number];
export type LogSourceFilter = (typeof LOG_SOURCES)[number];

export type LogFilters = {
    search?: string;
    level?: LogLevel | 'ALL';
    source?: LogSourceFilter;
    type?: LogType | 'ALL';
    /** Worker job, matched through the line's `JobRun`. */
    jobType?: WorkerJobType | 'ALL';
    /** One worker job run. */
    jobRunId?: string;
    timeRange?: TimeRange;
    /** Only logs attached to this user (directly or via one of their servers). */
    userId?: string;
    /** Only logs attached to this gameserver. */
    gameServerId?: string;
    page?: number;
    limit?: number;
};

/** Minimal user shape used by the log filter bar and the log rows. */
export type LogUserOption = {
    id: string;
    name: string;
    username: string | null;
    email: string;
    /** Avatar, shown by `AdminUserPicker`. */
    image: string | null;
};

export type LogServerOption = {
    id: string;
    name: string;
    /** Null when the option is a bare id we could not resolve to a server. */
    type: GameServerType | null;
};

const TIME_RANGE_MS: Record<Exclude<TimeRange, 'ALL'>, number> = {
    '1m': 60 * 1000,
    '10m': 10 * 60 * 1000,
    '1h': 60 * 60 * 1000,
    '1d': 24 * 60 * 60 * 1000,
    '7d': 7 * 24 * 60 * 60 * 1000,
    '30d': 30 * 24 * 60 * 60 * 1000,
};

function parseOrThrow<T>(parse: () => T): T {
    try {
        return parse();
    } catch (error) {
        throw new Error(getValidationMessage(error));
    }
}

/** Lake and worker log lines (the `Log` table), newest first. */
export async function getLogs(filters: LogFilters = {}) {
    await requireAdmin();

    const {
        search = '',
        level = 'ALL',
        source = 'ALL',
        type = 'ALL',
        jobType = 'ALL',
        jobRunId,
        timeRange = 'ALL',
        userId,
        gameServerId,
        page = 1,
        limit = 100,
    } = parseOrThrow(() => logFiltersSchema.parse(filters));

    const term = search.trim();
    const where: Prisma.LogWhereInput = {
        ...(source !== 'ALL' && { source }),
        ...(level !== 'ALL' && { level }),
        ...(type !== 'ALL' && { type }),
        ...(jobType !== 'ALL' && { jobRun: { jobType } }),
        ...(jobRunId && { jobRunId }),
        ...(gameServerId && { gameServerId }),
        ...(timeRange !== 'ALL' && {
            createdAt: { gte: new Date(Date.now() - TIME_RANGE_MS[timeRange]) },
        }),
        AND: [
            ...(term
                ? [
                      {
                          OR: [
                              { message: { contains: term, mode: 'insensitive' as const } },
                              { path: { contains: term, mode: 'insensitive' as const } },
                          ],
                      },
                  ]
                : []),
            // A log about a user's server is a log about that user, even when the
            // entry itself carries no userId (worker/system context).
            ...(userId ? [{ OR: [{ userId }, { gameServer: { userId } }] }] : []),
        ],
    };

    const [logs, counts] = await Promise.all([
        prisma.log.findMany({
            where,
            include: {
                user: { select: { id: true, name: true, username: true, email: true } },
                // Owner of the server, so a row can link to the admin list by user *and* server.
                gameServer: { select: { id: true, name: true, userId: true } },
                jobRun: { select: { id: true, jobType: true, status: true, startedAt: true } },
            },
            orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
            skip: (page - 1) * limit,
            take: limit,
        }),
        prisma.log.groupBy({ by: ['source'], where, _count: { _all: true } }),
    ]);

    const countOf = (s: 'APP' | 'WORKER') =>
        counts.find((group) => group.source === s)?._count._all ?? 0;
    const appTotal = countOf('APP');
    const workerTotal = countOf('WORKER');
    const total = appTotal + workerTotal;

    return {
        logs: logs as LogWithRelations[],
        total,
        appTotal,
        workerTotal,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
    };
}

/**
 * Users for the log viewer's user filter. An empty query returns the most
 * recently created users so the picker is never empty; a query that looks like
 * an id resolves that exact user (used when hydrating filters from the URL).
 */
export async function searchLogUsers(query: string): Promise<LogUserOption[]> {
    await requireAdmin();

    const parsed = parseOrThrow(() => logUserSearchSchema.parse({ query }));
    const trimmed = parsed.query.trim();
    const select = { id: true, name: true, username: true, email: true, image: true } as const;

    if (!trimmed) {
        return prisma.user.findMany({
            select,
            take: 25,
            orderBy: { createdAt: 'desc' },
        });
    }

    return prisma.user.findMany({
        where: {
            OR: [
                { email: { contains: trimmed, mode: 'insensitive' } },
                { username: { contains: trimmed, mode: 'insensitive' } },
                { name: { contains: trimmed, mode: 'insensitive' } },
                { id: trimmed },
            ],
        },
        select,
        take: 25,
        orderBy: { createdAt: 'desc' },
    });
}

/** Gameservers of one user, for the log viewer's server filter. */
export async function getLogUserServers(userId: string): Promise<LogServerOption[]> {
    await requireAdmin();

    const parsed = parseOrThrow(() => logUserServersSchema.parse({ userId }));

    return prisma.gameServer.findMany({
        where: { userId: parsed.userId },
        select: { id: true, name: true, type: true },
        orderBy: { createdAt: 'desc' },
        take: 200,
    });
}

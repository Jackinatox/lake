'use server';

import { requireAdmin } from '@/lib/auth/requireAdmin';
import prisma from '@/lib/prisma';
import { GameServerType, LogLevel, LogType } from '@/app/client/generated/enums';
import { Prisma } from '@/app/client/generated/client';
import { ApplicationLogWithRelations } from '@/models/prisma';
import {
    logFiltersSchema,
    logUserSearchSchema,
    logUserServersSchema,
} from '@/lib/validation/adminContent';
import { getValidationMessage } from '@/lib/validation/common';

export type TimeRange = 'ALL' | '1m' | '10m' | '1h' | '1d' | '7d' | '30d';

export type LogFilters = {
    search?: string;
    level?: LogLevel | 'ALL';
    type?: LogType | 'ALL';
    timeRange?: TimeRange;
    /** Only logs attached to this user. */
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

export async function getApplicationLogs(filters: LogFilters = {}) {
    await requireAdmin();

    const parsed = (() => {
        try {
            return logFiltersSchema.parse(filters);
        } catch (error) {
            throw new Error(getValidationMessage(error));
        }
    })();

    const {
        search = '',
        level = 'ALL',
        type = 'ALL',
        timeRange = 'ALL',
        userId,
        gameServerId,
        page = 1,
        limit = 100,
    } = parsed;

    const where: Prisma.ApplicationLogWhereInput = {};
    const conditions: Prisma.ApplicationLogWhereInput[] = [];

    // Search filter (message and request path)
    if (search && search.trim() !== '') {
        const term = search.trim();
        conditions.push({
            OR: [
                { message: { contains: term, mode: 'insensitive' } },
                { path: { contains: term, mode: 'insensitive' } },
            ],
        });
    }

    if (level && level !== 'ALL') {
        where.level = level;
    }

    if (type && type !== 'ALL') {
        where.type = type;
    }

    // A log about a user's server is a log about that user, even when the entry
    // itself carries no userId (worker/system context).
    if (userId) {
        conditions.push({ OR: [{ userId }, { gameServer: { userId } }] });
    }

    if (gameServerId) {
        where.gameServerId = gameServerId;
    }

    if (timeRange && timeRange !== 'ALL') {
        where.createdAt = { gte: new Date(Date.now() - TIME_RANGE_MS[timeRange]) };
    }

    if (conditions.length > 0) {
        where.AND = conditions;
    }

    const skip = (page - 1) * limit;

    const [logs, total] = await Promise.all([
        prisma.applicationLog.findMany({
            where,
            include: {
                user: {
                    select: {
                        id: true,
                        name: true,
                        username: true,
                        email: true,
                    },
                },
                gameServer: {
                    select: {
                        id: true,
                        name: true,
                        // Owner of the server, so a log row can link to the admin
                        // gameserver list filtered by user *and* server.
                        userId: true,
                    },
                },
            },
            orderBy: {
                createdAt: 'desc',
            },
            skip,
            take: limit,
        }),
        prisma.applicationLog.count({ where }),
    ]);

    return {
        logs: logs as ApplicationLogWithRelations[],
        total,
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

    const parsed = (() => {
        try {
            return logUserSearchSchema.parse({ query });
        } catch (error) {
            throw new Error(getValidationMessage(error));
        }
    })();

    const trimmed = parsed.query.trim();
    const select = { id: true, name: true, username: true, email: true } as const;

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

    const parsed = (() => {
        try {
            return logUserServersSchema.parse({ userId });
        } catch (error) {
            throw new Error(getValidationMessage(error));
        }
    })();

    return prisma.gameServer.findMany({
        where: { userId: parsed.userId },
        select: { id: true, name: true, type: true },
        orderBy: { createdAt: 'desc' },
        take: 200,
    });
}

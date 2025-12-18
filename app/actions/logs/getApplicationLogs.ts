'use server';

import { auth } from '@/auth';
import { headers } from 'next/headers';
import prisma from '@/lib/prisma';
import { LogLevel, LogType } from '@/app/client/generated/enums';
import { ApplicationLogWithRelations } from '@/models/prisma';

export type TimeRange = 'ALL' | '1m' | '10m' | '1h' | '1d' | '7d' | '30d';

export type LogFilters = {
    search?: string;
    level?: LogLevel | 'ALL';
    type?: LogType | 'ALL';
    timeRange?: TimeRange;
    page?: number;
    limit?: number;
};

export async function getApplicationLogs(filters: LogFilters = {}) {
    const session = await auth.api.getSession({ headers: await headers() });

    if (!session?.user || session.user.role !== 'admin') {
        throw new Error('Unauthorized');
    }

    const { search = '', level = 'ALL', type = 'ALL', timeRange = 'ALL', page = 1, limit = 50 } = filters;

    const where: any = {};

    // Search filter (search in message)
    if (search && search.trim() !== '') {
        where.message = {
            contains: search.trim(),
            mode: 'insensitive' as const,
        };
    }

    // Level filter
    if (level && level !== 'ALL') {
        where.level = level;
    }

    // Type filter
    if (type && type !== 'ALL') {
        where.type = type;
    }

    // Time range filter
    if (timeRange && timeRange !== 'ALL') {
        const now = new Date();
        let since: Date;

        switch (timeRange) {
            case '1m':
                since = new Date(now.getTime() - 60 * 1000);
                break;
            case '10m':
                since = new Date(now.getTime() - 10 * 60 * 1000);
                break;
            case '1h':
                since = new Date(now.getTime() - 60 * 60 * 1000);
                break;
            case '1d':
                since = new Date(now.getTime() - 24 * 60 * 60 * 1000);
                break;
            case '7d':
                since = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
                break;
            case '30d':
                since = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
                break;
            default:
                since = new Date(0);
        }

        where.createdAt = {
            gte: since,
        };
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
                        email: true,
                    },
                },
                gameServer: {
                    select: {
                        id: true,
                        name: true,
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

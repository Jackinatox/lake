'use server';

import { auth } from '@/auth';
import NoAdmin from '@/components/admin/NoAdminMessage';
import prisma from '@/lib/prisma';
import { GameServerStatus, GameServerType } from '@/app/client/generated/browser';
import { headers } from 'next/headers';
import GameserversTable from './GameserversTable';

interface SearchParams {
    page?: string;
    limit?: string;
    userId?: string;
    type?: GameServerType;
    locationId?: string;
    status?: GameServerStatus;
}

async function Gameservers({
    searchParams,
}: {
    searchParams: Promise<SearchParams>;
}) {
    const session = await auth.api.getSession({
        headers: await headers(),
    });

    if (session?.user.role !== 'admin') {
        return <NoAdmin />;
    }

    try {
        const params = await searchParams;
        const page = parseInt(params.page || '1');
        const limit = parseInt(params.limit || '50');
        const skip = (page - 1) * limit;

        // Build where clause for filters
        const where: any = {};
        if (params.userId) {
            where.userId = params.userId;
        }
        if (params.type) {
            where.type = params.type;
        }
        if (params.locationId) {
            where.locationId = parseInt(params.locationId);
        }
        if (params.status) {
            where.status = params.status;
        }

        // Get servers with pagination
        const [gameservers, totalCount] = await Promise.all([
            prisma.gameServer.findMany({
                where,
                skip,
                take: limit,
                include: {
                    user: { select: { id: true, email: true } },
                    location: { select: { id: true, name: true } },
                },
                orderBy: { createdAt: 'desc' },
            }),
            prisma.gameServer.count({ where }),
        ]);

        // Get all users and locations for filter dropdowns
        const [users, locations] = await Promise.all([
            prisma.user.findMany({
                select: { id: true, email: true },
                orderBy: { email: 'asc' },
            }),
            prisma.location.findMany({
                select: { id: true, name: true },
                orderBy: { name: 'asc' },
            }),
        ]);

        const totalPages = Math.ceil(totalCount / limit);

        return (
            <>
                <GameserversTable
                    servers={gameservers}
                    currentPage={page}
                    totalPages={totalPages}
                    totalCount={totalCount}
                    users={users}
                    locations={locations}
                    filters={{
                        userId: params.userId,
                        type: params.type,
                        locationId: params.locationId,
                        status: params.status,
                    }}
                />
            </>
        );
    } catch (error: any) {
        return (
            <div>
                <h1 className="text-red-600 font-bold">Error</h1>
                <p>{error.message}</p>
            </div>
        );
    }
}

export default Gameservers;

'use server';

import { auth } from '@/auth';
import NoAdmin from '@/components/admin/NoAdminMessage';
import AdminBreadcrumb from '@/components/admin/AdminBreadcrumb';
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

async function Gameservers({ searchParams }: { searchParams: Promise<SearchParams> }) {
    const session = await auth.api.getSession({
        headers: await headers(),
    });

    if (session?.user.role !== 'admin') {
        return <NoAdmin />;
    }

    const params = await searchParams;
    const page = parseInt(params.page || '1');
    const limit = parseInt(params.limit || '50');
    const skip = (page - 1) * limit;

    const where: any = {};
    if (params.userId) where.userId = params.userId;
    if (params.type) where.type = params.type;
    if (params.locationId) where.locationId = parseInt(params.locationId);
    if (params.status) where.status = params.status;

    const [[gameservers, totalCount], [users, locations]] = await Promise.all([
        Promise.all([
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
        ]),
        Promise.all([
            prisma.user.findMany({
                select: { id: true, email: true },
                orderBy: { email: 'asc' },
            }),
            prisma.location.findMany({
                select: { id: true, name: true },
                orderBy: { name: 'asc' },
            }),
        ]),
    ]);

    const totalPages = Math.ceil(totalCount / limit);

    return (
        <>
            <AdminBreadcrumb items={[{ label: 'Gameservers' }]} />
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
}

export default Gameservers;

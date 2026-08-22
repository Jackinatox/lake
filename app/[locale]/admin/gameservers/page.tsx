import { auth } from '@/auth';
import NoAdmin from '@/components/admin/NoAdminMessage';
import AdminBreadcrumb from '@/components/admin/AdminBreadcrumb';
import prisma from '@/lib/prisma';
import { GameServerStatus, GameServerType } from '@/app/client/generated/browser';
import { headers } from 'next/headers';
import GameserversTable from './GameserversTable';
import { activeSuspensionInclude, suspendedServerWhere } from '@/lib/gameserver/suspension';

interface SearchParams {
    page?: string;
    limit?: string;
    userId?: string;
    serverId?: string;
    type?: GameServerType;
    locationId?: string;
    status?: GameServerStatus;
    suspended?: string;
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
    if (params.serverId) where.id = params.serverId;
    if (params.type) where.type = params.type;
    if (params.locationId) where.locationId = parseInt(params.locationId);
    if (params.status) where.status = params.status;
    if (params.suspended === 'true') where.suspensions = suspendedServerWhere();

    const [[gameservers, totalCount], [users, locations]] = await Promise.all([
        Promise.all([
            prisma.gameServer.findMany({
                where,
                skip,
                take: limit,
                include: {
                    user: { select: { id: true, email: true } },
                    location: { select: { id: true, name: true } },
                    ...activeSuspensionInclude(),
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

    // Options for the server filter: every server of the filtered user (so the
    // filter can be dropped to see their other servers), plus the selected one.
    const serverFilterOptions =
        params.userId || params.serverId
            ? await prisma.gameServer.findMany({
                  where: {
                      OR: [
                          ...(params.userId ? [{ userId: params.userId }] : []),
                          ...(params.serverId ? [{ id: params.serverId }] : []),
                      ],
                  },
                  select: { id: true, name: true, type: true },
                  orderBy: { createdAt: 'desc' },
                  take: 200,
              })
            : [];

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
                serverOptions={serverFilterOptions}
                filters={{
                    userId: params.userId,
                    serverId: params.serverId,
                    type: params.type,
                    locationId: params.locationId,
                    status: params.status,
                    suspended: params.suspended === 'true',
                }}
            />
        </>
    );
}

export default Gameservers;

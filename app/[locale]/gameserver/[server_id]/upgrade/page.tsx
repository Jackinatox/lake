import { auth } from '@/auth';
import NotLoggedIn from '@/components/auth/NoAuthMessage';
import NotAllowedMessage from '@/components/auth/NotAllowedMessage';
import prisma from '@/lib/prisma';

import { headers } from 'next/headers';
import { redirect } from 'next/navigation';

async function UpgradePage({
    params,
    searchParams,
}: {
    params: Promise<{ locale: string; server_id: string }>;
    searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
    const awaitedParams = await params;
    const { server_id } = awaitedParams;
    const awaitedSearch = await searchParams;
    const query = new URLSearchParams(
        Object.entries(awaitedSearch).flatMap(([k, v]) =>
            Array.isArray(v) ? v.map((val) => [k, val]) : v !== undefined ? [[k, v]] : [],
        ),
    ).toString();
    const queryString = query ? `?${query}` : '';

    const session = await auth.api.getSession({
        headers: await headers(),
    });

    if (!session || !session.user || !session.user.ptKey) {
        return <NotLoggedIn />;
    }

    const server = await prisma.gameServer.findFirst({
        where: {
            ptServerId: server_id,
            userId: session.user.id,
        },
    });

    if (!server) {
        return <NotAllowedMessage />;
    }

    const direction = server.type === 'FREE' ? 'freeServer' : 'payedServer';

    redirect(`/gameserver/${server_id}/upgrade/${direction}${queryString}`);
}

export default UpgradePage;

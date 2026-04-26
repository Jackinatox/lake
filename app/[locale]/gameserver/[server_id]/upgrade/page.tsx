import { getOwnedGameServerSummary } from '@/app/data-access-layer/gameServer/getOwnedGameServerSummary';
import { auth } from '@/auth';
import NotLoggedIn from '@/components/auth/NoAuthMessage';
import NotAllowedMessage from '@/components/auth/NotAllowedMessage';
import { createPrivateMetadata, getMetadataCopy } from '@/lib/metadata';
import type { Metadata } from 'next';
import { headers } from 'next/headers';
import { redirect } from 'next/navigation';

export async function generateMetadata({
    params,
}: {
    params: Promise<{ locale: string; server_id: string }>;
}): Promise<Metadata> {
    const { locale, server_id } = await params;
    const copy = getMetadataCopy(locale);
    const session = await auth.api.getSession({
        headers: await headers(),
    });

    if (!session?.user) {
        return createPrivateMetadata({
            title: copy.gameserverUpgradeTitle(copy.gameserverFallbackTitle),
            description: copy.gameserverUpgradeDescription(copy.gameserverFallbackTitle),
        });
    }

    const server = await getOwnedGameServerSummary(session.user.id, server_id);

    if (!server) {
        return createPrivateMetadata({
            title: copy.gameserverUpgradeTitle(copy.gameserverFallbackTitle),
            description: copy.gameserverUpgradeDescription(copy.gameserverFallbackTitle),
        });
    }

    const title =
        server.type === 'FREE'
            ? copy.freeGameserverUpgradeTitle(server.name)
            : copy.gameserverUpgradeTitle(server.name);
    const description =
        server.type === 'FREE'
            ? copy.freeGameserverUpgradeDescription(server.name)
            : copy.gameserverUpgradeDescription(server.name);

    return createPrivateMetadata({
        title,
        description,
    });
}

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

    const server = await getOwnedGameServerSummary(session.user.id, server_id);

    if (!server) {
        return <NotAllowedMessage />;
    }

    const direction = server.type === 'FREE' ? 'freeServer' : 'payedServer';

    redirect(`/gameserver/${server_id}/upgrade/${direction}${queryString}`);
}

export default UpgradePage;

import { getOwnedGameServerSummary } from '@/app/data-access-layer/gameServer/getOwnedGameServerSummary';
import { auth } from '@/auth';
import ServerSuspended from '@/components/auth/ServerSuspended';
import { getActiveSuspension } from '@/lib/gameserver/suspension';
import { headers } from 'next/headers';
import type { ReactNode } from 'react';

/**
 * Single choke point that keeps a suspended server's dashboard out of reach — it covers
 * `page.tsx`, `changeGame/**` and `upgrade/**` at once.
 *
 * This is UX, not the security boundary: server actions and the client's direct Pterodactyl
 * calls do not pass through here. What actually stops a suspended server is its Pterodactyl
 * suspension (see `lib/Pterodactyl/suspendServer/suspendServer.ts`).
 *
 * `getOwnedGameServerSummary` is wrapped in React `cache()`, so the page below reuses this
 * exact query instead of issuing a second one.
 *
 * TODO: this runs on every navigation into the server dashboard. Cache the suspension row
 * (e.g. `unstable_cache` tagged `gameserver-suspension-<id>`, invalidated by the suspend /
 * extend / lift actions) and keep evaluating `expiresAt` in JS, since a time-based predicate
 * cannot be cached directly.
 */
export default async function GameServerLayout({
    children,
    params,
}: {
    children: ReactNode;
    params: Promise<{ server_id: string }>;
}) {
    const { server_id: serverId } = await params;
    const session = await auth.api.getSession({ headers: await headers() });

    // Not logged in / not the owner: fall through so the pages below render their own
    // NotLoggedIn / NotAllowed messages.
    if (!session?.user) return children;

    const server = await getOwnedGameServerSummary(session.user.id, serverId);
    const suspension = getActiveSuspension(server);

    if (server && suspension) {
        return <ServerSuspended serverName={server.name} suspension={suspension} />;
    }

    return children;
}

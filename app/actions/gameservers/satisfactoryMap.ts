'use server';

import { headers } from 'next/headers';

import { getOwnedGameServerSummary } from '@/app/data-access-layer/gameServer/getOwnedGameServerSummary';
import { auth } from '@/auth';
import { getActiveSuspension } from '@/lib/gameserver/suspension';
import { logger } from '@/lib/logger';
import { isSaveFileName } from '@/lib/satisfactoryMap/saves';
import { buildMapUrl, createMapToken } from '@/lib/satisfactoryMap/token';

export type SatisfactoryMapLinkResult =
    { status: 'ok'; url: string; expiresAt: string } | { status: 'error' };

/**
 * Signs a 24-hour link to a save and returns the hosted interactive map URL that loads it.
 * Without `file` the link always serves the newest save; with it, exactly that save (a file
 * name in the save folder; the route checks it still exists). Only the owner of an active,
 * unsuspended Satisfactory server gets one.
 * See docs/satisfactory-interactive-map.md.
 */
export async function createSatisfactoryMapLink(
    ptServerId: string,
    locale: string,
    file?: string,
): Promise<SatisfactoryMapLinkResult> {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session?.user) return { status: 'error' };
    if (file !== undefined && !isSaveFileName(file)) return { status: 'error' };

    const server = await getOwnedGameServerSummary(session.user.id, ptServerId);
    if (
        !server?.ptServerId ||
        server.gameData.slug !== 'satisfactory' ||
        server.status !== 'ACTIVE' ||
        getActiveSuspension(server)
    ) {
        return { status: 'error' };
    }

    const { token, expiresAt } = createMapToken(server.ptServerId, file);
    // One line per click, to see how often the map is used (filter by this exact message).
    await logger.info('Satisfactory map: link opened', 'GAME_SERVER', {
        userId: session.user.id,
        gameServerId: server.id,
        details: { target: file === undefined ? 'newest' : 'file', file: file ?? null, locale },
    });
    return {
        status: 'ok',
        url: buildMapUrl(token, locale),
        expiresAt: expiresAt.toISOString(),
    };
}

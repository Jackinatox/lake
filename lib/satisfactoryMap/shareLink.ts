import 'server-only';

import { suspensionActiveCutoff } from '@/lib/gameserver/suspension';
import prisma from '@/lib/prisma';

/** Full save downloads allowed per share link and window (a whole group opening it at once). */
export const SHARE_DOWNLOAD_LIMIT = 10;
export const SHARE_DOWNLOAD_WINDOW_MS = 60 * 1000;

/** `lastUsedAt` is only written when it is older than this, so busy links don't write per hit. */
const LAST_USED_GRANULARITY_MS = 60 * 60 * 1000;

export type ShareLinkTarget =
    | {
          status: 'ok';
          linkId: string;
          gameServerId: string;
          ptServerId: string;
          userId: string;
          ptKey: string;
      }
    /** No such row: never existed, or regenerated since. */
    | { status: 'notFound' }
    /** The owner turned the link off. */
    | { status: 'disabled' }
    /** The server isn't ACTIVE, is suspended, or isn't Satisfactory any more. */
    | { status: 'unavailable' };

/**
 * Resolves a verified share link id to the server whose newest save it serves. Applies the same
 * server checks as the owner links. See docs/satisfactory-interactive-map.md.
 */
export async function resolveShareLink(linkId: string): Promise<ShareLinkTarget> {
    const link = await prisma.mapShareLink.findUnique({
        where: { id: linkId },
        select: {
            revokedAt: true,
            gameServer: {
                select: {
                    id: true,
                    ptServerId: true,
                    userId: true,
                    status: true,
                    gameData: { select: { slug: true } },
                    user: { select: { ptKey: true } },
                    suspensions: {
                        where: { liftedAt: null, expiresAt: { gt: suspensionActiveCutoff() } },
                        select: { id: true },
                        take: 1,
                    },
                },
            },
        },
    });
    if (!link) return { status: 'notFound' };
    if (link.revokedAt) return { status: 'disabled' };

    const server = link.gameServer;
    if (
        server.status !== 'ACTIVE' ||
        server.gameData.slug !== 'satisfactory' ||
        server.suspensions.length > 0 ||
        !server.ptServerId ||
        !server.user.ptKey
    ) {
        return { status: 'unavailable' };
    }
    return {
        status: 'ok',
        linkId,
        gameServerId: server.id,
        ptServerId: server.ptServerId,
        userId: server.userId,
        ptKey: server.user.ptKey,
    };
}

/** Records a full download, at most one write per link and hour. */
export async function touchShareLink(linkId: string, now = new Date()) {
    await prisma.mapShareLink.updateMany({
        where: {
            id: linkId,
            OR: [
                { lastUsedAt: null },
                { lastUsedAt: { lt: new Date(now.getTime() - LAST_USED_GRANULARITY_MS) } },
            ],
        },
        data: { lastUsedAt: now },
    });
}

// Sliding window of download start times per link. In memory, so it counts per instance: with
// several instances the real cap is a multiple of the limit, which is fine for abuse protection.
const downloads = new Map<string, number[]>();

/**
 * Counts one full download of a share link. Returns the seconds to wait when the link is over
 * `SHARE_DOWNLOAD_LIMIT` in the window, or null when the download may go ahead.
 */
export function takeShareDownload(linkId: string, now = Date.now()): number | null {
    const windowStart = now - SHARE_DOWNLOAD_WINDOW_MS;
    // Drop links whose window is empty, so the map only holds recently used ones.
    for (const [key, times] of downloads) {
        if (times[times.length - 1] <= windowStart) downloads.delete(key);
    }
    const recent = (downloads.get(linkId) ?? []).filter((time) => time > windowStart);
    if (recent.length >= SHARE_DOWNLOAD_LIMIT) {
        downloads.set(linkId, recent);
        return Math.max(1, Math.ceil((recent[0] + SHARE_DOWNLOAD_WINDOW_MS - now) / 1000));
    }
    recent.push(now);
    downloads.set(linkId, recent);
    return null;
}

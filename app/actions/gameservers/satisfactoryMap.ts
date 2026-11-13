'use server';

import { headers } from 'next/headers';

import { getOwnedGameServerSummary } from '@/app/data-access-layer/gameServer/getOwnedGameServerSummary';
import { auth } from '@/auth';
import { getActiveSuspension } from '@/lib/gameserver/suspension';
import { logger } from '@/lib/logger';
import prisma from '@/lib/prisma';
import { isSaveFileName } from '@/lib/satisfactoryMap/saves';
import { buildMapUrl, buildShareUrl, createMapToken } from '@/lib/satisfactoryMap/token';

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

export type MapShareLinkInfo = {
    enabled: boolean;
    url: string;
    createdAt: string;
    lastUsedAt: string | null;
};

export type MapShareLinkResult =
    { status: 'ok'; link: MapShareLinkInfo | null } | { status: 'error' };

const shareLinkSelect = { id: true, revokedAt: true, createdAt: true, lastUsedAt: true } as const;

function toShareLinkInfo(link: {
    id: string;
    revokedAt: Date | null;
    createdAt: Date;
    lastUsedAt: Date | null;
}): MapShareLinkInfo {
    return {
        enabled: link.revokedAt === null,
        url: buildShareUrl(link.id),
        createdAt: link.createdAt.toISOString(),
        lastUsedAt: link.lastUsedAt?.toISOString() ?? null,
    };
}

/**
 * The session's own Satisfactory server, or null. `requireUsable` additionally needs it ACTIVE
 * and unsuspended: needed to turn a link on, but never to turn it off.
 */
async function getOwnedSatisfactoryServer(ptServerId: string, requireUsable: boolean) {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session?.user) return null;
    const server = await getOwnedGameServerSummary(session.user.id, ptServerId);
    if (!server?.ptServerId || server.gameData.slug !== 'satisfactory') return null;
    if (requireUsable && (server.status !== 'ACTIVE' || getActiveSuspension(server))) return null;
    return { userId: session.user.id, gameServerId: server.id };
}

/** The server's share link (null when it was never turned on). Owner only. */
export async function getMapShareLink(ptServerId: string): Promise<MapShareLinkResult> {
    const owned = await getOwnedSatisfactoryServer(ptServerId, false);
    if (!owned) return { status: 'error' };
    const link = await prisma.mapShareLink.findUnique({
        where: { gameServerId: owned.gameServerId },
        select: shareLinkSelect,
    });
    return { status: 'ok', link: link ? toShareLinkInfo(link) : null };
}

/**
 * Turns the share link on or off. Turning it on again brings back the same URL; the first time
 * it creates the link. Turning it off works in any server state.
 */
export async function setMapShareLinkEnabled(
    ptServerId: string,
    enabled: boolean,
): Promise<MapShareLinkResult> {
    const owned = await getOwnedSatisfactoryServer(ptServerId, enabled);
    if (!owned) return { status: 'error' };

    let link;
    if (enabled) {
        link = await prisma.mapShareLink.upsert({
            where: { gameServerId: owned.gameServerId },
            create: { gameServerId: owned.gameServerId, createdById: owned.userId },
            update: { revokedAt: null },
            select: shareLinkSelect,
        });
    } else {
        await prisma.mapShareLink.updateMany({
            where: { gameServerId: owned.gameServerId, revokedAt: null },
            data: { revokedAt: new Date() },
        });
        link = await prisma.mapShareLink.findUnique({
            where: { gameServerId: owned.gameServerId },
            select: shareLinkSelect,
        });
    }

    await logger.info(
        enabled ? 'Satisfactory map: share link enabled' : 'Satisfactory map: share link disabled',
        'GAME_SERVER',
        { userId: owned.userId, gameServerId: owned.gameServerId },
    );
    return { status: 'ok', link: link ? toShareLinkInfo(link) : null };
}

/** Replaces the share link with a new URL (enabled); the old URL stops working at once. */
export async function regenerateMapShareLink(ptServerId: string): Promise<MapShareLinkResult> {
    const owned = await getOwnedSatisfactoryServer(ptServerId, true);
    if (!owned) return { status: 'error' };

    const [, link] = await prisma.$transaction([
        prisma.mapShareLink.deleteMany({ where: { gameServerId: owned.gameServerId } }),
        prisma.mapShareLink.create({
            data: { gameServerId: owned.gameServerId, createdById: owned.userId },
            select: shareLinkSelect,
        }),
    ]);

    await logger.info('Satisfactory map: share link regenerated', 'GAME_SERVER', {
        userId: owned.userId,
        gameServerId: owned.gameServerId,
    });
    return { status: 'ok', link: toShareLinkInfo(link) };
}

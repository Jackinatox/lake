import 'server-only';

import { logger } from '@/lib/logger';
import prisma from '@/lib/prisma';

import { suspensionActiveCutoff } from './suspension';

/**
 * The one "may the owner still touch this server?" check for user-facing server actions.
 *
 * Why this exists: the Pterodactyl suspension is the real boundary, but it only covers the
 * *client* API. Actions that reach PT with `PTERODACTYL_API_KEY` (startup command, delete) or
 * that hand the job to the worker (change game, port reassignment) sail straight past it, and
 * the `[server_id]` layout does not run for a server action. This is the guard for those.
 *
 * It lives apart from `lib/gameserver/suspension.ts` on purpose: that module is imported by
 * client components, so it must stay free of Prisma.
 *
 * @param gameServerId - `GameServer.id` (not the Pterodactyl identifier)
 * @param action - short name of the refused action, for the log
 * @param userId - the owner, so the refusal shows up on their timeline in the log viewer
 * @returns `true` when the action must be refused
 */
export async function refuseIfSuspended(
    gameServerId: string,
    action: string,
    userId?: string,
): Promise<boolean> {
    const suspension = await prisma.gameServerSuspension.findFirst({
        // Same cutoff as every other suspension predicate — the grace window included, so an
        // action cannot slip through while the worker is still on its way to the server.
        where: { gameServerId, liftedAt: null, expiresAt: { gt: suspensionActiveCutoff() } },
        select: { id: true, expiresAt: true },
    });

    if (!suspension) return false;

    logger.warn(`Refused "${action}" on a suspended gameserver`, 'GAME_SERVER', {
        gameServerId,
        userId,
        details: {
            action,
            suspensionId: suspension.id,
            suspensionExpiresAt: suspension.expiresAt,
        },
    });

    return true;
}

/** Message for the actions that surface a reason to the user rather than a bare `false`. */
export const SERVER_SUSPENDED_MESSAGE =
    'This server is suspended. Please contact support if you think this is a mistake.';

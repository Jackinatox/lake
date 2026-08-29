import prisma from '@/lib/prisma';

import { suspensionActiveCutoff } from '@/lib/gameserver/suspension';
import { logger } from '@/lib/logger';

/**
 * Raw Pterodactyl suspend/unsuspend call. Does **not** touch `GameServer.status` — callers
 * that own a lifecycle transition do that themselves.
 *
 * PT suspension is what actually makes a server inaccessible: it stops the server, keeps the
 * files on disk, and PT's client-API middleware then rejects console, power, file and
 * websocket requests. Since our dashboard talks to PT directly with the user's ptKey, this is
 * the real enforcement boundary — the UI blocking in lake is only defense in depth.
 *
 * @param ptAdminId - The Pterodactyl *application* server id
 * @param action - Either 'suspend' or 'unsuspend'
 */
export async function setPtSuspension(ptAdminId: number, action: 'suspend' | 'unsuspend') {
    const panelUrl = process.env.NEXT_PUBLIC_PTERODACTYL_URL;
    const ptApiKey = process.env.PTERODACTYL_API_KEY;

    const response = await fetch(`${panelUrl}/api/application/servers/${ptAdminId}/${action}`, {
        method: 'POST',
        headers: {
            Authorization: `Bearer ${ptApiKey}`,
            'Content-Type': 'application/json',
            Accept: 'application/json',
        },
    });

    if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(`PT API Error (${action}): ` + JSON.stringify(errorData));
    }
}

export type ToggleSuspensionResult = {
    success: boolean;
    gameServerId: string;
    action: 'suspend' | 'unsuspend';
    /** Set when an active admin suspension refused the unsuspend — callers must not treat
     *  the server as released. */
    suspensionBlocked?: boolean;
};

/**
 * Suspends or unsuspends a gameserver in Pterodactyl and moves its lifecycle status along
 * with it (suspend -> EXPIRED, unsuspend -> ACTIVE).
 *
 * This function doesn't auth the user, make sure to do that before calling this function.
 *
 * Admin suspensions (quarantine) do **not** go through here — they use `setPtSuspension`
 * directly so the lifecycle status stays untouched. See `lib/gameserver/suspension.ts`.
 *
 * @param gameServerId - The ID of the gameserver to suspend/unsuspend
 * @param action - Either 'suspend' or 'unsuspend'
 * @param options.force - Unsuspend even when the server is under an active admin suspension
 */
export default async function toggleSuspendGameServer(
    gameServerId: string,
    action: 'suspend' | 'unsuspend',
    options: { force?: boolean } = {},
): Promise<ToggleSuspensionResult | undefined> {
    const gameServer = await prisma.gameServer.findUniqueOrThrow({
        where: { id: gameServerId, ptAdminId: { not: null } },
        include: { user: true },
    });

    // A renewal, upgrade or reverted refund must never quietly release a quarantined server.
    // Guarding here covers every caller (upgradeServer, upgradeFromFree, undoRefundedOrder)
    // in one place. The grace window is part of the check: a suspension that has lapsed but
    // not been processed yet may still be on its way to deleting the server.
    if (action === 'unsuspend' && !options.force) {
        const activeSuspension = await prisma.gameServerSuspension.findFirst({
            where: { gameServerId, liftedAt: null, expiresAt: { gt: suspensionActiveCutoff() } },
            select: { id: true, expiresAt: true },
        });

        if (activeSuspension) {
            logger.warn(
                'Refused to unsuspend a server under an active admin suspension',
                'GAME_SERVER',
                {
                    gameServerId: gameServer.id,
                    userId: gameServer.userId,
                    details: {
                        suspensionId: activeSuspension.id,
                        suspensionExpiresAt: activeSuspension.expiresAt,
                    },
                },
            );
            return { success: false, gameServerId: gameServer.id, action, suspensionBlocked: true };
        }
    }

    try {
        await setPtSuspension(gameServer.ptAdminId!, action);

        await prisma.gameServer.update({
            where: { id: gameServer.id },
            data: {
                status: action === 'suspend' ? 'EXPIRED' : 'ACTIVE',
            },
        });

        logger.info(`Gameserver ${action}ed successfully`, 'GAME_SERVER', {
            gameServerId: gameServer.id,
            userId: gameServer.userId,
            details: { ptAdminId: gameServer.ptAdminId, ptServerId: gameServer.ptServerId, action },
        });

        return { success: true, gameServerId: gameServer.id, action };
    } catch (error) {
        logger.fatal(`Error ${action}ing gameserver`, 'GAME_SERVER', {
            details: {
                error,
                gameServerId: gameServer.id,
                ptAdminId: gameServer.ptAdminId,
                ptServerId: gameServer.ptServerId,
                action,
            },
            gameServerId: gameServer.id,
            userId: gameServer.userId,
        });
    }
}

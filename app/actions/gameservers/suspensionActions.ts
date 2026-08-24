'use server';

import { requireAdmin } from '@/lib/auth/requireAdmin';
import { getUserDisplayName } from '@/lib/auth/getUserDisplayName';
import {
    sendServerSuspendedEmail,
    sendServerUnsuspendedEmail,
} from '@/lib/email/sendEmailEmailsFromLake';
import { logger } from '@/lib/logger';
import prisma from '@/lib/prisma';
import { suspensionActiveCutoff } from '@/lib/gameserver/suspension';
import { setPtSuspension } from '@/lib/Pterodactyl/suspendServer/suspendServer';
import { getValidationMessage } from '@/lib/validation/common';
import {
    extendSuspensionSchema,
    liftSuspensionSchema,
    suspendGameServerSchema,
    type ExtendSuspensionInput,
    type SuspendGameServerInput,
} from '@/lib/validation/suspension';

type ActionResult = { success: true } | { success: false; error: string };

/** Marker written into ApplicationLog.details so the history can be queried back out. */
const SUSPENSION_EVENT_PREFIX = 'SUSPENSION_';

function failure(error: unknown): ActionResult {
    return { success: false, error: error instanceof Error ? error.message : String(error) };
}

const serverForEmail = {
    id: true,
    name: true,
    status: true,
    expires: true,
    ptServerId: true,
    ptAdminId: true,
    userId: true,
    gameData: { select: { name: true } },
    user: { select: { email: true, name: true, username: true, displayUsername: true } },
} as const;

function supportUrl(serverName: string) {
    const subject = `Sperrung meines Servers "${serverName}"`;
    return `${process.env.NEXT_PUBLIC_APP_URL}/support?category=SUSPENSION&subject=${encodeURIComponent(subject)}`;
}

/**
 * Freezes a gameserver: records the suspension, suspends it in Pterodactyl (which is what
 * actually makes it inaccessible) and emails the user the reason and the end date.
 *
 * `GameServer.status` is deliberately left alone — a suspension is orthogonal to the
 * lifecycle, see `lib/gameserver/suspension.ts`.
 */
export async function suspendGameServer(input: SuspendGameServerInput): Promise<ActionResult> {
    try {
        const session = await requireAdmin();

        const parsed = suspendGameServerSchema.safeParse(input);
        if (!parsed.success) return { success: false, error: getValidationMessage(parsed.error) };
        const { gameServerId, type, reason, expiresAt, deleteAfterExpiry } = parsed.data;

        const gameServer = await prisma.gameServer.findUnique({
            where: { id: gameServerId },
            select: serverForEmail,
        });
        if (!gameServer) return { success: false, error: 'Gameserver not found' };
        if (gameServer.status === 'DELETED')
            return { success: false, error: 'This server is already deleted' };

        // Same cutoff the UI uses, so an admin can never suspend a server that still shows as
        // suspended — including one whose suspension lapsed but is still waiting for the worker.
        const existing = await prisma.gameServerSuspension.findFirst({
            where: { gameServerId, liftedAt: null, expiresAt: { gt: suspensionActiveCutoff() } },
            select: { id: true },
        });
        if (existing) return { success: false, error: 'This server is already suspended' };

        // Freeze in Pterodactyl *before* recording it. If this order were reversed a failing PT
        // call would leave a server that lake reports as suspended while it happily keeps
        // running — the abuse would continue behind a UI that says it stopped.
        // An already-expired server is suspended in PT anyway; suspending twice would only risk
        // an error from the panel.
        const touchesPt = Boolean(gameServer.ptAdminId) && gameServer.status !== 'EXPIRED';
        if (touchesPt) {
            await setPtSuspension(gameServer.ptAdminId!, 'suspend');
        }

        let suspension;
        try {
            suspension = await prisma.gameServerSuspension.create({
                data: {
                    gameServerId,
                    type,
                    reason,
                    expiresAt,
                    deleteAfterExpiry,
                    createdByUserId: session.user.id,
                },
            });
        } catch (error) {
            // Roll the freeze back so we never strand a stopped server with nothing recorded
            // against it — nobody would know why it is down.
            if (touchesPt) {
                await setPtSuspension(gameServer.ptAdminId!, 'unsuspend').catch((rollbackError) =>
                    logger.error('Failed to roll back PT suspension', 'GAME_SERVER', {
                        gameServerId,
                        userId: gameServer.userId,
                        details: { error: String(rollbackError) },
                    }),
                );
            }
            throw error;
        }

        await logger.warn('Gameserver suspended by admin', 'GAME_SERVER', {
            gameServerId,
            userId: gameServer.userId,
            details: {
                event: `${SUSPENSION_EVENT_PREFIX}CREATED`,
                suspensionId: suspension.id,
                type,
                reason,
                expiresAt,
                deleteAfterExpiry,
                adminUserId: session.user.id,
                adminName: getUserDisplayName(session.user),
            },
        });

        // Never let a mail failure leave the server half-suspended — it is already frozen in PT
        // and recorded, which is the part that matters.
        await sendServerSuspendedEmail({
            userName: getUserDisplayName(gameServer.user),
            userEmail: gameServer.user.email,
            gameServerId,
            serverName: gameServer.name,
            gameName: gameServer.gameData.name,
            reason,
            suspendedUntil: expiresAt,
            deleteAfterExpiry,
            supportUrl: supportUrl(gameServer.name),
        }).catch((error) =>
            logger.error('Failed to send server suspended email', 'EMAIL', {
                gameServerId,
                userId: gameServer.userId,
                details: { error: error instanceof Error ? error.message : String(error) },
            }),
        );

        return { success: true };
    } catch (error) {
        return failure(error);
    }
}

/**
 * Lifts a suspension early and notifies the user.
 *
 * The server is only unsuspended in Pterodactyl when it is otherwise runnable — an expired
 * server has to stay PT-suspended for the ordinary expiry reason.
 */
export async function liftGameServerSuspension(input: {
    suspensionId: string;
}): Promise<ActionResult> {
    try {
        const session = await requireAdmin();

        const parsed = liftSuspensionSchema.safeParse(input);
        if (!parsed.success) return { success: false, error: getValidationMessage(parsed.error) };

        const suspension = await prisma.gameServerSuspension.findUnique({
            where: { id: parsed.data.suspensionId },
            include: { gameServer: { select: serverForEmail } },
        });
        if (!suspension) return { success: false, error: 'Suspension not found' };
        if (suspension.liftedAt)
            return { success: false, error: 'This suspension is already lifted' };

        const { gameServer } = suspension;
        const stillExpired =
            !(gameServer.status === 'ACTIVE' || gameServer.status === 'CREATED') ||
            gameServer.expires.getTime() <= Date.now();

        await prisma.gameServerSuspension.update({
            where: { id: suspension.id },
            data: { liftedAt: new Date(), liftedByUserId: session.user.id },
        });

        if (gameServer.ptAdminId && !stillExpired) {
            try {
                await setPtSuspension(gameServer.ptAdminId, 'unsuspend');
            } catch (error) {
                // Put the suspension back rather than telling the user their server is free
                // while PT still refuses to start it.
                await prisma.gameServerSuspension.update({
                    where: { id: suspension.id },
                    data: { liftedAt: null, liftedByUserId: null },
                });
                throw error;
            }
        }

        await logger.info('Gameserver suspension lifted by admin', 'GAME_SERVER', {
            gameServerId: gameServer.id,
            userId: gameServer.userId,
            details: {
                event: `${SUSPENSION_EVENT_PREFIX}LIFTED`,
                suspensionId: suspension.id,
                stillExpired,
                adminUserId: session.user.id,
                adminName: getUserDisplayName(session.user),
            },
        });

        await sendServerUnsuspendedEmail({
            userName: getUserDisplayName(gameServer.user),
            userEmail: gameServer.user.email,
            gameServerId: gameServer.id,
            serverName: gameServer.name,
            gameName: gameServer.gameData.name,
            serverUrl: `${process.env.NEXT_PUBLIC_APP_URL}/gameserver/${gameServer.ptServerId}`,
            stillExpired,
        }).catch((error) =>
            logger.error('Failed to send server unsuspended email', 'EMAIL', {
                gameServerId: gameServer.id,
                userId: gameServer.userId,
                details: { error: error instanceof Error ? error.message : String(error) },
            }),
        );

        return { success: true };
    } catch (error) {
        return failure(error);
    }
}

/**
 * Pushes the end date of an active suspension further out.
 *
 * Deliberately sends **no** email — this is an internal decision, and the user was already
 * told why their server is suspended. The change is written to ApplicationLog so a later
 * admin can see that (and why) the date moved.
 */
export async function extendGameServerSuspension(
    input: ExtendSuspensionInput,
): Promise<ActionResult> {
    try {
        const session = await requireAdmin();

        const parsed = extendSuspensionSchema.safeParse(input);
        if (!parsed.success) return { success: false, error: getValidationMessage(parsed.error) };
        const { suspensionId, expiresAt, note } = parsed.data;

        const suspension = await prisma.gameServerSuspension.findUnique({
            where: { id: suspensionId },
            select: { id: true, gameServerId: true, expiresAt: true, liftedAt: true },
        });
        if (!suspension) return { success: false, error: 'Suspension not found' };
        if (suspension.liftedAt)
            return { success: false, error: 'This suspension is already lifted' };
        if (expiresAt.getTime() <= suspension.expiresAt.getTime())
            return { success: false, error: 'The new date must be after the current end date' };

        await prisma.gameServerSuspension.update({
            where: { id: suspensionId },
            data: { expiresAt },
        });

        await logger.info('Gameserver suspension extended by admin', 'GAME_SERVER', {
            gameServerId: suspension.gameServerId,
            details: {
                event: `${SUSPENSION_EVENT_PREFIX}EXTENDED`,
                suspensionId,
                from: suspension.expiresAt,
                to: expiresAt,
                note: note ?? null,
                adminUserId: session.user.id,
                adminName: getUserDisplayName(session.user),
            },
        });

        return { success: true };
    } catch (error) {
        return failure(error);
    }
}

export type SuspensionHistoryEntry = {
    id: number;
    createdAt: Date;
    event: string;
    adminName: string | null;
    details: Record<string, unknown>;
};

/** Reads the suspend/extend/lift trail for a server back out of ApplicationLog. */
export async function getSuspensionHistory(
    gameServerId: string,
): Promise<SuspensionHistoryEntry[]> {
    await requireAdmin();

    const logs = await prisma.applicationLog.findMany({
        where: {
            gameServerId,
            type: 'GAME_SERVER',
            details: { path: ['event'], string_starts_with: SUSPENSION_EVENT_PREFIX },
        },
        select: { id: true, createdAt: true, details: true },
        orderBy: { createdAt: 'desc' },
        take: 50,
    });

    return logs.map((log) => {
        const details = (log.details ?? {}) as Record<string, unknown>;
        return {
            id: log.id,
            createdAt: log.createdAt,
            event: String(details.event ?? 'UNKNOWN'),
            adminName: typeof details.adminName === 'string' ? details.adminName : null,
            details,
        };
    });
}

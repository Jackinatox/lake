import 'server-only';

import { logger } from '@/lib/logger';
import prisma from '@/lib/prisma';
import upgradeGameServer from '@/lib/Pterodactyl/upgradeServer/upgradeServer';
import type { GameServerOrder } from '@/app/client/generated/browser';

/** Delays between attempts: a short Pterodactyl hiccup is over after a few seconds. */
const RETRY_DELAYS_MS = [5_000, 30_000];

/** Statuses of an order that has been (at least partly) paid and was applied to the server. */
const PAID_STATUSES = ['PAID', 'PARTIALLY_REFUNDED'] as const;

/**
 * Applies a paid `UPGRADE` order to its server, retrying a failed attempt twice. Idempotent:
 * `upgradeGameServer` sets absolute values (build, expiry) from the order, so running it again
 * after a partial success is harmless. Throws when all attempts fail; the caller marks the order
 * `provisioningStatus: FAILED`, which the admin gameserver panel lists as "Upgrade failed"
 * (`retryFailedUpgradeOrder`). See docs/server-upgrade.md.
 */
export async function applyUpgradeOrderWithRetry(order: GameServerOrder): Promise<void> {
    for (let attempt = 0; ; attempt++) {
        try {
            await upgradeGameServer(order);
            return;
        } catch (error) {
            const delay = RETRY_DELAYS_MS[attempt];
            if (delay === undefined) throw error;
            logger.warn(
                `Applying upgrade failed, retrying in ${delay / 1000}s (attempt ${attempt + 1}/${RETRY_DELAYS_MS.length + 1})`,
                'PAYMENT',
                {
                    userId: order.userId,
                    gameServerId: order.gameServerId ?? undefined,
                    details: { orderId: order.id },
                },
            );
            await new Promise((resolve) => setTimeout(resolve, delay));
        }
    }
}

export type RetryUpgradeResult = { success: true } | { success: false; error: string };

/**
 * Manual retry (admin) of a paid `UPGRADE` order whose application failed after all automatic
 * attempts. Refuses anything that would overwrite newer state: an order that is not (or no
 * longer) paid, and an order followed by another paid order on the same server — applying the
 * old one would roll that newer order back.
 */
export async function retryFailedUpgradeOrder(orderId: string): Promise<RetryUpgradeResult> {
    const order = await prisma.gameServerOrder.findUnique({
        where: { id: orderId },
        include: { gameServer: { select: { status: true } } },
    });

    if (!order || order.type !== 'UPGRADE') return { success: false, error: 'No upgrade order' };
    if (order.status !== 'PAID') {
        return { success: false, error: `Order is ${order.status}, not PAID` };
    }
    if (order.provisioningStatus !== 'FAILED') {
        return { success: false, error: 'This upgrade was already applied' };
    }
    if (!order.gameServerId || !order.gameServer || order.gameServer.status === 'DELETED') {
        return { success: false, error: 'The server no longer exists' };
    }

    const newer = await prisma.gameServerOrder.count({
        where: {
            gameServerId: order.gameServerId,
            id: { not: order.id },
            status: { in: [...PAID_STATUSES] },
            createdAt: { gt: order.createdAt },
        },
    });
    if (newer > 0) {
        return {
            success: false,
            error: 'A newer paid order exists on this server; applying this one would undo it. Fix manually.',
        };
    }

    try {
        await upgradeGameServer(order);
    } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        await prisma.gameServerOrder.update({
            where: { id: order.id },
            data: { errorText: `Manual retry failed: ${message}` },
        });
        return { success: false, error: message };
    }

    await prisma.gameServerOrder.update({
        where: { id: order.id },
        data: { provisioningStatus: 'SUBMITTED', errorText: null },
    });
    logger.info('Failed upgrade applied by manual retry', 'PAYMENT', {
        userId: order.userId,
        gameServerId: order.gameServerId,
        details: { orderId: order.id },
    });
    return { success: true };
}

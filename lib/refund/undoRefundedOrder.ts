import { logger } from '@/lib/logger';
import prisma from '@/lib/prisma';
import toggleSuspendGameServer from '@/lib/Pterodactyl/suspendServer/suspendServer';
import { env } from 'next-runtime-env';
import { RefundServerAction } from '@/app/client/generated/browser';

/**
 * Execute the server-side effect of a refund/withdrawal.
 *
 * The behavior depends on the `serverAction` stored on the Refund record:
 *
 * - SUSPEND → expire (suspend) the server immediately
 * - SHORTEN → revert to the previous order's config AND expiry date
 * - NONE → do nothing to the server (goodwill refund)
 *
 * This is called when a refund is confirmed (SUCCEEDED) via webhook.
 */
export async function undoRefundedOrder(orderId: string, serverAction: RefundServerAction): Promise<void> {
    // If admin chose NONE, skip all server modifications
    if (serverAction === 'NONE') {
        logger.info('undoRefundedOrder: serverAction is NONE, skipping server changes', 'PAYMENT', {
            details: { orderId },
        });
        return;
    }

    const order = await prisma.gameServerOrder.findUniqueOrThrow({
        where: { id: orderId },
        include: {
            gameServer: true,
        },
    });

    if (!order.gameServer) {
        logger.error('undoRefundedOrder: No game server linked to order, skipping', 'PAYMENT', {
            details: { orderId },
        });
        return;
    }

    const gameServer = order.gameServer;

    // Only act if the server is still active
    if (gameServer.status !== 'ACTIVE' && gameServer.status !== 'CREATED') {
        logger.info('undoRefundedOrder: Server is not active, no undo action needed', 'PAYMENT', {
            details: { orderId, serverStatus: gameServer.status },
        });
        return;
    }

    try {
        // SUSPEND action: always suspend the server regardless of order type
        if (serverAction === 'SUSPEND') {
            await suspendAndExpire(gameServer.id);
            logger.info(
                'undoRefundedOrder: Server suspended due to refund/withdrawal',
                'PAYMENT',
                { details: { orderId, gameServerId: gameServer.id, serverAction } },
            );
            return;
        }

        // SHORTEN action: revert to previous order's configuration
        switch (order.type) {
            case 'UPGRADE':
            case 'RENEW': {
                await revertToPreviousOrder(order.id, gameServer.id);
                break;
            }

            case 'NEW':
            case 'PACKAGE':
            case 'FREE_SERVER': {
                // For creation orders, SHORTEN falls back to SUSPEND since there's nothing to revert to
                await suspendAndExpire(gameServer.id);

                logger.info(
                    'undoRefundedOrder: Server expired due to refunded creation order (SHORTEN fallback)',
                    'PAYMENT',
                    { details: { orderId, gameServerId: gameServer.id } },
                );
                break;
            }

            case 'TO_PAYED': {
                logger.fatal(
                    'undoRefundedOrder: Unexpected TO_PAYED order type, manual review needed',
                    'PAYMENT',
                    { details: { orderId } },
                );
                break;
            }

            default:
                logger.error(`undoRefundedOrder: Unhandled order type ${order.type}`, 'PAYMENT', {
                    details: { orderId, orderType: order.type },
                });
        }
    } catch (error) {
        logger.error('undoRefundedOrder: Failed to undo order', 'PAYMENT', {
            details: { orderId, gameServerId: gameServer.id, orderType: order.type, error },
        });
    }
}

/**
 * Revert a server to the state it was in before the given order was applied.
 *
 * Finds the most recent PAID order for the same server created before this one
 * and restores the server's resources (CPU, RAM, disk, backups) AND expiry date.
 *
 * This handles:
 * - Pure resource upgrades (different CPU/RAM, same or new expiry)
 * - Extension-only purchases (same resources, later expiry)
 * - Combined upgrade + extension
 * - Renewals
 *
 * If the reverted expiry is in the past, the server gets suspended (EXPIRED).
 * Falls back to suspending if no previous order is found.
 */
async function revertToPreviousOrder(refundedOrderId: string, gameServerId: string): Promise<void> {
    const refundedOrder = await prisma.gameServerOrder.findUniqueOrThrow({
        where: { id: refundedOrderId },
    });

    // Find the most recent PAID order for the same server before this one
    const previousOrder = await prisma.gameServerOrder.findFirst({
        where: {
            gameServerId: gameServerId,
            status: { in: ['PAID', 'PARTIALLY_REFUNDED'] },
            id: { not: refundedOrderId },
            createdAt: { lt: refundedOrder.createdAt },
        },
        orderBy: { createdAt: 'desc' },
    });

    if (!previousOrder) {
        // No previous order → this was effectively the first order. Expire the server.
        logger.fatal(
            'revertToPreviousOrder: THIS IS A CASE THAT SHOULD NEVER HAPPEN!!!! DEBUG THIS - No previous order found, expiring server',
            'PAYMENT',
            {
                details: { refundedOrderId, gameServerId },
            },
        );

        await suspendAndExpire(gameServerId);
        return;
    }

    const panelUrl = env('NEXT_PUBLIC_PTERODACTYL_URL');
    const ptApiKey = env('PTERODACTYL_API_KEY');

    const gameServer = await prisma.gameServer.findUniqueOrThrow({
        where: { id: gameServerId, ptAdminId: { not: null } },
    });

    // Check if resources actually differ (upgrade vs extension-only)
    const resourcesChanged =
        previousOrder.cpuPercent !== refundedOrder.cpuPercent ||
        previousOrder.ramMB !== refundedOrder.ramMB ||
        previousOrder.diskMB !== refundedOrder.diskMB ||
        previousOrder.backupCount !== refundedOrder.backupCount;

    // Revert resources in Pterodactyl if they changed
    if (resourcesChanged) {
        // Get current allocation from PT so we keep it unchanged
        let currentAllocation: number;
        try {
            const serverInfoRes = await fetch(
                `${panelUrl}/api/application/servers/${gameServer.ptAdminId}`,
                {
                    headers: {
                        Authorization: `Bearer ${ptApiKey}`,
                        Accept: 'application/json',
                    },
                },
            );
            const serverInfo = await serverInfoRes.json();
            currentAllocation = serverInfo.attributes?.allocation;
        } catch {
            logger.error(
                'revertToPreviousOrder: Failed to get current server info from PT',
                'PAYMENT',
                { details: { gameServerId } },
            );
            await suspendAndExpire(gameServerId);
            return;
        }

        const response = await fetch(
            `${panelUrl}/api/application/servers/${gameServer.ptAdminId}/build`,
            {
                method: 'PATCH',
                headers: {
                    Authorization: `Bearer ${ptApiKey}`,
                    'Content-Type': 'application/json',
                    Accept: 'application/json',
                },
                body: JSON.stringify({
                    allocation: currentAllocation,
                    memory: previousOrder.ramMB,
                    swap: 0,
                    disk: previousOrder.diskMB,
                    io: 500,
                    cpu: previousOrder.cpuPercent,
                    feature_limits: {
                        allocations: previousOrder.allocations,
                        databases: 0,
                        backups: previousOrder.backupCount,
                    },
                }),
            },
        );

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            logger.error('revertToPreviousOrder: Failed to revert server build in PT', 'PAYMENT', {
                details: { gameServerId, errorData },
            });
            await suspendAndExpire(gameServerId);
            return;
        }
    }

    // Revert the expiry date to the previous order's expiresAt
    const previousExpiry = previousOrder.expiresAt;
    const isExpired = previousExpiry <= new Date();

    // Update DB: resources + expiry
    await prisma.gameServer.update({
        where: { id: gameServerId },
        data: {
            cpuPercent: previousOrder.cpuPercent,
            ramMB: previousOrder.ramMB,
            diskMB: previousOrder.diskMB,
            backupCount: previousOrder.backupCount,
            expires: previousExpiry,
            status: isExpired ? 'EXPIRED' : 'ACTIVE',
        },
    });

    // If the reverted expiry is already in the past, also suspend in PT
    if (isExpired) {
        try {
            await suspendAndExpire(gameServerId);
        } catch (suspendError) {
            // DB status is already EXPIRED, log but don't fail
            logger.error(
                'revertToPreviousOrder: Failed to suspend expired server in PT',
                'PAYMENT',
                { details: { gameServerId, error: suspendError } },
            );
        }
    }

    logger.info(
        'revertToPreviousOrder: Successfully reverted server to previous order state',
        'PAYMENT',
        {
            details: {
                refundedOrderId,
                gameServerId,
                previousOrderId: previousOrder.id,
                resourcesChanged,
                revertedExpiry: previousExpiry.toISOString(),
                isExpired,
                revertedTo: {
                    cpuPercent: previousOrder.cpuPercent,
                    ramMB: previousOrder.ramMB,
                    diskMB: previousOrder.diskMB,
                    backupCount: previousOrder.backupCount,
                },
            },
        },
    );
}

async function suspendAndExpire(gameServerId: string) {
    await toggleSuspendGameServer(gameServerId, 'suspend');
    await prisma.gameServer.update({
        where: { id: gameServerId },
        data: { expires: new Date() },
    });
}

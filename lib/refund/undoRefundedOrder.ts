import { logger } from '@/lib/logger';
import prisma from '@/lib/prisma';
import toggleSuspendGameServer from '@/lib/Pterodactyl/suspendServer/suspendServer';
import { env } from 'next-runtime-env';

/**
 * Undo the effect of a refunded order.
 *
 * - NEW / PACKAGE / TO_PAYED / FREE_SERVER → suspend the server
 * - UPGRADE → revert to the previous order's configuration
 * - RENEW → suspend the server (no previous config to revert to)
 *
 * This is called when a refund is confirmed (SUCCEEDED) via webhook.
 */
export async function undoRefundedOrder(orderId: string): Promise<void> {
    const order = await prisma.gameServerOrder.findUniqueOrThrow({
        where: { id: orderId },
        include: {
            gameServer: true,
            refunds: { where: { status: 'SUCCEEDED' } },
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

    // Check if this is a full refund (all money returned)
    const totalRefunded = order.refunds.reduce((sum, r) => sum + r.amount, 0);
    const priceCents = Math.round(order.price);
    const isFullRefund = totalRefunded >= priceCents;

    try {
        switch (order.type) {
            case 'UPGRADE': {
                if (isFullRefund) {
                    // Full refund on upgrade: revert to previous configuration
                    await revertUpgrade(order.id, gameServer.id);
                } else {
                    // Partial refund on upgrade: just log it, no automatic action
                    logger.info(
                        'undoRefundedOrder: Partial refund on upgrade, no automatic revert',
                        'PAYMENT',
                        { details: { orderId, totalRefunded, priceCents } },
                    );
                }
                break;
            }

            case 'NEW':
            case 'PACKAGE':
            case 'FREE_SERVER': {
                if (isFullRefund) {
                    // Full refund on new server: suspend it
                    await toggleSuspendGameServer(gameServer.id, 'suspend');
                    logger.info(
                        'undoRefundedOrder: Server suspended due to full refund',
                        'PAYMENT',
                        { details: { orderId, gameServerId: gameServer.id } },
                    );
                }
                break;
            }

            case 'RENEW': {
                if (isFullRefund) {
                    // Full refund on renewal: suspend the server
                    await toggleSuspendGameServer(gameServer.id, 'suspend');
                    logger.info(
                        'undoRefundedOrder: Server suspended due to full renewal refund',
                        'PAYMENT',
                        { details: { orderId, gameServerId: gameServer.id } },
                    );
                }
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
 * Revert an upgrade by finding the previous order's config and applying it.
 * Falls back to suspending the server if no previous order is found.
 */
async function revertUpgrade(upgradeOrderId: string, gameServerId: string): Promise<void> {
    const upgradeOrder = await prisma.gameServerOrder.findUniqueOrThrow({
        where: { id: upgradeOrderId },
    });

    // Find the most recent PAID order for the same server that was created before this upgrade
    const previousOrder = await prisma.gameServerOrder.findFirst({
        where: {
            gameServerId: gameServerId,
            status: { in: ['PAID', 'PARTIALLY_REFUNDED'] },
            id: { not: upgradeOrderId },
            createdAt: { lt: upgradeOrder.createdAt },
        },
        orderBy: { createdAt: 'desc' },
    });

    if (!previousOrder) {
        // No previous order found — suspend the server as fallback
        logger.warn(
            'revertUpgrade: No previous order found, suspending server as fallback',
            'PAYMENT',
            { details: { upgradeOrderId, gameServerId } },
        );
        await toggleSuspendGameServer(gameServerId, 'suspend');
        return;
    }

    const panelUrl = env('NEXT_PUBLIC_PTERODACTYL_URL');
    const ptApiKey = env('PTERODACTYL_API_KEY');

    const gameServer = await prisma.gameServer.findUniqueOrThrow({
        where: { id: gameServerId, ptAdminId: { not: null } },
    });

    // Get current allocation from Pterodactyl (we don't want to change it)
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
        logger.error('revertUpgrade: Failed to get current server info from PT', 'PAYMENT', {
            details: { gameServerId },
        });
        // Suspend as fallback
        await toggleSuspendGameServer(gameServerId, 'suspend');
        return;
    }

    // Apply previous configuration via Pterodactyl API
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
        logger.error('revertUpgrade: Failed to revert server build in PT', 'PAYMENT', {
            details: { gameServerId, errorData },
        });
        // Suspend as fallback
        await toggleSuspendGameServer(gameServerId, 'suspend');
        return;
    }

    // Update the GameServer record in our DB to reflect the reverted config
    await prisma.gameServer.update({
        where: { id: gameServerId },
        data: {
            cpuPercent: previousOrder.cpuPercent,
            ramMB: previousOrder.ramMB,
            diskMB: previousOrder.diskMB,
            backupCount: previousOrder.backupCount,
            // Keep the server active since they still have a valid previous order
            status: 'ACTIVE',
        },
    });

    logger.info(
        'revertUpgrade: Successfully reverted server to previous configuration',
        'PAYMENT',
        {
            details: {
                upgradeOrderId,
                gameServerId,
                previousOrderId: previousOrder.id,
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

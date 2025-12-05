import prisma from '@/lib/prisma';

import { env } from 'next-runtime-env';
import { sendFreeServerCreatedEmail } from './email/sendEmailEmailsFromLake';
import { logger } from './logger';

export async function notifyFreeServerCreated(orderId: number) {
    try {
        const updatedOrder = await prisma.gameServerOrder.findUniqueOrThrow({
            where: { id: orderId },
            include: {
                user: true,
                creationGameData: true,
                creationLocation: true,
                gameServer: true,
            },
        });

        if (updatedOrder.gameServer && updatedOrder.creationGameData) {
            const appUrl = env('NEXT_PUBLIC_APP_URL');
            const gameName = updatedOrder.creationGameData.name;
            const gameImageUrl = `${appUrl}/images/light/games/icons/${gameName.toLowerCase()}.webp`;
            const serverUrl = `${appUrl}/gameserver/${updatedOrder.gameServer.ptServerId}`;
            const extensionUrl = `${appUrl}/gameserver/${updatedOrder.gameServer.ptServerId}/upgrade`;

            try {
                await sendFreeServerCreatedEmail({
                    userName: updatedOrder.user.name || 'Spieler',
                    userEmail: updatedOrder.user.email,
                    gameName: gameName,
                    gameImageUrl: gameImageUrl,
                    serverName: updatedOrder.gameServer.name,
                    ramMB: updatedOrder.ramMB,
                    cpuPercent: updatedOrder.cpuPercent,
                    diskMB: updatedOrder.diskMB,
                    location: updatedOrder.creationLocation?.name || 'Unknown',
                    expiresAt: updatedOrder.expiresAt,
                    serverUrl: serverUrl,
                    extensionUrl: extensionUrl,
                });
            } catch (emailErr) {
                logger.error('Failed to send free-server-created email', 'EMAIL', {
                    details: { error: emailErr, orderId: updatedOrder.id },
                });
            }
        }
    } catch (err) {
        logger.error('Failed to fetch order for free server notification', 'GAME_SERVER', {
            details: { error: err, orderId },
        });
    }
}

export async function checkFreeServerEligibility(
    userId: string,
    maxFreeServers: number,
): Promise<{ allowed: boolean; count: number }> {
    const currentFreeServers = await prisma.gameServer.count({
        where: {
            userId,
            type: 'FREE',
            status: {
                notIn: ['CREATION_FAILED', 'DELETED'],
            },
        },
    });

    return { allowed: currentFreeServers < maxFreeServers, count: currentFreeServers };
}

export default notifyFreeServerCreated;

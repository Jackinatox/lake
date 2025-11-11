import { prisma } from "@/prisma";
import { env } from 'next-runtime-env';
import { logger } from "@/lib/logger";

/**
 * Suspends or unsuspends a game server in Pterodactyl
 * This function doesn't auth the user, make sure to do that before calling this function
 * @param gameServerId - The ID of the game server to suspend/unsuspend
 * @param action - Either 'suspend' or 'unsuspend'
 */
export default async function toggleSuspendGameServer(
    gameServerId: string,
    action: 'suspend' | 'unsuspend'
) {
    const panelUrl = env('NEXT_PUBLIC_PTERODACTYL_URL');
    const ptApiKey = env('PTERODACTYL_API_KEY');

    const gameServer = await prisma.gameServer.findUniqueOrThrow({
        where: { id: gameServerId, ptAdminId: { not: null } },
        include: { user: true },
    });

    try {
        const response = await fetch(
            `${panelUrl}/api/application/servers/${gameServer.ptAdminId}/${action}`,
            {
                method: "POST",
                headers: {
                    Authorization: `Bearer ${ptApiKey}`,
                    "Content-Type": "application/json",
                    Accept: "application/json",
                },
            }
        );

        if (!response.ok) {
            const errorData = await response.json();
            logger.error(`PT API Error: Failed to ${action} server`, "GAME_SERVER", {
                details: errorData,
                gameServerId: gameServer.id,
            });
            throw new Error("PT API Error: " + JSON.stringify(errorData));
        }

        logger.info(`Game server ${action}ed successfully`, "GAME_SERVER", {
            gameServerId: gameServer.id,
            userId: gameServer.userId,
        });

        return { success: true, gameServerId: gameServer.id, action };
    } catch (error) {
        console.error(`Error ${action}ing game server:`, error);
        logger.fatal(`Error ${action}ing game server`, "GAME_SERVER", {
            details: { error, gameServerId: gameServer.id },
            gameServerId: gameServer.id,
            userId: gameServer.userId,
        });
    }
}

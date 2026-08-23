import { GameServer } from '@/app/client/generated/browser';
import { logger } from '@/lib/logger';

export default async function deleteServerAdmin(
    gameServer: GameServer,
    userId: string,
): Promise<boolean> {
    const apiKey = process.env.PTERODACTYL_API_KEY;
    const baseUrl = process.env.NEXT_PUBLIC_PTERODACTYL_URL;

    if (!apiKey || !baseUrl) {
        throw new Error('Pterodactyl configuration is missing');
    }

    logger.info(
        `Deleting server with Pterodactyl Admin ID: ${gameServer.ptAdminId}`,
        'GAME_SERVER',
        { gameServerId: gameServer.id, userId: userId },
    );

    const response = await fetch(`${baseUrl}/api/application/servers/${gameServer.ptAdminId}`, {
        method: 'DELETE',
        headers: {
            Authorization: `Bearer ${apiKey}`,
            Accept: 'application/json',
            'Content-Type': 'application/json',
        },
    });

    if (!response.ok) {
        const errorData = await response.json();
        logger.httpError(
            `Failed to delete server with Pterodactyl Admin ID: ${gameServer.ptAdminId}`,
            response,
            'GAME_SERVER',
            { gameServerId: gameServer.id, userId: userId, details: { errorData } },
        );
        throw new Error(
            `Failed to delete server: ${errorData.errors ? JSON.stringify(errorData.errors) : response.statusText}`,
        );
    }

    return true;
}

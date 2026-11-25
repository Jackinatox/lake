import { GameServer } from '@/app/client/generated/browser';
import { logger } from '@/lib/logger';

/**
 * Deletes the server from Pterodactyl, but only after checking that `ptAdminId` still points
 * at this server. Pterodactyl's numeric ids can be handed out again (e.g. after the panel's
 * database was rolled back to an older state), so a stale row could otherwise delete someone
 * else's server. The short `identifier` (our `ptServerId`) is never reused, so it decides.
 */
export default async function deleteServerAdmin(
    gameServer: GameServer,
    userId: string,
): Promise<boolean> {
    const apiKey = process.env.PTERODACTYL_API_KEY;
    const baseUrl = process.env.NEXT_PUBLIC_PTERODACTYL_URL;

    if (!apiKey || !baseUrl) {
        throw new Error('Pterodactyl configuration is missing');
    }

    const serverUrl = `${baseUrl}/api/application/servers/${gameServer.ptAdminId}`;
    const headers = {
        Authorization: `Bearer ${apiKey}`,
        Accept: 'application/json',
        'Content-Type': 'application/json',
    };
    const logContext = { gameServerId: gameServer.id, userId: userId };
    const ids = { ptAdminId: gameServer.ptAdminId, ptServerId: gameServer.ptServerId };

    logger.info(
        `Deleting server with Pterodactyl Admin ID: ${gameServer.ptAdminId}`,
        'GAME_SERVER',
        { ...logContext, details: ids },
    );

    // httpError reads the response body itself, so error paths below only read clones.
    const lookup = await fetch(serverUrl, { method: 'GET', headers });
    if (!lookup.ok) {
        await logger.httpError(
            `Failed to look up server with Pterodactyl Admin ID ${gameServer.ptAdminId} before deleting it`,
            lookup,
            'GAME_SERVER',
            { ...logContext, details: ids },
        );
        throw new Error(
            `Failed to look up server before deleting it: ${lookup.status} ${lookup.statusText}`,
        );
    }

    const lookupBody = await lookup.json().catch(() => null);
    const identifier: string | undefined = lookupBody?.attributes?.identifier;
    if (!gameServer.ptServerId || identifier !== gameServer.ptServerId) {
        await logger.error(
            `Refused to delete Pterodactyl server ${gameServer.ptAdminId}: it is not this gameserver`,
            'GAME_SERVER',
            {
                ...logContext,
                details: {
                    ptAdminId: gameServer.ptAdminId,
                    expectedIdentifier: gameServer.ptServerId,
                    actualIdentifier: identifier ?? null,
                },
            },
        );
        throw new Error(
            `Pterodactyl server ${gameServer.ptAdminId} is ${identifier ?? 'unknown'}, expected ${gameServer.ptServerId ?? 'no ptServerId'}; not deleting it`,
        );
    }

    const response = await fetch(serverUrl, { method: 'DELETE', headers });

    if (!response.ok) {
        const errorData = await response
            .clone()
            .json()
            .catch(() => null);
        await logger.httpError(
            `Failed to delete server with Pterodactyl Admin ID: ${gameServer.ptAdminId}`,
            response,
            'GAME_SERVER',
            { ...logContext, details: ids },
        );
        throw new Error(
            `Failed to delete server: ${errorData?.errors ? JSON.stringify(errorData.errors) : response.statusText}`,
        );
    }

    return true;
}

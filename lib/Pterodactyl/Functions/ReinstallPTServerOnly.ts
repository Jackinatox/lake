import { logger } from '@/lib/logger';
import ReinstallPTUserServer from './ReinstallPTUserServer';

/**
 * Server-only reinstall function that can be called from server-side code
 * without requiring request authentication context.
 * 
 * @param serverId - Pterodactyl server identifier
 * @param apiKey - User's Pterodactyl API key
 * @param deleteAllFiles - Whether to delete all files before reinstalling
 * @throws Error if reinstall fails
 */
export async function reinstallPTServerOnly(
    serverId: string,
    apiKey: string,
    deleteAllFiles: boolean = false,
): Promise<void> {
    logger.info(
        `Initiating server reinstall for ${serverId}`,
        'GAME_SERVER',
        {
            details: { deleteAllFiles },
        },
    );

    const response = await ReinstallPTUserServer(serverId, apiKey, deleteAllFiles);

    if (!response.ok) {
        const errorText = await response.text();
        logger.error(
            `Failed to reinstall server ${serverId}`,
            'GAME_SERVER',
            {
                details: { status: response.status, error: errorText, response: JSON.stringify(response) },
            },
        );
        throw new Error(`Reinstall failed: ${response.status} - ${errorText}`);
    }

    logger.info(
        `Successfully completed reinstall for server ${serverId}`,
        'GAME_SERVER',
    );
}

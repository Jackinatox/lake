import { MinecraftGameId, SatisfactoryEggId, SatisfactoryGameId } from '@/app/GlobalConstants';
import { logger } from '@/lib/logger';
import {
    listServerAllocations,
    setAllocationCount,
    updateServerEnvironmentVariable,
} from './allocationHelper';

/**
 * Game-specific port configuration mapping
 */
const GAME_PORT_CONFIG = {
    [MinecraftGameId]: {
        requiredAllocations: 1,
        ports: [],
    },
    [SatisfactoryGameId]: {
        requiredAllocations: 2,
        ports: [
            {
                envVar: 'RELIABLE_PORT',
                notes: 'Satisfactory Reliable Port',
                isSecondary: true,
            },
        ],
    },
} as const;

interface PortConfigurationResult {
    success: boolean;
    allocations: number;
    portsConfigured: string[];
    error?: string;
}

/**
 * Main orchestrator function to correctly configure ports for a game server
 * This function:
 * 1. Determines the required number of allocations for the game
 * 2. Ensures the server has the correct number of allocations
 * 3. Sets environment variables for multi-port games (e.g., Satisfactory)
 *
 * @param ptServerId - Pterodactyl server UUID or short ID
 * @param gameId - Game ID from GlobalConstants (MinecraftGameId, SatisfactoryGameId, etc.)
 * @param apiKey - Pterodactyl user API key
 * @returns Result object with success status and configuration details
 */
export async function correctPortsForGame(
    ptServerId: string,
    gameId: number,
    apiKey: string,
): Promise<PortConfigurationResult> {
    try {
        logger.info(`Starting port configuration for server ${ptServerId}, game ${gameId}`, 'GAME_SERVER');

        const gameConfig = GAME_PORT_CONFIG[gameId as keyof typeof GAME_PORT_CONFIG];

        if (!gameConfig) {
            throw new Error(`No port configuration found for game ID: ${gameId}`);
        }

        // Step 1: Ensure correct number of allocations
        logger.info(
            `Ensuring server has ${gameConfig.requiredAllocations} allocations`,
            'GAME_SERVER',
        );
        const allocations = await setAllocationCount(
            ptServerId,
            apiKey,
            gameConfig.requiredAllocations,
        );

        const portsConfigured: string[] = [];

        // Step 2: Configure ports for multi-port games
        if (gameConfig.ports.length > 0 && allocations.length >= gameConfig.requiredAllocations) {
            const secondaryAllocations = allocations.filter((a) => !a.is_default);

            for (let i = 0; i < gameConfig.ports.length; i++) {
                const portConfig = gameConfig.ports[i];

                if (portConfig.isSecondary && secondaryAllocations[i]) {
                    const allocation = secondaryAllocations[i];
                    logger.info(
                        `Setting ${portConfig.envVar} to port ${allocation.port}`,
                        'GAME_SERVER',
                    );

                    await updateServerEnvironmentVariable(
                        ptServerId,
                        apiKey,
                        portConfig.envVar,
                        allocation.port,
                    );

                    portsConfigured.push(`${portConfig.envVar}=${allocation.port}`);
                }
            }
        }

        logger.info(
            `Port configuration completed for server ${ptServerId}. Allocations: ${allocations.length}, Ports configured: ${portsConfigured.length}`,
            'GAME_SERVER',
        );

        return {
            success: true,
            allocations: allocations.length,
            portsConfigured,
        };
    } catch (error) {
        logger.error(
            `Failed to configure ports for server ${ptServerId}, game ${gameId}`,
            'GAME_SERVER',
            { details: { error } },
        );

        return {
            success: false,
            allocations: 0,
            portsConfigured: [],
            error: error instanceof Error ? error.message : 'Unknown error',
        };
    }
}

/**
 * Legacy function - now delegated to correctPortsForGame
 * @deprecated Use correctPortsForGame instead
 */
export default async function setSecondaryPort(
    ptServerId: string,
    eggId: number,
    apiKey: string,
): Promise<void> {
    // Map egg ID to game ID for backward compatibility
    let gameId: number;

    switch (eggId) {
        case SatisfactoryEggId:
            gameId = SatisfactoryGameId;
            break;
        default:
            logger.warn(`No game mapping for egg ID ${eggId}`, 'GAME_SERVER');
            return;
    }

    await correctPortsForGame(ptServerId, gameId, apiKey);
}

/**
 * Helper function to set a specific port environment variable
 * @param serverId - Pterodactyl server ID
 * @param apiKey - User API key
 * @param envVarName - Environment variable name (e.g., 'RELIABLE_PORT')
 * @param port - Port number to set
 */
export async function setPort(
    serverId: string,
    apiKey: string,
    envVarName: string,
    port: number,
): Promise<void> {
    await updateServerEnvironmentVariable(serverId, apiKey, envVarName, port);
}
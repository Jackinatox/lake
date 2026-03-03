import { logger } from '@/lib/logger';
import {
    listServerAllocations,
    setAllocationCount,
    updateServerEnvironmentVariable,
} from './allocationHelper';

/**
 * Game-specific port configuration mapping, keyed by game slug.
 * Add new games here when they need multi-port support.
 */
const GAME_PORT_CONFIG: Record<
    string,
    {
        requiredAllocations: number;
        ports: ReadonlyArray<{ envVar: string; notes: string; isSecondary: boolean }>;
    }
> = {
    minecraft: {
        requiredAllocations: 1,
        ports: [],
    },
    satisfactory: {
        requiredAllocations: 2,
        ports: [
            {
                envVar: 'RELIABLE_PORT',
                notes: 'Satisfactory Reliable Port',
                isSecondary: true,
            },
        ],
    },
};

interface PortConfigurationResult {
    success: boolean;
    allocations: number;
    portsConfigured: string[];
    error?: string;
    attemptsMade?: number;
}

/**
 * Main orchestrator function to correctly configure ports for a game server
 * This function:
 * 1. Determines the required number of allocations for the game
 * 2. Ensures the server has the correct number of allocations
 * 3. Sets environment variables for multi-port games (e.g., Satisfactory)
 *
 * @param ptServerId - Pterodactyl server UUID or short ID
 * @param gameSlug - Game slug (e.g. 'minecraft', 'satisfactory')
 * @param apiKey - Pterodactyl user API key
 * @param maxRetries - Maximum number of retry attempts (default: 3)
 * @returns Result object with success status and configuration details
 */
export async function correctPortsForGame(
    ptServerId: string,
    gameSlug: string,
    apiKey: string,
    maxRetries: number = 4,
): Promise<PortConfigurationResult> {
    let lastError: Error | undefined;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
        try {
            const result = await configureServerPorts(ptServerId, gameSlug, apiKey);

            return {
                ...result,
                attemptsMade: attempt,
            };
        } catch (error) {
            lastError = error instanceof Error ? error : new Error('Unknown error');
            logger.warn(
                `Port configuration attempt ${attempt}/${maxRetries} failed for server ${ptServerId}`,
                'GAME_SERVER',
                { details: { error: lastError.message, ptServerId, attempt, maxRetries } },
            );

            if (attempt < maxRetries) {
                const delayMs = Math.min(5000 * Math.pow(2, attempt - 1), 10000); // Exponential backoff, max 10s

                await new Promise((resolve) => setTimeout(resolve, delayMs));
            }
        }
    }

    logger.error(
        `All ${maxRetries} port configuration attempts failed for server ${ptServerId}`,
        'GAME_SERVER',
        { details: { error: lastError, ptServerId, maxRetries } },
    );

    return {
        success: false,
        allocations: 0,
        portsConfigured: [],
        error: lastError?.message || 'Unknown error',
        attemptsMade: maxRetries,
    };
}

/**
 * Internal function that performs the actual port configuration logic
 */
async function configureServerPorts(
    ptServerId: string,
    gameSlug: string,
    apiKey: string,
): Promise<Omit<PortConfigurationResult, 'attemptsMade'>> {
    logger.trace(
        `Starting port configuration for server ${ptServerId}, game ${gameSlug}`,
        'GAME_SERVER',
        { details: { ptServerId, gameSlug } },
    );

    const gameConfig = GAME_PORT_CONFIG[gameSlug];

    if (!gameConfig) {
        // Not every game needs port configuration — default to 1 allocation, no extra ports
        logger.trace(
            `No port configuration for game slug '${gameSlug}', using defaults`,
            'GAME_SERVER',
        );
        return {
            success: true,
            allocations: 1,
            portsConfigured: [],
        };
    }

    // Step 1: Ensure correct number of allocations
    logger.info(
        `Ensuring server has ${gameConfig.requiredAllocations} allocations`,
        'GAME_SERVER',
        { details: { ptServerId, requiredAllocations: gameConfig.requiredAllocations } },
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
        { details: { ptServerId, allocations: allocations.length, portsConfigured } },
    );

    return {
        success: true,
        allocations: allocations.length,
        portsConfigured,
    };
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

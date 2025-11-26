import {
    LEGAL_IMPRESSUM_DE,
    LEGAL_IMPRESSUM_EN,
    LEGAL_AGB_DE,
    LEGAL_AGB_EN,
    LEGAL_DATENSCHUTZ_DE,
    LEGAL_DATENSCHUTZ_EN,
    FREE_TIER_CPU_PERCENT,
    FREE_TIER_RAM_MB,
    FREE_TIER_STORAGE_MB,
    FREE_TIER_DURATION_DAYS,
    FREE_SERVERS_LOCATION_ID,
    FREE_TIER_MAX_SERVERS,
} from '@/app/GlobalConstants';
import prisma from '@/lib/prisma';


/**
 * List of all required KeyValue constants that must exist in the database
 */
const REQUIRED_CONSTANTS = [
    // Legal content keys
    LEGAL_IMPRESSUM_DE,
    LEGAL_IMPRESSUM_EN,
    LEGAL_AGB_DE,
    LEGAL_AGB_EN,
    LEGAL_DATENSCHUTZ_DE,
    LEGAL_DATENSCHUTZ_EN,
    // Free tier configuration keys
    FREE_TIER_CPU_PERCENT,
    FREE_TIER_RAM_MB,
    FREE_TIER_STORAGE_MB,
    FREE_TIER_DURATION_DAYS,
    FREE_SERVERS_LOCATION_ID,
    FREE_TIER_MAX_SERVERS
];

/**
 * Verifies that all required database constants and resources exist.
 * Checks for:
 * - Required KeyValue configuration entries
 * - At least one GameData entry
 * - At least one Location
 * - At least one CPU
 * - At least one RAM
 * Throws a descriptive error if any are missing.
 */
export async function performVerification(): Promise<void> {
    try {
        // Check required KeyValue constants
        const existingKeys = await prisma.keyValue.findMany({
            where: {
                key: { in: REQUIRED_CONSTANTS },
            },
            select: { key: true },
        });

        const existingKeySet = new Set(existingKeys.map((kv) => kv.key));
        const missingKeys = REQUIRED_CONSTANTS.filter((key) => !existingKeySet.has(key));

        if (missingKeys.length > 0) {
            const errorMessage = `
╔════════════════════════════════════════════════════════════════╗
║         🚨 CRITICAL: Missing Required Database Constants       ║
╠════════════════════════════════════════════════════════════════╣
║                                                                ║
║ The following required KeyValue entries are missing from the   ║
║ database and must be seeded before the application can start:  ║
║                                                                ║
${missingKeys.map((key) => `║   • ${key.padEnd(56)} ║`).join('\n')}
║                                                                ║
║ Please seed the database, with the unfinished seed-script      ║
║                                                                ║
║ Or manually insert these records into the KeyValue table.      ║
║                                                                ║
╚════════════════════════════════════════════════════════════════╝
`;
            throw new Error(errorMessage);
        }

        console.log(
            `✓ All ${REQUIRED_CONSTANTS.length} required database constants are present`
        );

        // Check required database resources
        const [gameDataCount, locationCount, cpuCount, ramCount] = await Promise.all([
            prisma.gameData.count(),
            prisma.location.count(),
            prisma.cPU.count(),
            prisma.rAM.count(),
        ]);

        const missingResources: string[] = [];
        if (gameDataCount === 0) missingResources.push('GameData (no games defined)');
        if (locationCount === 0) missingResources.push('Location (no locations defined)');
        if (cpuCount === 0) missingResources.push('CPU (no CPU configurations defined)');
        if (ramCount === 0) missingResources.push('RAM (no RAM configurations defined)');

        if (missingResources.length > 0) {
            const errorMessage = `
╔════════════════════════════════════════════════════════════════╗
║       🚨 CRITICAL: Missing Required Database Resources        ║
╠════════════════════════════════════════════════════════════════╣
║                                                                ║
║ The following required resources are missing from the database ║
║ and must be created before the application can start:          ║
║                                                                ║
${missingResources.map((res) => `║   • ${res.padEnd(56)} ║`).join('\n')}
║                                                                ║
║ Please seed the database with the seed script:                ║
║   $ pnpm exec prisma db seed                                  ║
║                                                                ║
╚════════════════════════════════════════════════════════════════╝
`;
            throw new Error(errorMessage);
        }

        console.log(
            `✓ Required resources verified: GameData (${gameDataCount}), ` +
            `Locations (${locationCount}), CPU (${cpuCount}), RAM (${ramCount})`
        );
    } catch (error) {
        if (error instanceof Error && error.message.includes('CRITICAL')) {
            throw error;
        }
        const criticalError = `
╔════════════════════════════════════════════════════════════════╗
║    🚨 CRITICAL: Database Connection Error During Startup     ║
╠════════════════════════════════════════════════════════════════╣
║                                                                ║
║ Failed to verify database resources.                          ║
║ Please ensure the database is running and accessible.         ║
║                                                                ║
║ Original error: ${String(error).substring(0, 48).padEnd(48)} ║
║                                                                ║
╚════════════════════════════════════════════════════════════════╝
`;
        throw new Error(criticalError);
    }
}

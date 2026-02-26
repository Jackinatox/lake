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
    FREE_TIER_BACKUP_COUNT,
    FREE_TIER_ALLOCATIONS,
    LEGAL_PAYMENTS_DE,
    LEGAL_PAYMENTS_EN,
    LEGAL_RETURNS_DE,
    LEGAL_RETURNS_EN,
} from '@/app/GlobalConstants';
import prisma from './prisma';
import { env } from 'next-runtime-env';

/**
 * List of all required KeyValue constants that must exist in the database
 */
const REQUIRED_DB_CONSTANTS = [
    // Legal content keys
    LEGAL_AGB_DE,
    LEGAL_AGB_EN,
    LEGAL_DATENSCHUTZ_DE,
    LEGAL_DATENSCHUTZ_EN,
    LEGAL_IMPRESSUM_DE,
    LEGAL_IMPRESSUM_EN,
    LEGAL_PAYMENTS_DE,
    LEGAL_PAYMENTS_EN,
    LEGAL_RETURNS_DE,
    LEGAL_RETURNS_EN,
    // Free tier configuration keys
    FREE_TIER_CPU_PERCENT,
    FREE_TIER_RAM_MB,
    FREE_TIER_STORAGE_MB,
    FREE_TIER_DURATION_DAYS,
    FREE_SERVERS_LOCATION_ID,
    FREE_TIER_MAX_SERVERS,
    FREE_TIER_BACKUP_COUNT,
    FREE_TIER_ALLOCATIONS,
];

const ENV_VARS_REQUIRED = [
    'NEXT_PUBLIC_APP_URL',
    'BETTER_AUTH_SECRET',
    'BETTER_AUTH_URL',
    'DISCORD_CLIENT_ID',
    'DISCORD_CLIENT_SECRET',
    'GOOGLE_CLIENT_ID',
    'GOOGLE_CLIENT_SECRET',
    'DATABASE_URL',
    'webhookSecret',
    'NEXT_PUBLIC_PTERODACTYL_URL',
    'WORKER_IP',
    'PTERODACTYL_API_KEY',
    'NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY',
    'STRIPE_SECRET_KEY',
    'SMTP_HOST',
    'SMTP_PORT',
    'SMTP_USER',
    'SMTP_PASS',
    'SUPPORT_SMTP_HOST',
    'SUPPORT_SMTP_PORT',
    'SUPPORT_SMTP_USER',
    'SUPPORT_SMTP_PASS',
    'NEXT_PUBLIC_SUPPORT_MAIL',
    'TELEGRAM_CHAT_ID',
    'TELEGRAM_BOT_TOKEN',
];
export async function performVerification(): Promise<void> {
    await verifyDatabaseConst();
    await verifyEnvVars();
}

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
async function verifyDatabaseConst(): Promise<void> {
    try {
        // Check required KeyValue constants
        const existingKeys = await prisma.keyValue.findMany({
            where: {
                key: { in: REQUIRED_DB_CONSTANTS },
            },
            select: { key: true },
        });

        const existingKeySet = new Set(existingKeys.map((kv) => kv.key));
        const missingKeys = REQUIRED_DB_CONSTANTS.filter((key) => !existingKeySet.has(key));

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
            `✓ All ${REQUIRED_DB_CONSTANTS.length} required database constants are present`,
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
║   $ bun  exec prisma db seed                                  ║
║                                                                ║
╚════════════════════════════════════════════════════════════════╝
`;
            throw new Error(errorMessage);
        }

        console.log(
            `✓ Required resources verified: GameData (${gameDataCount}), ` +
                `Locations (${locationCount}), CPU (${cpuCount}), RAM (${ramCount})`,
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

async function verifyEnvVars(): Promise<void> {
    const missingVars: string[] = [];
    for (const varName of ENV_VARS_REQUIRED) {
        if (!env(varName)) {
            missingVars.push(varName);
        }
    }
    if (missingVars.length > 0) {
        const errorMessage = `
╔════════════════════════════════════════════════════════════════╗
║       🚨 CRITICAL: Missing Required Environment Variable       ║
╠════════════════════════════════════════════════════════════════╣
║                                                                ║
║ The following required environment variables are missing:      ║
║                                                                ║
${missingVars.map((v) => `║   • ${v.padEnd(58)} ║`).join('\n')}
║                                                                ║
║ Please set these environment variables before starting the app.║
║                                                                ║
╚════════════════════════════════════════════════════════════════╝
`;
        throw new Error(errorMessage);
    }
    console.log(`✓ All ${ENV_VARS_REQUIRED.length} required ENV-Vars are present`);
}

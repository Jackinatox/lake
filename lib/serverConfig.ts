import { CONFIG_DUMMY_NUMBER, CONFIG_KEY_SUPPORT_EMAIL } from '@/app/GlobalConstants';
import prisma from './prisma';

// --- Schema definition ---
// Add new keys here. Type inference handles the rest — no other changes needed.

type ConfigEntry = { key: string; type: 'number' | 'string' };
type ConfigSchema = Record<string, ConfigEntry>;

const SCHEMA = {
    supportEmail: { key: CONFIG_KEY_SUPPORT_EMAIL, type: 'string' as const },
    dummy_number: { key: CONFIG_DUMMY_NUMBER, type: 'number' as const },
} satisfies ConfigSchema;

type InferConfig<T extends ConfigSchema> = {
    [K in keyof T]: T[K]['type'] extends 'number' ? number : string;
};

type ServerConfig = InferConfig<typeof SCHEMA>;

// Stored on globalThis (not a plain module-level variable) because Next.js gives
// the instrumentation hook and the SSR/route bundles separate module graphs —
// each with its own copy of this module. A plain `let` set during startup would
// not be visible to the rendering bundle, so serverConfig() would throw there.
// Same reason lib/prisma.ts pins its client to global.
const globalForConfig = globalThis as unknown as {
    _serverConfig: ServerConfig | null;
};
globalForConfig._serverConfig ??= null;

export async function initServerConfig(): Promise<void> {
    const allKeys = Object.values(SCHEMA).map((e) => e.key);

    const rows = await prisma.keyValue.findMany({
        where: { key: { in: allKeys } },
        select: { key: true, number: true, string: true },
    });

    const rowMap = new Map(rows.map((r) => [r.key, r]));
    const missing: string[] = [];
    const config: Record<string, number | string> = {};

    for (const [prop, entry] of Object.entries(SCHEMA)) {
        const row = rowMap.get(entry.key);
        const value = entry.type === 'number' ? row?.number : row?.string;
        if (value == null) {
            missing.push(entry.key);
        } else {
            config[prop] = value;
        }
    }

    if (missing.length > 0) {
        throw new Error(`
╔════════════════════════════════════════════════════════════════╗
║       🚨 CRITICAL: Missing Required Server Configuration       ║
╠════════════════════════════════════════════════════════════════╣
║                                                                ║
║ The following required KeyValue entries are missing or have    ║
║ no value set in the database:                                  ║
║                                                                ║
${missing.map((k) => `║   • ${k.padEnd(58)} ║`).join('\n')}
║                                                                ║
║ Please insert these records into the KeyValue table before     ║
║ starting the application.                                      ║
║                                                                ║
╚════════════════════════════════════════════════════════════════╝
`);
    }

    globalForConfig._serverConfig = config as ServerConfig;
    console.log(`✓ Server config loaded (${Object.keys(SCHEMA).length} keys)`);
}

export function serverConfig(): ServerConfig {
    if (!globalForConfig._serverConfig)
        throw new Error('serverConfig not initialized — startup must run first');
    return globalForConfig._serverConfig;
}

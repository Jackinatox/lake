/**
 * One-off backfill: copies each server's backup limit from Pterodactyl into `GameServer.backupCount`.
 *
 * Before worker 1.9.14 the worker created the GameServer row with `backupCount: 0`, while
 * Pterodactyl got the right `feature_limits.backups`. So Pterodactyl is the source of truth
 * here. This does NOT apply to allocations: the worker always sent 2 to Pterodactyl, so
 * those panel values are wrong too.
 *
 * Usage (from the repo root, with DATABASE_URL / NEXT_PUBLIC_PTERODACTYL_URL / PTERODACTYL_API_KEY set):
 *   bun run scripts/backfillBackupCount.ts            # dry run, only prints the diff
 *   bun run scripts/backfillBackupCount.ts --apply    # writes the changes
 *   bun run scripts/backfillBackupCount.ts --only-zero  # only touch rows that are 0 (combinable with --apply)
 */
import prisma from '@/lib/prisma';

const APPLY = process.argv.includes('--apply');
const ONLY_ZERO = process.argv.includes('--only-zero');
// The application API is rate limited (default 240 req/min); stay well below it.
const DELAY_MS = 300;

const panelUrl = process.env.NEXT_PUBLIC_PTERODACTYL_URL;
const apiKey = process.env.PTERODACTYL_API_KEY;
if (!panelUrl || !apiKey) {
    throw new Error('NEXT_PUBLIC_PTERODACTYL_URL and PTERODACTYL_API_KEY must be set');
}

type PtResult =
    { kind: 'ok'; backups: number } | { kind: 'missing' } | { kind: 'error'; message: string };

async function fetchPtBackups(ptAdminId: number): Promise<PtResult> {
    const res = await fetch(`${panelUrl}/api/application/servers/${ptAdminId}`, {
        headers: { Authorization: `Bearer ${apiKey}`, Accept: 'application/json' },
    });
    if (res.status === 404) return { kind: 'missing' };
    if (!res.ok) return { kind: 'error', message: `${res.status} ${await res.text()}` };

    const json = await res.json();
    const backups = json?.attributes?.feature_limits?.backups;
    if (typeof backups !== 'number') {
        return { kind: 'error', message: `no feature_limits.backups in response` };
    }
    return { kind: 'ok', backups };
}

const servers = await prisma.gameServer.findMany({
    where: {
        ptAdminId: { not: null },
        status: { not: 'DELETED' },
        ...(ONLY_ZERO ? { backupCount: 0 } : {}),
    },
    select: {
        id: true,
        ptAdminId: true,
        ptServerId: true,
        backupCount: true,
        status: true,
        name: true,
    },
    orderBy: { createdAt: 'asc' },
});

console.log(
    `${APPLY ? 'APPLY' : 'DRY RUN'}: checking ${servers.length} server(s)${ONLY_ZERO ? ' with backupCount = 0' : ''}\n`,
);

let changed = 0;
let unchanged = 0;
const missing: string[] = [];
const failed: string[] = [];

for (const server of servers) {
    const result = await fetchPtBackups(server.ptAdminId!);
    const label = `${server.id} (pt ${server.ptServerId ?? '?'} / admin ${server.ptAdminId}, ${server.status})`;

    if (result.kind === 'missing') {
        missing.push(label);
    } else if (result.kind === 'error') {
        failed.push(`${label}: ${result.message}`);
    } else if (result.backups === server.backupCount) {
        unchanged++;
    } else {
        changed++;
        console.log(`${label}: backupCount ${server.backupCount} -> ${result.backups}`);
        if (APPLY) {
            await prisma.gameServer.update({
                where: { id: server.id },
                data: { backupCount: result.backups },
            });
        }
    }

    await new Promise((resolve) => setTimeout(resolve, DELAY_MS));
}

console.log(`\n${changed} ${APPLY ? 'updated' : 'would be updated'}, ${unchanged} already correct`);
if (missing.length) {
    console.log(
        `\n${missing.length} not found in Pterodactyl (skipped):\n  ${missing.join('\n  ')}`,
    );
}
if (failed.length) {
    console.log(`\n${failed.length} failed (skipped):\n  ${failed.join('\n  ')}`);
}
if (!APPLY && changed > 0) console.log('\nRun again with --apply to write these changes.');

await prisma.$disconnect();

export {};

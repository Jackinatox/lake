/**
 * One-off backfill: sets each server's port count (allocation limit) to what its customer bought.
 *
 * Before worker 1.10.1 every server was created with a Pterodactyl allocation limit of 2,
 * whatever the resource tier's `ports` was. Pterodactyl is therefore NOT the source of truth
 * here. The target is the `allocations` of the server's latest paid order (what the customer
 * paid for, even if the tier was edited since). See docs/server-ports.md.
 *
 * Per server:
 *   - DB:  `GameServer.allocations` := target
 *   - PT:  `feature_limits.allocations` := max(target, ports already assigned, 1)
 *          (never below the assigned ports; an unlimited (null) limit is left alone)
 *
 * Run it after the fixed worker is deployed, or new servers keep getting a limit of 2.
 *
 * Usage (from the repo root, with DATABASE_URL / NEXT_PUBLIC_PTERODACTYL_URL / PTERODACTYL_API_KEY set):
 *   bun run scripts/backfillAllocations.ts           # dry run, only prints the diff
 *   bun run scripts/backfillAllocations.ts --apply   # writes the changes
 */
import prisma from '@/lib/prisma';
import { allocationLimitToKeep } from '@/lib/Pterodactyl/allocationLimit';

const APPLY = process.argv.includes('--apply');
// The application API is rate limited (default 240 req/min); stay well below it.
const DELAY_MS = 300;

const panelUrl = process.env.NEXT_PUBLIC_PTERODACTYL_URL;
const apiKey = process.env.PTERODACTYL_API_KEY;
if (!panelUrl || !apiKey) {
    throw new Error('NEXT_PUBLIC_PTERODACTYL_URL and PTERODACTYL_API_KEY must be set');
}
const ptHeaders = {
    Authorization: `Bearer ${apiKey}`,
    Accept: 'application/json',
    'Content-Type': 'application/json',
};

interface PtServerAttributes {
    allocation: number;
    oom_disabled: boolean;
    limits: {
        memory: number;
        swap: number;
        disk: number;
        io: number;
        cpu: number;
        threads: string | null;
    };
    feature_limits: { allocations: number | null; databases: number | null; backups: number };
    relationships: { allocations: { data: unknown[] } };
}

type PtResult =
    | { kind: 'ok'; server: PtServerAttributes }
    | { kind: 'missing' }
    | { kind: 'error'; message: string };

async function fetchPtServer(ptAdminId: number): Promise<PtResult> {
    const res = await fetch(
        `${panelUrl}/api/application/servers/${ptAdminId}?include=allocations`,
        {
            headers: ptHeaders,
        },
    );
    if (res.status === 404) return { kind: 'missing' };
    if (!res.ok) return { kind: 'error', message: `GET ${res.status} ${await res.text()}` };

    const server = (await res.json())?.attributes as PtServerAttributes | undefined;
    if (
        !server?.limits ||
        !server.feature_limits ||
        !Array.isArray(server.relationships?.allocations?.data)
    ) {
        return { kind: 'error', message: 'unexpected server response' };
    }
    return { kind: 'ok', server };
}

/** PATCH /build replaces the whole build, so every other value is sent back unchanged. */
async function setPtAllocationLimit(ptAdminId: number, server: PtServerAttributes, limit: number) {
    const res = await fetch(`${panelUrl}/api/application/servers/${ptAdminId}/build`, {
        method: 'PATCH',
        headers: ptHeaders,
        body: JSON.stringify({
            allocation: server.allocation,
            memory: server.limits.memory,
            swap: server.limits.swap,
            disk: server.limits.disk,
            io: server.limits.io,
            cpu: server.limits.cpu,
            threads: server.limits.threads,
            oom_disabled: server.oom_disabled,
            feature_limits: {
                allocations: limit,
                databases: server.feature_limits.databases,
                backups: server.feature_limits.backups,
            },
        }),
    });
    if (!res.ok) throw new Error(`PATCH ${res.status} ${await res.text()}`);
}

const servers = await prisma.gameServer.findMany({
    where: { ptAdminId: { not: null }, status: { not: 'DELETED' } },
    select: {
        id: true,
        ptAdminId: true,
        ptServerId: true,
        allocations: true,
        status: true,
        ServerOrder: {
            where: { status: { in: ['PAID', 'PARTIALLY_REFUNDED'] } },
            orderBy: { createdAt: 'desc' },
            take: 1,
            select: { id: true, allocations: true },
        },
    },
    orderBy: { createdAt: 'asc' },
});

console.log(`${APPLY ? 'APPLY' : 'DRY RUN'}: checking ${servers.length} server(s)\n`);

let changed = 0;
let unchanged = 0;
const noOrder: string[] = [];
const missing: string[] = [];
const failed: string[] = [];

for (const server of servers) {
    const label = `${server.id} (pt ${server.ptServerId ?? '?'} / admin ${server.ptAdminId}, ${server.status})`;
    const latestOrder = server.ServerOrder[0];
    if (!latestOrder) {
        noOrder.push(label);
        continue;
    }

    const result = await fetchPtServer(server.ptAdminId!);
    if (result.kind === 'missing') {
        missing.push(label);
    } else if (result.kind === 'error') {
        failed.push(`${label}: ${result.message}`);
    } else {
        const target = latestOrder.allocations;
        const assigned = result.server.relationships.allocations.data.length;
        const ptLimit = result.server.feature_limits.allocations;
        // null = unlimited in Pterodactyl; leave such a server's panel limit alone.
        const newPtLimit = ptLimit === null ? null : allocationLimitToKeep(target, assigned);

        const dbChanges = server.allocations !== target;
        const ptChanges = newPtLimit !== null && newPtLimit !== ptLimit;

        if (!dbChanges && !ptChanges) {
            unchanged++;
        } else {
            changed++;
            console.log(
                `${label}: order ${target} | db ${server.allocations}${dbChanges ? ` -> ${target}` : ''}` +
                    ` | pt ${ptLimit ?? 'unlimited'}${ptChanges ? ` -> ${newPtLimit}` : ''} | assigned ${assigned}`,
            );
            if (APPLY) {
                try {
                    if (ptChanges)
                        await setPtAllocationLimit(server.ptAdminId!, result.server, newPtLimit!);
                    if (dbChanges) {
                        await prisma.gameServer.update({
                            where: { id: server.id },
                            data: { allocations: target },
                        });
                    }
                } catch (error) {
                    changed--;
                    failed.push(
                        `${label}: ${error instanceof Error ? error.message : String(error)}`,
                    );
                }
            }
        }
    }

    await new Promise((resolve) => setTimeout(resolve, DELAY_MS));
}

console.log(`\n${changed} ${APPLY ? 'updated' : 'would be updated'}, ${unchanged} already correct`);
if (noOrder.length) {
    console.log(`\n${noOrder.length} without a paid order (skipped):\n  ${noOrder.join('\n  ')}`);
}
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

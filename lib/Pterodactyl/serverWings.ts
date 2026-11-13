import 'server-only';
import { logger } from '@/lib/logger';

/**
 * Which wing each server runs on, asked from the worker (`POST /v1/servers/wings`),
 * which reads it from the Pterodactyl database. Lake itself has no connection to that
 * database on purpose. See `docs/admin-gameserver-panel.md`.
 *
 * Used only by the admin gameserver list, so a slow or unreachable worker must never hold
 * the page: after `SERVER_WINGS_TIMEOUT_MS` the lookup gives up and the list renders
 * with an error instead of wing names.
 */

export const SERVER_WINGS_TIMEOUT_MS = 2000;

export type ServerWing = { id: number; name: string };

/** `wings` is keyed by `ptAdminId`; an id the panel does not know is simply absent. */
export type ServerWingsResult =
    { ok: true; wings: Record<number, ServerWing> } | { ok: false; error: string };

export async function fetchServerWings(ptAdminIds: number[]): Promise<ServerWingsResult> {
    const ids = [...new Set(ptAdminIds)];
    if (ids.length === 0) return { ok: true, wings: {} };

    const workerUrl = process.env.WORKER_IP;
    if (!workerUrl) return { ok: false, error: 'WORKER_IP is not set' };

    let response: Response;
    try {
        response = await fetch(`${workerUrl}/v1/servers/wings`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ ptAdminIds: ids }),
            cache: 'no-store',
            signal: AbortSignal.timeout(SERVER_WINGS_TIMEOUT_MS),
        });
    } catch (error) {
        const timedOut = error instanceof Error && error.name === 'TimeoutError';
        return fail(
            timedOut
                ? `Worker did not answer within ${SERVER_WINGS_TIMEOUT_MS / 1000} s`
                : 'Worker unreachable',
            error,
        );
    }

    if (!response.ok) {
        return fail(`Worker answered ${response.status}`);
    }

    // The timeout signal also covers reading the body, so a stalled body ends up here too.
    try {
        const data = (await response.json()) as { wings?: Record<number, ServerWing> };
        return { ok: true, wings: data.wings ?? {} };
    } catch (error) {
        const timedOut = error instanceof Error && error.name === 'TimeoutError';
        return fail(
            timedOut
                ? `Worker did not finish answering within ${SERVER_WINGS_TIMEOUT_MS / 1000} s`
                : 'Worker sent an unreadable answer',
            error,
        );
    }
}

function fail(message: string, error?: unknown): ServerWingsResult {
    logger.warn(`Wing lookup failed: ${message}`, 'SYSTEM', {
        details: error instanceof Error ? { error: error.message } : undefined,
    });
    return { ok: false, error: message };
}

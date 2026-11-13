import 'server-only';

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

    try {
        const response = await fetch(`${workerUrl}/v1/servers/wings`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ ptAdminIds: ids }),
            cache: 'no-store',
            signal: AbortSignal.timeout(SERVER_WINGS_TIMEOUT_MS),
        });

        if (!response.ok) {
            return { ok: false, error: `Worker answered ${response.status}` };
        }

        const data = (await response.json()) as { wings?: Record<number, ServerWing> };
        return { ok: true, wings: data.wings ?? {} };
    } catch (error) {
        const timedOut = error instanceof Error && error.name === 'TimeoutError';
        return {
            ok: false,
            error: timedOut
                ? `Worker did not answer within ${SERVER_WINGS_TIMEOUT_MS / 1000} s`
                : 'Worker unreachable',
        };
    }
}

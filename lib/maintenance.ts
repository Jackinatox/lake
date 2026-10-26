/**
 * Emergency maintenance switch for when the Pterodactyl panel is taken offline.
 *
 * Read from the `MAINTENANCE_MODE` env var at request time (not a KeyValue row) so it works
 * even when nothing behind the panel can be trusted, and so the proxy can read it without a
 * DB round trip. Toggle it and restart the container. See `docs/maintenance-mode.md`.
 */
export function isMaintenanceMode(): boolean {
    return process.env.MAINTENANCE_MODE === 'true';
}

/**
 * Paths that talk to a user's gameserver or provision a new one. While in maintenance the
 * proxy redirects every match — with or without a locale prefix — to `/maintenance`.
 */
export const MAINTENANCE_BLOCKED_PATH = /^\/(?:(de|en)\/)?(?:gameserver|order)(?:\/.*)?$/;

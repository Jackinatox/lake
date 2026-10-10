/**
 * Deep links into the Pterodactyl panel.
 *
 * `NEXT_PUBLIC_PTERODACTYL_URL` is public, so these work in client components too. Every
 * helper returns `null` when the panel URL or the id is missing — a server that never
 * finished provisioning has no `ptServerId`, and a user created before the panel sync has
 * no `ptUserId`, so callers render nothing instead of a broken link.
 *
 * Which id goes where:
 * - `ptServerId` is the *client* identifier (short uuid) — the one `/api/client/servers/...`
 *   uses, and the one the end-user panel URL is built from.
 * - `ptAdminId` is the numeric panel id, only valid under `/admin/servers/view/...`.
 */

function panelBase(): string | null {
    const url = process.env.NEXT_PUBLIC_PTERODACTYL_URL;
    return url ? url.replace(/\/+$/, '') : null;
}

/** End-user view of the server (console, files) — `{panel}/server/{ptServerId}`. */
export function panelServerUrl(ptServerId: string | null | undefined): string | null {
    const base = panelBase();
    return base && ptServerId ? `${base}/server/${ptServerId}` : null;
}

/** Admin view of the server (build config, startup, node) — `{panel}/admin/servers/view/{ptAdminId}`. */
export function panelAdminServerUrl(ptAdminId: number | null | undefined): string | null {
    const base = panelBase();
    return base && ptAdminId ? `${base}/admin/servers/view/${ptAdminId}` : null;
}

/** Admin view of the panel account that owns the servers — `{panel}/admin/users/view/{ptUserId}`. */
export function panelAdminUserUrl(ptUserId: number | null | undefined): string | null {
    const base = panelBase();
    return base && ptUserId ? `${base}/admin/users/view/${ptUserId}` : null;
}

/**
 * Global API key permission constants.
 *
 * Permissions follow the format `action:resource`.
 * Stored natively in better-auth's `permissions` column as `Record<string, string[]>`.
 *
 * The flat `read:financial_data` format is the developer-facing API;
 * converters below translate to/from better-auth's `{ financial_data: ["read"] }` shape.
 */
export const ApiKeyPermission = {
    // Financial data
    READ_FINANCIAL_DATA: 'read:financial_data',
    WRITE_FINANCIAL_DATA: 'write:financial_data',
    // User statistics
    READ_USER_STATS: 'read:user_stats',
    WRITE_USER_STATS: 'write:user_stats',
    // Game server statistics
    READ_GAMESERVER_STATS: 'read:gameserver_stats',
    WRITE_GAMESERVER_STATS: 'write:gameserver_stats',
    // System status and logs
    READ_SYSTEM_STATUS: 'read:system_status',
    READ_PROMETHEUS_METRICS: 'read:prometheus_metrics',
    READ_STATUS_GENERAL: 'read:status_general',
    READ_STATUS_UPTIME: 'read:status_uptime',
} as const;

export type ApiKeyPermission = (typeof ApiKeyPermission)[keyof typeof ApiKeyPermission];

/** All permission values — useful for rendering checkboxes. */
export const ALL_PERMISSIONS = Object.values(ApiKeyPermission) as ApiKeyPermission[];

// ── Format converters ────────────────────────────────────────────────────────

/** Flat permission strings → better-auth Record format. */
export function permissionsToRecord(perms: ApiKeyPermission[]): Record<string, string[]> {
    const record: Record<string, string[]> = {};
    for (const p of perms) {
        const idx = p.indexOf(':');
        const action = p.slice(0, idx);
        const resource = p.slice(idx + 1);
        (record[resource] ??= []).push(action);
    }
    return record;
}

/** better-auth Record format → flat permission strings. */
export function recordToPermissions(record: Record<string, string[]>): ApiKeyPermission[] {
    const out: ApiKeyPermission[] = [];
    for (const [resource, actions] of Object.entries(record)) {
        for (const action of actions) {
            const flat = `${action}:${resource}` as ApiKeyPermission;
            if (ALL_PERMISSIONS.includes(flat)) out.push(flat);
        }
    }
    return out;
}

// ── DB helpers ───────────────────────────────────────────────────────────────

/**
 * Parse the `permissions` column (JSON TEXT) from the apikey table into flat strings.
 *
 * @example
 * const perms = parseApiKeyPermissions(key.permissions);
 * // → ['read:financial_data', 'write:user_stats']
 */
export function parseApiKeyPermissions(permissions: string | null | undefined): ApiKeyPermission[] {
    if (!permissions) return [];
    try {
        return recordToPermissions(JSON.parse(permissions) as Record<string, string[]>);
    } catch {
        return [];
    }
}

/**
 * Check whether a key's `permissions` column contains a specific permission.
 *
 * @example
 * // In an API route — use verifyApiKey with required permissions for the fast path:
 * const { valid } = await auth.api.verifyApiKey({
 *   body: {
 *     key: incoming,
 *     permissions: permissionsToRecord([ApiKeyPermission.READ_FINANCIAL_DATA]),
 *   },
 * });
 *
 * // Or check manually after verification:
 * if (!hasApiKeyPermission(key.permissions, ApiKeyPermission.READ_FINANCIAL_DATA)) { … }
 */
export function hasApiKeyPermission(
    permissions: string | null | undefined,
    permission: ApiKeyPermission,
): boolean {
    return parseApiKeyPermissions(permissions).includes(permission);
}

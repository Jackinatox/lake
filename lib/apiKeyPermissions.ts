/**
 * Global API key permission constants.
 *
 * Permissions follow the format `read:<resource>` / `write:<resource>`.
 * Store as JSON array in key metadata; check with `hasApiKeyPermission` in API routes.
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
    // System monitoring
    READ_SYSTEM_STATUS: 'read:system_status',
    WRITE_SYSTEM_STATUS: 'write:system_status',
} as const;

export type ApiKeyPermission = (typeof ApiKeyPermission)[keyof typeof ApiKeyPermission];

/** All permission values as a sorted array — useful for rendering checkboxes. */
export const ALL_PERMISSIONS = Object.values(ApiKeyPermission) as ApiKeyPermission[];

/**
 * Check whether a key's raw metadata JSON string contains the given permission.
 *
 * @example
 * // In an API route:
 * const { valid, key } = await auth.api.verifyApiKey({ body: { key: incoming } });
 * if (!valid || !hasApiKeyPermission(key.metadata, ApiKeyPermission.READ_FINANCIAL_DATA)) {
 *   return Response.json({ error: 'Forbidden' }, { status: 403 });
 * }
 */
export function hasApiKeyPermission(
    metadata: string | null | undefined,
    permission: ApiKeyPermission,
): boolean {
    if (!metadata) return false;
    try {
        const parsed = JSON.parse(metadata) as { permissions?: ApiKeyPermission[] };
        return (parsed.permissions ?? []).includes(permission);
    } catch {
        return false;
    }
}

/** Parse the permissions array out of a raw metadata JSON string. */
export function parseApiKeyPermissions(metadata: string | null | undefined): ApiKeyPermission[] {
    if (!metadata) return [];
    try {
        const parsed = JSON.parse(metadata) as { permissions?: ApiKeyPermission[] };
        return parsed.permissions ?? [];
    } catch {
        return [];
    }
}

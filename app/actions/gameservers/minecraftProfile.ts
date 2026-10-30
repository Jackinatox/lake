'use server';

import { createHash } from 'crypto';
import { headers } from 'next/headers';

import { auth } from '@/auth';

const MINECRAFT_NAME_PATTERN = /^[A-Za-z0-9_]{3,16}$/;

export type MinecraftProfileResult =
    | { status: 'ok'; uuid: string; name: string }
    | { status: 'not_found' }
    | { status: 'invalid_name' }
    | { status: 'error' };

function dashUuid(hex: string) {
    return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
}

/** Same algorithm as Java's `UUID.nameUUIDFromBytes("OfflinePlayer:" + name)`. */
function offlineUuid(name: string) {
    const bytes = createHash('md5').update(`OfflinePlayer:${name}`, 'utf8').digest();
    bytes[6] = (bytes[6] & 0x0f) | 0x30; // version 3
    bytes[8] = (bytes[8] & 0x3f) | 0x80; // IETF variant
    return dashUuid(bytes.toString('hex'));
}

/**
 * Resolves a Minecraft player name to the `{ uuid, name }` pair `whitelist.json` expects.
 *
 * Runs server-side because the Mojang API sends no CORS headers. Requires a session so
 * this is not an open proxy. For servers with `online-mode=false` the player's UUID is
 * derived from the name instead, exactly like the server itself does.
 */
export async function lookupMinecraftProfile(
    name: string,
    offline: boolean,
): Promise<MinecraftProfileResult> {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session?.user) return { status: 'error' };

    const trimmed = name.trim();
    if (!MINECRAFT_NAME_PATTERN.test(trimmed)) return { status: 'invalid_name' };

    if (offline) {
        return { status: 'ok', uuid: offlineUuid(trimmed), name: trimmed };
    }

    try {
        const response = await fetch(
            `https://api.mojang.com/users/profiles/minecraft/${encodeURIComponent(trimmed)}`,
            { cache: 'no-store', signal: AbortSignal.timeout(8000) },
        );

        if (response.status === 404 || response.status === 204) return { status: 'not_found' };
        if (!response.ok) return { status: 'error' };

        const data = (await response.json()) as { id?: string; name?: string };
        if (!data.id || !data.name || !/^[0-9a-f]{32}$/i.test(data.id)) {
            return { status: 'not_found' };
        }

        return { status: 'ok', uuid: dashUuid(data.id.toLowerCase()), name: data.name };
    } catch {
        return { status: 'error' };
    }
}

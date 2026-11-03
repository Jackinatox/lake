import { useServerFile } from '@/hooks/useServerFile';
import { propertiesFormat } from '@/lib/gameConfig/formats/properties';
import { useMemo } from 'react';
import {
    ONLINE_MODE_KEY,
    SERVER_PROPERTIES_PATH,
    WHITELIST_KEY,
    WHITELIST_PATH,
} from './constants';

export interface WhitelistEntry {
    uuid: string;
    name: string;
}

export function parseWhitelist(content: string | null): WhitelistEntry[] {
    if (!content || content.trim() === '') return [];
    const data: unknown = JSON.parse(content);
    if (!Array.isArray(data)) throw new Error('whitelist.json is not an array');
    return data
        .filter(
            (entry): entry is WhitelistEntry =>
                typeof entry?.uuid === 'string' && typeof entry?.name === 'string',
        )
        .map(({ uuid, name }) => ({ uuid, name }));
}

export function serializeWhitelist(entries: WhitelistEntry[]): string {
    // Same shape and indentation the Minecraft server writes.
    return JSON.stringify(entries, null, 2);
}

/**
 * Shared view of `server.properties` + `whitelist.json`, used by both the whitelist panel
 * and the tab's attention dot (both read the same cached files).
 */
export function useMinecraftWhitelist(
    serverId: string,
    apiKey: string,
    options?: { revalidateOnMount?: boolean },
) {
    const properties = useServerFile(serverId, SERVER_PROPERTIES_PATH, apiKey, options);
    const whitelist = useServerFile(serverId, WHITELIST_PATH, apiKey, options);

    const propertiesDoc = useMemo(
        () => (properties.content !== null ? propertiesFormat.parse(properties.content) : null),
        [properties.content],
    );

    const { players, whitelistInvalid } = useMemo(() => {
        try {
            return { players: parseWhitelist(whitelist.content), whitelistInvalid: false };
        } catch {
            return { players: [] as WhitelistEntry[], whitelistInvalid: true };
        }
    }, [whitelist.content]);

    const enabled = propertiesDoc
        ? propertiesFormat.get(propertiesDoc, WHITELIST_KEY) === 'true'
        : false;
    const onlineMode = propertiesDoc
        ? propertiesFormat.get(propertiesDoc, ONLINE_MODE_KEY) !== 'false'
        : true;

    const loaded = properties.loaded && whitelist.loaded;

    /** Whitelist is on and nobody is on it: nobody can join the server. */
    const lockedOut =
        loaded &&
        propertiesDoc !== null &&
        enabled &&
        !whitelist.error &&
        !whitelistInvalid &&
        players.length === 0;

    return {
        properties,
        whitelist,
        loaded,
        enabled,
        onlineMode,
        players,
        whitelistInvalid,
        lockedOut,
    };
}

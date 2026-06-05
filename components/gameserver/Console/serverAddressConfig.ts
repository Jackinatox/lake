/**
 * Per-game configuration for how a server's primary connection address is shown.
 *
 * This component only surfaces what the player needs to connect (the default
 * allocation). Every other port is managed in the Network Manager.
 *
 * primaryMode:
 *   'combined' → the player copies the whole "address:port" string in one click
 *                (e.g. Minecraft, Valheim).
 *   'separate' → the address and the port are copied independently because the
 *                game asks for them in separate fields (e.g. Satisfactory).
 *
 * This is the single place to tune presentation for a game — add an entry keyed
 * by the game slug.
 */
export type PrimaryMode = 'combined' | 'separate';

export interface ServerAddressConfig {
    primaryMode: PrimaryMode;
}

const DEFAULT_CONFIG: ServerAddressConfig = {
    primaryMode: 'combined',
};

const SERVER_ADDRESS_CONFIG: Record<string, ServerAddressConfig> = {
    minecraft: { primaryMode: 'combined' },
    valheim: { primaryMode: 'combined' },
    satisfactory: { primaryMode: 'separate' },
    factorio: { primaryMode: 'combined' },
};

/** Resolve the address-display config for a game slug, falling back to defaults. */
export function getServerAddressConfig(gameSlug: string): ServerAddressConfig {
    return SERVER_ADDRESS_CONFIG[gameSlug] ?? DEFAULT_CONFIG;
}

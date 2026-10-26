import type { ConfigCategory, ConfigField } from '@/lib/gameConfig/types';
import { ENFORCE_WHITELIST_KEY, WHITELIST_KEY } from './constants';

export const MINECRAFT_PROPERTY_CATEGORIES: ConfigCategory[] = [
    { id: 'gameplay' },
    { id: 'players' },
    { id: 'world' },
    { id: 'performance' },
    { id: 'resourcePack' },
    { id: 'network' },
];

/**
 * Curated `server.properties` keys. Only keys that exist in the server's file are shown,
 * so listing keys that some Minecraft versions don't have (or no longer have) is harmless.
 */
export const MINECRAFT_PROPERTY_FIELDS: ConfigField[] = [
    // Gameplay
    { key: 'motd', id: 'motd', type: 'string', category: 'gameplay' },
    {
        key: 'difficulty',
        id: 'difficulty',
        type: 'enum',
        category: 'gameplay',
        options: [
            { value: 'peaceful', id: 'peaceful' },
            { value: 'easy', id: 'easy' },
            { value: 'normal', id: 'normal' },
            { value: 'hard', id: 'hard' },
        ],
    },
    {
        key: 'gamemode',
        id: 'gamemode',
        type: 'enum',
        category: 'gameplay',
        options: [
            { value: 'survival', id: 'survival' },
            { value: 'creative', id: 'creative' },
            { value: 'adventure', id: 'adventure' },
            { value: 'spectator', id: 'spectator' },
        ],
    },
    { key: 'force-gamemode', id: 'forceGamemode', type: 'boolean', category: 'gameplay' },
    { key: 'hardcore', id: 'hardcore', type: 'boolean', category: 'gameplay' },
    { key: 'pvp', id: 'pvp', type: 'boolean', category: 'gameplay' },
    { key: 'allow-flight', id: 'allowFlight', type: 'boolean', category: 'gameplay' },
    {
        key: 'spawn-protection',
        id: 'spawnProtection',
        type: 'number',
        category: 'gameplay',
        min: 0,
    },
    { key: 'spawn-monsters', id: 'spawnMonsters', type: 'boolean', category: 'gameplay' },
    { key: 'spawn-animals', id: 'spawnAnimals', type: 'boolean', category: 'gameplay' },
    { key: 'spawn-npcs', id: 'spawnNpcs', type: 'boolean', category: 'gameplay' },

    // Players
    { key: 'max-players', id: 'maxPlayers', type: 'number', category: 'players', min: 1 },
    {
        key: 'online-mode',
        id: 'onlineMode',
        type: 'boolean',
        category: 'players',
        warning: true,
    },
    {
        key: 'enforce-secure-profile',
        id: 'enforceSecureProfile',
        type: 'boolean',
        category: 'players',
    },
    {
        key: 'player-idle-timeout',
        id: 'playerIdleTimeout',
        type: 'number',
        category: 'players',
        min: 0,
    },
    {
        key: 'op-permission-level',
        id: 'opPermissionLevel',
        type: 'enum',
        category: 'players',
        options: [
            { value: '1', id: 'level1' },
            { value: '2', id: 'level2' },
            { value: '3', id: 'level3' },
            { value: '4', id: 'level4' },
        ],
    },
    {
        key: 'enable-command-block',
        id: 'enableCommandBlock',
        type: 'boolean',
        category: 'players',
    },
    {
        key: 'hide-online-players',
        id: 'hideOnlinePlayers',
        type: 'boolean',
        category: 'players',
    },

    // World
    { key: 'level-seed', id: 'levelSeed', type: 'string', category: 'world', warning: true },
    { key: 'level-name', id: 'levelName', type: 'string', category: 'world', warning: true },
    {
        key: 'level-type',
        id: 'levelType',
        type: 'enum',
        category: 'world',
        warning: true,
        options: [
            { value: 'minecraft:normal', id: 'normal' },
            { value: 'minecraft:flat', id: 'flat' },
            { value: 'minecraft:large_biomes', id: 'largeBiomes' },
            { value: 'minecraft:amplified', id: 'amplified' },
            { value: 'minecraft:single_biome_surface', id: 'singleBiome' },
        ],
    },
    {
        key: 'generate-structures',
        id: 'generateStructures',
        type: 'boolean',
        category: 'world',
        warning: true,
    },
    { key: 'allow-nether', id: 'allowNether', type: 'boolean', category: 'world' },
    {
        key: 'max-world-size',
        id: 'maxWorldSize',
        type: 'number',
        category: 'world',
        min: 1,
        max: 29999984,
    },

    // Performance
    {
        key: 'view-distance',
        id: 'viewDistance',
        type: 'number',
        category: 'performance',
        min: 3,
        max: 32,
    },
    {
        key: 'simulation-distance',
        id: 'simulationDistance',
        type: 'number',
        category: 'performance',
        min: 3,
        max: 32,
    },
    {
        key: 'pause-when-empty-seconds',
        id: 'pauseWhenEmptySeconds',
        type: 'number',
        category: 'performance',
        min: 0,
    },
    {
        key: 'sync-chunk-writes',
        id: 'syncChunkWrites',
        type: 'boolean',
        category: 'performance',
    },

    // Resource pack
    { key: 'resource-pack', id: 'resourcePack', type: 'string', category: 'resourcePack' },
    {
        key: 'require-resource-pack',
        id: 'requireResourcePack',
        type: 'boolean',
        category: 'resourcePack',
    },

    // Network: ports and IP are owned by the Pterodactyl allocation
    { key: 'server-port', id: 'serverPort', type: 'number', category: 'network', locked: true },
    { key: 'server-ip', id: 'serverIp', type: 'string', category: 'network', locked: true },
    { key: 'query.port', id: 'queryPort', type: 'number', category: 'network', locked: true },
    { key: 'rcon.port', id: 'rconPort', type: 'number', category: 'network', locked: true },
];

/** Owned by the whitelist panel; hidden in the properties editor. */
export const MINECRAFT_PROPERTY_EXCLUDED_KEYS = [WHITELIST_KEY, ENFORCE_WHITELIST_KEY];

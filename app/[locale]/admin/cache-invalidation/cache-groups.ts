// Define cache groups and keys here
// When you add a new cache tag somewhere in your code, add it here

export const CACHE_GROUPS = {
    keyValue: {
        name: 'Key-Value Store',
        keys: ['keyValue'],
    },
    gameServers: {
        name: 'Game Servers',
        keys: ['gameServers', 'gameServer'],
    },
    users: {
        name: 'Users',
        keys: ['users', 'user'],
    },
} as const;

export type CacheGroupKey = keyof typeof CACHE_GROUPS;

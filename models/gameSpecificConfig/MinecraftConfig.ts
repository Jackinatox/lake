export interface MinecraftConfig {
    serverName: string;
    maxPlayers: number;
    viewDistance: number;
    difficulty: 'peaceful' | 'easy' | 'normal' | 'hard';
    enablePvp: boolean;
    enableNether: boolean;
    enableCommandBlocks: boolean;
    spawnProtection: number;
    allowFlight: boolean;
    flavor: string;
}
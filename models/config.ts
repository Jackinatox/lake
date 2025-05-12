export interface PerformanceGroup {
  id: number;
  Name: string;
  DiskPrice: number;
  PortsLimit: number;
  BackupLimit: number;
  Enabled: boolean;
  ptLocationId: number;
  CPU: CpuType;
  RAM: RamOption;
}

export interface CpuType {
  id: number
  Name: string
  Cores: number
  Threads: number
  SingleScore: number
  MultiScore: number
  price_per_core: number
  min_threads: number
  max_threads: number
}

export interface RamOption {
  id: number
  Name: string
  Speed: number
  price_per_gb: number
  min_gb: number
  max_gb: number
}

export interface DiskOption {
  id: number
  size_gb: number
  price_per_gb: number
}

export interface Game {
  id: number
  name: string
  data : any
}

export interface GameFlavor {
  id: number
  game_id: number
  name: string
  description: string | null
}

export interface HardwareConfig {
  pfGroupId: number
  cpuCores: number
  ramGb: number
}

export interface ServerConfig {
  hardwareConfig: HardwareConfig
  gameConfig: GameConfig
}

export interface MinecraftConfig {
  serverName: string
  maxPlayers: number
  viewDistance: number
  difficulty: string
  enablePvp: boolean
  enableNether: boolean
  enableCommandBlocks: boolean
  spawnProtection: number
  allowFlight: boolean
}

export interface SatisfactoryConfig {
  isEarlyAccess: boolean
  maxPlayers?: number
  serverName?: string
}

// Updated GameConfig to match your structure
export interface GameConfig {
  gameId: number
  gameType: string
  flavorId: number
  eggId: number
  version: string
  gameSpecificConfig: Record<string, any> // Game-specific configuration
}

export interface ServerConfig {
  hardwareConfig: HardwareConfig
  gameConfig: GameConfig
}

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


export interface HardwareConfig {
  pfGroupId: number
  cpuCores: number
  ramGb: number
  diskMb: number
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
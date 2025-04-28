export interface CpuType {
  id: number
  Name: string
  description: string | null
  price_per_core: number
  min_threads: number
  max_threads: number
}

export interface RamOption {
  id: number
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
  description: string | null
  icon_url: string | null
}

export interface GameFlavor {
  id: number
  game_id: number
  name: string
  description: string | null
}

export interface GameVersion {
  id: number
  game_flavor_id: number
  version: string
}

export interface HardwareConfig {
  cpuTypeId: number
  cpuCores: number
  ramGb: number
  diskGb: number
  totalPrice: number
}

export interface GameConfig {
  gameId: number
  gameFlavorId: number
  gameVersionId: number
  additionalConfig?: Record<string, any>
}

export interface ServerConfig {
  hardwareConfig: HardwareConfig
  gameConfig: GameConfig
}

export interface ValheimBaseConfig {
  server_name: string;
  password: string;
  world_name: string;
  max_players: number;
  public_server: boolean;
  enable_crossplay: boolean;
  auto_update: boolean;
  backup_count: number;
  backup_interval: number;
  backup_shorttime: number;
  backup_longtime: number;
}

export interface ValheimVanillaConfig extends ValheimBaseConfig {
  mode: 'vanilla';
}

export interface ValheimModdedConfig extends ValheimBaseConfig {
  mode: 'modded';
  modpack?: string;
}

export type ValheimConfig = ValheimVanillaConfig | ValheimModdedConfig;
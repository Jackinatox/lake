export interface ValheimConfig {
    mode: 'vanilla' | 'modded';
    password: string;
    world_name: string;
    max_players: number;
    public_server: boolean;
    enable_crossplay: boolean;
    backup_interval: number;
    backup_count: number;
    modpack?: string;
}

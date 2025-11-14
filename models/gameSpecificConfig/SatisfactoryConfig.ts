export interface SatisfactoryConfig {
    version: 'release' | 'experimental';
    max_players: number;
    num_autosaves: number;
    upload_crash_report: boolean;
    autosave_interval: number;
}

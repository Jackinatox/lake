export interface HytaleConfig {
    auth_mode: 'authenticated' | 'offline';
    patchline: 'release' | 'pre-release';
    accept_early_plugins: boolean;
    allow_op: boolean;
    install_sourcequery_plugin: boolean;
    // Hidden from UI - set to defaults
    disable_sentry: boolean;
    use_aot_cache: boolean;
}
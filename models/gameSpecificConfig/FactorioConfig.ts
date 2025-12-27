export type FactorioVersion = 'latest' | 'experimental' | 'custom';

export type FactorioDLC = 'elevated-rails' | 'quality' | 'space-age';

export interface FactorioConfig {
    version: FactorioVersion;
    customVersion?: string; // Only used when version is 'custom'
    maxSlots: number; // 1 to 32767 (smallint)
    saveName: string; // max 20 characters
    serverDescription: string; // max 100 characters
    autoSaveInterval: number; // 1-999 (1-3 digits)
    autoSaveSlots: number; // slider value
    afkKick: boolean;
    enabledDLCs: FactorioDLC[];
}

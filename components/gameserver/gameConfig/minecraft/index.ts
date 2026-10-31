import type { GameConfigModule } from '../types';
import PropertiesPanel from './PropertiesPanel';
import { useMinecraftWhitelist } from './useMinecraftWhitelist';
import WhitelistPanel from './WhitelistPanel';

export const minecraftConfig: GameConfigModule = {
    panels: [
        { id: 'whitelist', Component: WhitelistPanel },
        { id: 'properties', Component: PropertiesPanel },
    ],
    useAttention: ({ server, apiKey }) =>
        useMinecraftWhitelist(server.identifier, apiKey).lockedOut,
};

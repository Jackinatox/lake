import type { GameServer } from '@/models/gameServerModel';
import type { LucideIcon } from 'lucide-react';
import type { ComponentType } from 'react';

export interface GameConfigPanelProps {
    server: GameServer;
    apiKey: string;
}

export interface GameConfigPanel {
    id: string;
    Component: ComponentType<GameConfigPanelProps>;
}

/**
 * Everything one game contributes to the dashboard's "Config" tab.
 * Panels render inside the WebSocketProvider, so they may use `useServerStatus`,
 * `useSendCommand` etc.
 */
/** Label and icon of the dashboard tab. The tab's value stays `config` either way. */
export interface GameConfigTabInfo {
    /** Key under `gameserver.tabs` (en + de). */
    labelKey: 'config' | 'map';
    icon: LucideIcon;
}

export interface GameConfigModule {
    panels: GameConfigPanel[];
    /** Overrides the "Config" label and icon, for games whose tab isn't about config files. */
    tab?: GameConfigTabInfo;
    /**
     * React hook, called unconditionally from the always-mounted tab trigger.
     * Returns true when something in the tab needs the user's attention (amber dot).
     * Keep it cheap: share data with the panels via `useServerFile` so nothing is fetched twice.
     */
    useAttention?: (props: GameConfigPanelProps) => boolean;
}

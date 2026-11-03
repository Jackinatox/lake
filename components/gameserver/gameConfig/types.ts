import type { GameServer } from '@/models/gameServerModel';
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
export interface GameConfigModule {
    panels: GameConfigPanel[];
    /**
     * React hook, called unconditionally from the always-mounted tab trigger.
     * Returns true when something in the tab needs the user's attention (amber dot).
     * Keep it cheap: share data with the panels via `useServerFile` so nothing is fetched twice.
     */
    useAttention?: (props: GameConfigPanelProps) => boolean;
}

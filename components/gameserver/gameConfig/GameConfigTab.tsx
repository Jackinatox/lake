'use client';

import type { GameConfigModule, GameConfigPanelProps } from './types';

interface GameConfigTabProps extends GameConfigPanelProps {
    module: GameConfigModule;
}

export default function GameConfigTab({ module, server, apiKey }: GameConfigTabProps) {
    return (
        <div className="h-full min-h-72 space-y-3">
            {module.panels.map(({ id, Component }) => (
                <Component key={id} server={server} apiKey={apiKey} />
            ))}
        </div>
    );
}

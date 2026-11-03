'use client';

import { useTranslations } from 'next-intl';
import type { GameConfigModule, GameConfigPanelProps } from './types';

interface GameConfigAttentionDotProps extends GameConfigPanelProps {
    useAttention: NonNullable<GameConfigModule['useAttention']>;
}

/** Pulsing amber dot on the "Config" tab trigger, driven by the game's `useAttention` hook. */
export default function GameConfigAttentionDot({
    useAttention,
    server,
    apiKey,
}: GameConfigAttentionDotProps) {
    const t = useTranslations('gameserver.config');
    const needsAttention = useAttention({ server, apiKey });

    if (!needsAttention) return null;

    return (
        <span className="pointer-events-none absolute top-1 right-1 flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-amber-500 opacity-75" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-amber-500" />
            <span className="sr-only">{t('attention')}</span>
        </span>
    );
}

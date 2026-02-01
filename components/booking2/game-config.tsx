'use client';

import { forwardRef, useImperativeHandle, useRef, useState } from 'react';
import { useTranslations } from 'next-intl';
// Replaced Card with a plain div so we can control responsive borders directly
import type { Game, GameConfig } from '@/models/config';
import { FactorioConfigComponent } from './GameInstallConfig/FactorioConfig';
import { MinecraftConfigComponent } from './GameInstallConfig/minecraft-config';
import { SatisfactoryConfigComponent } from './GameInstallConfig/satisfactory-config';
import {
    FactorioGameId,
    HytaleGameId,
    MinecraftGameId,
    SatisfactoryGameId,
} from '@/app/GlobalConstants';
import { HytaleConfigComponent } from './GameInstallConfig/HytaleConfig';

interface GameConfigProps {
    game: Game;
    onSubmit: (config: GameConfig) => void;
    fullWidth?: boolean;
}

export const GameConfigComponent = forwardRef(function GameConfigComponent(
    { game, onSubmit, fullWidth = false }: GameConfigProps,
    ref,
) {
    const t = useTranslations('buyGameServer.gameConfig');
    const configRef = useRef<any>(null);

    useImperativeHandle(ref, () => ({
        submit: () => {
            if (configRef.current) {
                configRef.current.submit();
            }
        },
    }));

    return (
        <div className="w-full">
            {(() => {
                switch (game.id) {
                    case MinecraftGameId: // Minecraft
                        return (
                            <MinecraftConfigComponent
                                ref={configRef}
                                onSubmit={onSubmit}
                                game={game}
                            />
                        );
                    case SatisfactoryGameId: // Satisfactory
                        return (
                            <SatisfactoryConfigComponent
                                ref={configRef}
                                onSubmit={onSubmit}
                                game={game}
                            />
                        );
                    case FactorioGameId: // Factorio
                        return (
                            <FactorioConfigComponent
                                ref={configRef}
                                onSubmit={onSubmit}
                                game={game}
                            />
                        );
                    case HytaleGameId: // Hytale
                        return (
                            <HytaleConfigComponent
                                ref={configRef}
                                onSubmit={onSubmit}
                                game={game}
                            />
                        );
                    default:
                        return (
                            <div className="p-3 md:p-4 border rounded-lg bg-muted/50">
                                <p className="text-muted-foreground text-center text-sm">
                                    {t('noSpecific')}
                                </p>
                            </div>
                        );
                }
            })()}
        </div>
    );
});

'use client';

import { forwardRef, useImperativeHandle, useRef, useState } from 'react';
import { useTranslations } from 'next-intl';
// Replaced Card with a plain div so we can control responsive borders directly
import type { Game, GameConfig } from '@/models/config';
import { MinecraftConfigComponent } from './minecraft-config';
import { SatisfactoryConfigComponent } from './satisfactory-config';

interface GameConfigProps {
    game: Game;
    onAdditionalConfigChange?: () => void;
    onSubmit: (config: GameConfig) => void;
    fullWidth?: boolean;
}

export const GameConfigComponent = forwardRef(
    (
        { game, onAdditionalConfigChange = () => {}, onSubmit, fullWidth = false }: GameConfigProps,
        ref,
    ) => {
        const t = useTranslations('buyGameServer.gameConfig');
        const configRef = useRef<any>(null);

        const handleConfigChange = () => {
            onAdditionalConfigChange();
        };

        useImperativeHandle(ref, () => ({
            submit: () => {
                if (configRef.current) {
                    configRef.current.submit();
                }
            },
        }));

        return (
            <div className="w-full">
                <div
                    className={
                        'rounded-lg bg-card text-card-foreground md:shadow-md border-0 md:border'
                    }
                >
                    <div className="p-0 md:p-4">
                        {(() => {
                            switch (game.id) {
                                case 1: // Minecraft
                                    return (
                                        <MinecraftConfigComponent
                                            ref={configRef}
                                            onSubmit={onSubmit}
                                            game={game}
                                        />
                                    );
                                case 2: // Satisfactory
                                    return (
                                        <SatisfactoryConfigComponent
                                            ref={configRef}
                                            onChange={handleConfigChange}
                                            onSubmit={onSubmit}
                                            game={game}
                                        />
                                    );
                                default:
                                    return (
                                        <div className="p-4 sm:p-6 sm:border sm:rounded-md bg-muted/50">
                                            <p className="text-muted-foreground text-center text-sm sm:text-base">
                                                {t('noSpecific')}
                                            </p>
                                        </div>
                                    );
                            }
                        })()}
                    </div>
                </div>
            </div>
        );
    },
);

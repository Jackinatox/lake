'use client';

import { forwardRef, useImperativeHandle, useRef } from 'react';
import { useTranslations } from 'next-intl';
// Replaced Card with a plain div so we can control responsive borders directly
import type { Game, GameConfig } from '@/models/config';
import { FactorioConfigComponent } from './GameInstallConfig/FactorioConfig';
import { MinecraftConfigComponent } from './GameInstallConfig/minecraft-config';
import { SatisfactoryConfigComponent } from './GameInstallConfig/satisfactory-config';
import { HytaleConfigComponent } from './GameInstallConfig/HytaleConfig';
import { useToast } from '@/hooks/use-toast';
import { gameConfigSchema } from '@/lib/validation/order';
import { getValidationMessage } from '@/lib/validation/common';

interface GameConfigProps {
    game: Game;
    onSubmit: (config: GameConfig) => void;
    fullWidth?: boolean;
    initialConfig?: GameConfig | null;
}

export const GameConfigComponent = forwardRef(function GameConfigComponent(
    { game, onSubmit, fullWidth = false, initialConfig }: GameConfigProps,
    ref,
) {
    const t = useTranslations('buyGameServer.gameConfig');
    const { toast } = useToast();
    const configRef = useRef<any>(null);

    function handleValidatedSubmit(config: GameConfig) {
        const parsed = gameConfigSchema.safeParse(config);
        if (!parsed.success) {
            toast({
                title: 'Invalid configuration',
                description: getValidationMessage(parsed.error),
                variant: 'destructive',
            });
            return;
        }

        onSubmit(parsed.data);
    }

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
                switch (game.slug) {
                    case 'minecraft':
                        return (
                            <MinecraftConfigComponent
                                ref={configRef}
                                onSubmit={handleValidatedSubmit}
                                game={game}
                                initialConfig={initialConfig}
                            />
                        );
                    case 'satisfactory':
                        return (
                            <SatisfactoryConfigComponent
                                ref={configRef}
                                onSubmit={handleValidatedSubmit}
                                game={game}
                                initialConfig={initialConfig}
                            />
                        );
                    case 'factorio':
                        return (
                            <FactorioConfigComponent
                                ref={configRef}
                                onSubmit={handleValidatedSubmit}
                                game={game}
                                initialConfig={initialConfig}
                            />
                        );
                    case 'hytale':
                        return (
                            <HytaleConfigComponent
                                ref={configRef}
                                onSubmit={handleValidatedSubmit}
                                game={game}
                                initialConfig={initialConfig}
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

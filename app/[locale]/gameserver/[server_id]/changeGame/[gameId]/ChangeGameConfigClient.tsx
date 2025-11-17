'use client';

import { useRef, useState } from 'react';
import Image from 'next/image';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import type { Game, GameConfig } from '@/models/config';
import { GameConfigComponent } from '@/components/booking2/game-config';
import {
    AlertTriangle,
    ArrowRight,
    CheckCircle2,
    Gamepad2,
    Info,
    Loader2,
    Shield,
} from 'lucide-react';
import { changeGame } from './changeGameAction';
import Link from 'next/link';
import { useTranslations } from 'next-intl';

interface ChangeGameConfigClientProps {
    serverId: string;
    game: Game;
    currentGameName?: string | null;
    currentGameId?: number;
    defaultDeleteFiles?: boolean;
}

export default function ChangeGameConfigClient({
    serverId,
    game,
    currentGameName,
    currentGameId,
    defaultDeleteFiles = true,
}: ChangeGameConfigClientProps) {
    const t = useTranslations('changeGame');
    const { toast } = useToast();
    const gameConfigRef = useRef<{ submit: () => void }>(null);
    const [submittedConfig, setSubmittedConfig] = useState<GameConfig | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [deleteFiles, setDeleteFiles] = useState(defaultDeleteFiles);

    const isFlavorChange = currentGameId === game.id;

    const handleSubmit = async (config: GameConfig) => {
        try {
            setIsSubmitting(true);
            await changeGame({
                serverId,
                gameId: game.id,
                gameConfig: config,
                deleteFiles,
            });
            setSubmittedConfig(config);
            toast({
                title: 'Configuration captured',
                description: 'Your game has been updated and is installing.',
            });
            window.scrollTo({ top: 0, behavior: 'smooth' });
        } catch (error) {
            console.error('Failed to record game change request', error);
            toast({
                title: 'Unable to save',
                description: 'Error while changing the game. Please try again.',
                variant: 'destructive',
            });
        } finally {
            setIsSubmitting(false);
        }
    };

    if (!submittedConfig) {
        return (
            <div className="space-y-6">
                <Card className="relative overflow-hidden border-primary/20 bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
                    <CardHeader className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                        <div className="space-y-3">
                            <Badge
                                variant="secondary"
                                className="w-fit uppercase tracking-widest text-[0.65rem]"
                            >
                                Game switch
                            </Badge>
                            <div className="space-y-1 text-left">
                                <CardTitle className="text-lg font-semibold leading-snug sm:text-xl">
                                    Configure the new game experience
                                </CardTitle>
                                <p className="text-sm text-muted-foreground">
                                    Fine-tune the setup before you kick off the install.
                                </p>
                            </div>
                        </div>
                        <Gamepad2 className="h-10 w-10 text-primary/70" />
                    </CardHeader>
                    <CardContent className="space-y-5 text-sm text-muted-foreground">
                        <div className="grid gap-3 sm:grid-cols-2">
                            <div className="rounded-lg border border-dashed border-border/60 p-4 shadow-sm">
                                <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                                    Current game
                                </p>
                                <div className="mt-3 flex items-center gap-3">
                                    <Image
                                        src={`/images/light/games/icons/${currentGameName?.toLowerCase()}.webp`}
                                        alt={`Current game ${currentGameName ?? ''}`}
                                        width={64}
                                        height={64}
                                        className="h-16 w-16 rounded-md object-cover block dark:hidden"
                                    />
                                    <Image
                                        src={`/images/dark/games/icons/${currentGameName?.toLowerCase()}.webp`}
                                        alt={`Current game ${currentGameName ?? ''}`}
                                        width={64}
                                        height={64}
                                        className="h-16 w-16 rounded-md object-cover hidden dark:block"
                                    />
                                    <p className="text-base font-semibold text-foreground">
                                        {currentGameName
                                            ? currentGameName.charAt(0).toUpperCase() +
                                              currentGameName.slice(1)
                                            : 'Not set'}
                                    </p>
                                </div>
                            </div>
                            <div className="rounded-lg border border-dashed border-primary/40 bg-primary/15 p-4 shadow-sm">
                                <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                                    New selection
                                </p>
                                <div className="mt-3 flex items-center gap-3">
                                    <Image
                                        src={`/images/light/games/icons/${game.name?.toLowerCase()}.webp`}
                                        alt={`New game ${game.name}`}
                                        width={64}
                                        height={64}
                                        className="h-16 w-16 rounded-md object-cover block dark:hidden"
                                    />
                                    <Image
                                        src={`/images/dark/games/icons/${game.name?.toLowerCase()}.webp`}
                                        alt={`New game ${game.name}`}
                                        width={64}
                                        height={64}
                                        className="h-16 w-16 rounded-md object-cover hidden dark:block"
                                    />
                                    <p className="text-base font-semibold text-foreground">
                                        {game.name}
                                    </p>
                                </div>
                            </div>
                        </div>

                        <div className="space-y-3">
                            {/* Initial context - flavor change or game change */}
                            <div
                                className={`flex items-start gap-3 rounded-lg border p-4 shadow-sm ${
                                    isFlavorChange
                                        ? 'border-blue-200 bg-blue-50 dark:border-blue-900/50 dark:bg-blue-950/20'
                                        : 'border-destructive/40 bg-destructive/10 dark:border-destructive/60 dark:bg-destructive/25 dark:shadow-[0_0_24px_rgba(239,68,68,0.25)]'
                                }`}
                            >
                                {isFlavorChange ? (
                                    <Info className="mt-0.5 h-5 w-5 shrink-0 text-blue-600 dark:text-blue-400" />
                                ) : (
                                    <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-destructive dark:text-destructive-foreground" />
                                )}
                                <div className="space-y-1">
                                    <p
                                        className={`text-sm font-semibold ${
                                            isFlavorChange
                                                ? 'text-blue-900 dark:text-blue-100'
                                                : 'text-destructive dark:text-destructive-foreground uppercase tracking-wide'
                                        }`}
                                    >
                                        {isFlavorChange
                                            ? t('flavorChangeTitle')
                                            : t('gameChangeTitle')}
                                    </p>
                                    <p
                                        className={`text-sm ${
                                            isFlavorChange
                                                ? 'text-blue-800 dark:text-blue-200'
                                                : 'text-destructive/80 dark:text-destructive-foreground/90'
                                        }`}
                                    >
                                        {isFlavorChange
                                            ? t('flavorChangeDesc')
                                            : t('gameChangeDesc')}
                                    </p>
                                </div>
                            </div>

                            {/* Dynamic warning based on checkbox state */}
                            {deleteFiles ? (
                                <div className="flex items-start gap-3 rounded-lg border border-destructive/40 bg-destructive/10 p-4 text-destructive shadow-sm dark:border-destructive/60 dark:bg-destructive/25 dark:text-destructive-foreground dark:shadow-[0_0_24px_rgba(239,68,68,0.25)]">
                                    <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-destructive dark:text-destructive-foreground" />
                                    <div className="space-y-1">
                                        <p className="text-sm font-semibold uppercase tracking-wide text-destructive dark:text-destructive-foreground">
                                            {t('filesDeletedTitle')}
                                        </p>
                                        <p className="text-sm text-destructive/80 dark:text-destructive-foreground/90">
                                            {t('filesDeletedDesc')}
                                        </p>
                                    </div>
                                </div>
                            ) : (
                                <div className="flex items-start gap-3 rounded-lg border border-blue-200 bg-blue-50 p-4 shadow-sm dark:border-blue-900/50 dark:bg-blue-950/20">
                                    <Shield className="mt-0.5 h-5 w-5 shrink-0 text-blue-600 dark:text-blue-400" />
                                    <div className="space-y-1">
                                        <p className="text-sm font-semibold text-blue-900 dark:text-blue-100">
                                            {t('filesKeptTitle')}
                                        </p>
                                        <p className="text-sm text-blue-800 dark:text-blue-200">
                                            {t('filesKeptDesc')}
                                        </p>
                                    </div>
                                </div>
                            )}

                            {/* Checkbox */}
                            <div className="flex items-center space-x-2 rounded-lg border border-border/60 bg-muted/30 p-3">
                                <Checkbox
                                    id="delete-files"
                                    checked={deleteFiles}
                                    onCheckedChange={(checked) => setDeleteFiles(checked === true)}
                                />
                                <Label
                                    htmlFor="delete-files"
                                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                                >
                                    {isFlavorChange
                                        ? t('flavorChangeCheckbox')
                                        : t('gameChangeCheckbox')}
                                </Label>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <GameConfigComponent
                    ref={gameConfigRef}
                    game={game}
                    fullWidth
                    onSubmit={handleSubmit}
                />

                <div className="flex justify-end">
                    <Button
                        onClick={() => gameConfigRef.current?.submit()}
                        disabled={isSubmitting}
                        className="w-full rounded-lg shadow-lg transition-all duration-200 sm:w-auto sm:hover:shadow-xl"
                    >
                        {isSubmitting ? (
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        ) : (
                            <ArrowRight className="mr-2 h-4 w-4" />
                        )}
                        {isSubmitting ? 'Installing…' : 'Install new game'}
                    </Button>
                </div>
            </div>
        );
    }

    if (submittedConfig) {
        return (
            <div className="flex flex-col items-center justify-center space-y-4 py-20">
                <div className="rounded-full bg-primary/10 p-4">
                    <CheckCircle2 className="h-16 w-16 text-primary" />
                </div>
                <h2 className="text-2xl font-semibold">Game change in progress</h2>
                <p className="max-w-md text-center text-sm text-muted-foreground">
                    Your server is being updated to the new game. This process can take a few
                    minutes. Once completed, you can start your server and enjoy your new game!
                </p>
                <Separator className="my-6 w-24" />
                <Button
                    variant="outline"
                    className="w-full rounded-lg shadow-lg transition-all duration-200 sm:w-auto sm:hover:shadow-xl"
                    asChild
                >
                    <Link href={`/gameserver/${serverId}`}>Go to server dashboard</Link>
                </Button>
            </div>
        );
    }
}

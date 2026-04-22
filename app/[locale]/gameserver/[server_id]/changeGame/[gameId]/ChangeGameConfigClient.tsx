'use client';

import { useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import type { Game, GameConfig } from '@/models/config';
import { GameConfigComponent } from '@/components/booking2/game-config';
import { ArrowRight, ArrowLeft, Loader2, Settings2, Trash2, Shield } from 'lucide-react';
import { changeGame } from './changeGameAction';
import { ThemeImage } from '@/components/ui/theme-image';
import Link from 'next/link';

import ChangeInfoBox from './ChangeInfoBox';
import FilesWarning from './FilesWarning';
import DeleteFilesCheckbox from './DeleteFilesCheckbox';
import { notifyReinstallStarted } from '@/components/gameserver/serverEvents';
import { useRouter } from 'next/navigation';

interface ChangeGameConfigClientProps {
    serverId: string;
    game: Game;
    currentGameName: string;
    currentGameId: number;
    defaultDeleteFiles: boolean;
}

export default function ChangeGameConfigClient({
    serverId,
    game,
    currentGameName,
    currentGameId,
    defaultDeleteFiles = true,
}: ChangeGameConfigClientProps) {
    const { toast } = useToast();
    const router = useRouter();
    const gameConfigRef = useRef<{ submit: () => void }>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [deleteFiles, setDeleteFiles] = useState(defaultDeleteFiles);

    const isFlavorChange = currentGameId === game.id;

    const handleSubmit = async (config: GameConfig) => {
        try {
            setIsSubmitting(true);
            await changeGame({
                ptServerId: serverId,
                gameId: game.id,
                gameConfig: config,
                deleteFiles,
            });
            toast({
                title: 'Configuration captured',
                description: 'Your game has been updated and is installing.',
            });
            notifyReinstallStarted(serverId);
            router.push(`/gameserver/${serverId}`);
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

    return (
        <div className="flex flex-col min-h-[calc(100dvh-4rem)]">
            {/* Fixed top bar — sits below the navbar (h-16) */}
            <div className="fixed top-16 left-0 right-0 z-40 border-b border-border/60 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80">
                <div className="mx-auto w-full max-w-5xl px-4 py-3">
                    <div className="flex items-center justify-between gap-4">
                        <div className="flex items-center gap-3 min-w-0">
                            <div className="hidden sm:flex items-center gap-1.5 shrink-0">
                                <Settings2 className="h-4 w-4 text-muted-foreground" />
                                <span className="text-sm font-medium text-muted-foreground">
                                    Configure
                                </span>
                            </div>
                            <div className="hidden sm:block w-px h-4 bg-border shrink-0" />
                            <div className="flex items-center gap-2 min-w-0">
                                <div className="flex items-center gap-1.5 min-w-0">
                                    <ThemeImage
                                        src={`/images/games/icons/${currentGameName?.toLowerCase()}.webp`}
                                        alt={currentGameName ?? ''}
                                        width={24}
                                        height={24}
                                        className="h-6 w-6 rounded object-cover shrink-0"
                                    />
                                    <span className="text-sm font-medium truncate max-w-20 sm:max-w-none">
                                        {currentGameName
                                            ? currentGameName.charAt(0).toUpperCase() +
                                              currentGameName.slice(1)
                                            : 'Current'}
                                    </span>
                                </div>
                                <ArrowRight className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                                <div className="flex items-center gap-1.5 min-w-0">
                                    <ThemeImage
                                        src={`/images/games/icons/${game.name?.toLowerCase()}.webp`}
                                        alt={game.name}
                                        width={24}
                                        height={24}
                                        className="h-6 w-6 rounded object-cover shrink-0"
                                    />
                                    <span className="text-sm font-semibold text-foreground truncate max-w-20 sm:max-w-none">
                                        {game.name}
                                    </span>
                                </div>
                            </div>
                        </div>
                        <Button
                            variant="ghost"
                            size="sm"
                            className="shrink-0 gap-1.5 text-muted-foreground"
                            asChild
                        >
                            <Link href={`/gameserver/${serverId}/changeGame`}>
                                <ArrowLeft className="h-4 w-4" />
                                <span className="hidden sm:inline">Back</span>
                            </Link>
                        </Button>
                    </div>
                </div>
            </div>

            {/* Main content — flex-1 pushes the sticky bar to the viewport bottom on short pages */}
            <div className="flex-1 mx-auto w-full max-w-5xl space-y-4 px-0 pt-14 pb-4">
                {isFlavorChange && <ChangeInfoBox />}

                <FilesWarning deleteFiles={deleteFiles} />
                <DeleteFilesCheckbox
                    deleteFiles={deleteFiles}
                    setDeleteFiles={setDeleteFiles}
                    isFlavorChange={isFlavorChange}
                />

                <Card className="border-border/60">
                    <CardHeader className="pb-3">
                        <CardTitle className="flex items-center gap-2 text-base">
                            <Settings2 className="h-4 w-4 text-primary" />
                            Game configuration
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <GameConfigComponent
                            ref={gameConfigRef}
                            game={game}
                            fullWidth
                            onSubmit={handleSubmit}
                        />
                    </CardContent>
                </Card>
            </div>

            {/* Sticky bottom bar — breaks out of the layout's px-2 md:px-8 padding */}
            <div className="sticky bottom-0 z-40 -mx-2 md:-mx-8 border-t border-border/60 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80">
                <div className="mx-auto w-full max-w-5xl px-4 py-3">
                    <div className="flex items-center justify-between gap-4">
                        <div className="hidden sm:flex items-center gap-2 text-sm text-muted-foreground">
                            {deleteFiles ? (
                                <Trash2 className="h-4 w-4 text-destructive" />
                            ) : (
                                <Shield className="h-4 w-4 text-blue-500" />
                            )}
                            <span>
                                {deleteFiles
                                    ? 'Existing files will be deleted on install'
                                    : 'Existing files will be preserved'}
                            </span>
                        </div>
                        <Button
                            onClick={() => gameConfigRef.current?.submit()}
                            disabled={isSubmitting}
                            className="w-full sm:w-auto rounded-lg shadow-lg transition-all duration-200 sm:hover:shadow-xl"
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
            </div>
        </div>
    );
}

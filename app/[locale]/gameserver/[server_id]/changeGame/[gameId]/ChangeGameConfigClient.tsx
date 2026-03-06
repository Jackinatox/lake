'use client';

import { useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import type { Game, GameConfig } from '@/models/config';
import { GameConfigComponent } from '@/components/booking2/game-config';
import { ArrowRight, CheckCircle2, Loader2 } from 'lucide-react';
import { changeGame } from './changeGameAction';
import Link from 'next/link';

import HeaderCard from './HeaderCard';
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
    const [submittedConfig, setSubmittedConfig] = useState<GameConfig | null>(null);
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
            setSubmittedConfig(config);
            toast({
                title: 'Configuration captured',
                description: 'Your game has been updated and is installing.',
            });
            window.scrollTo({ top: 0, behavior: 'smooth' });
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

    // if (!submittedConfig) {
    return (
        <div className="space-y-6">
            <HeaderCard currentGameName={currentGameName} game={game} />

            <div className="space-y-3">
                {isFlavorChange && <ChangeInfoBox />}

                <FilesWarning deleteFiles={deleteFiles} />
                <DeleteFilesCheckbox
                    deleteFiles={deleteFiles}
                    setDeleteFiles={setDeleteFiles}
                    isFlavorChange={isFlavorChange}
                />
            </div>

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
    // }
}

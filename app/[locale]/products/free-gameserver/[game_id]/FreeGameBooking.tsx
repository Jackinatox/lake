'use client';

import { checkoutFreeGameServer } from '@/app/actions/checkout';
import { GameConfigComponent } from '@/components/booking2/game-config';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { authClient } from '@/lib/auth-client';
import { Game, GameConfig } from '@/models/config';
import Image from 'next/image';
import { redirect, useRouter } from 'next/navigation';
import { useRef, useState } from 'react';

export interface FreeServerStats {
    currentFreeServers: number;
    maxFreeServers: number;
    creationNotAllowedReason: null | "TOO_MANY_SERVERS" | "NOT_LOGGED_IN"; 
}

interface FreeGameServerBookingProps {
    game: Game;
    stats: FreeServerStats;
}

export default function FreeGameServerBooking({ game, stats }: FreeGameServerBookingProps) {
    const { toast } = useToast();
    const router = useRouter();
    const gameConfigRef = useRef<{ submit: () => void }>(null);
    const [loading, setLoading] = useState(false);
    const session = authClient.useSession();

    const isCreationDisabled = Boolean(stats?.creationNotAllowedReason) || !session.data;

    const getDisabledMessage = () => {
        if (stats?.creationNotAllowedReason) {
            switch (stats.creationNotAllowedReason) {
                case 'TOO_MANY_SERVERS':
                    return 'You have reached the maximum number of free servers.';
                case 'NOT_LOGGED_IN':
                    return 'You must be logged in to create a free server.';
                default:
                    return 'Server creation is currently not allowed.';
            }
        }

        if (!session.data) {
            return 'You must be logged in to create a free server.';
        }

        return '';
    };

    const onSubmit = async (config: GameConfig) => {
        console.log(config);
        try {
            setLoading(true);
            const serverId = await checkoutFreeGameServer(config);
            router.push(`/gameserver/${serverId}`);
        } catch (error) {
            toast({
                title: 'Error',
                description: String(error),
                variant: 'destructive',
            });
            console.error('Error during checkout:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleCreateFreeServer = () => {
        gameConfigRef.current?.submit();
    };

    const imgName = `${game.name.toLowerCase()}.webp`;
    const gameImages = {
        light: `/images/light/games/icons/${imgName}`,
        dark: `/images/dark/games/icons/${imgName}`,
    };

    return (
        <Card className="w-full p-3 md:p-6">
            {/* Header with Game Icon */}
            <div className="mb-3 md:mb-6 flex items-center gap-4 px-0">
                <div className="relative w-16 h-16 md:w-20 md:h-20 flex-shrink-0">
                    <Image
                        src={gameImages.light || '/placeholder.svg'}
                        alt={game.name}
                        fill
                        className="object-cover rounded-lg block dark:hidden shadow-md"
                    />
                    <Image
                        src={gameImages.dark || '/placeholder.svg'}
                        alt={game.name}
                        fill
                        className="object-cover rounded-lg hidden dark:block shadow-md"
                    />
                </div>
                <div>
                    <h1 className="text-3xl md:text-4xl font-bold text-primary/90">{game.name}</h1>
                    <p className="text-sm md:text-base text-muted-foreground mt-1">
                        Free Game Server
                    </p>
                </div>
            </div>

            {/* Main Content Card */}
            <div className="p-0">
                <div className="space-y-0 ">
                    {/* Game Config Section */}
                    <div>
                        <GameConfigComponent game={game} onSubmit={onSubmit} ref={gameConfigRef} />
                    </div>
                </div>
            </div>

            {/* Sticky Button at Bottom (Mobile) */}
            <div className="fixed md:hidden bottom-0 left-0 right-0 bg-background/95 backdrop-blur border-t border-border p-3 shadow-lg">
                <Button
                    onClick={handleCreateFreeServer}
                    disabled={isCreationDisabled || loading}
                    title={isCreationDisabled ? getDisabledMessage() : undefined}
                    className="w-full"
                    size="lg"
                >
                    {loading ? 'Creating...' : 'Create Free Gameserver'}
                </Button>
                {isCreationDisabled && (
                    <p className="text-xs text-muted-foreground mt-2 text-center">
                        {getDisabledMessage()}
                    </p>
                )}
            </div>

            {/* Regular Button at Bottom (Desktop) */}
            <div className="hidden md:flex justify-end gap-4 mt-6 items-center">
                {isCreationDisabled && (
                    <p className="text-sm text-muted-foreground mr-4">{getDisabledMessage()}</p>
                )}
                <Button
                    onClick={handleCreateFreeServer}
                    disabled={isCreationDisabled || loading}
                    title={isCreationDisabled ? getDisabledMessage() : undefined}
                    className="px-8"
                    size="lg"
                >
                    {loading ? 'Creating...' : 'Create Free Gameserver'}
                </Button>
            </div>
        </Card>
    );
}

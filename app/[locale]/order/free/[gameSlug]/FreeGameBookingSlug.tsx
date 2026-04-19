'use client';

import { checkoutFreeGameServer } from '@/app/actions/checkout/checkout';
import { GameConfigComponent } from '@/components/booking2/game-config';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { ThemeImage } from '@/components/ui/theme-image';
import { useToast } from '@/hooks/use-toast';
import { authClient } from '@/lib/auth-client';
import { getValidationMessage } from '@/lib/validation/common';
import { gameConfigSchema } from '@/lib/validation/order';
import { Game, GameConfig } from '@/models/config';
import { ArrowLeft, Gift, Server } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useRef, useState } from 'react';

export interface FreeServerStats {
    currentFreeServers: number;
    maxFreeServers: number;
    creationNotAllowedReason: null | 'TOO_MANY_SERVERS' | 'NOT_LOGGED_IN';
}

interface FreeGameServerBookingProps {
    game: Game;
    stats: FreeServerStats;
    gameSlug: string;
}

export default function FreeGameServerBooking({
    game,
    stats,
    gameSlug,
}: FreeGameServerBookingProps) {
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
        try {
            const parsedConfig = gameConfigSchema.safeParse(config);
            if (!parsedConfig.success) {
                throw new Error(getValidationMessage(parsedConfig.error));
            }

            setLoading(true);
            const jobId = await checkoutFreeGameServer(parsedConfig.data);
            router.push(`/products/wait/${jobId}`);
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

    return (
        <div className="md:-my-4 flex flex-col min-h-[calc(100dvh-4rem)]">
            {/* Sticky header */}
            <div className="sticky top-0 z-10 bg-background/80 backdrop-blur-md border-b py-2">
                <div className="w-full px-2 md:px-6 max-w-7xl mx-auto">
                    <div className="flex items-center justify-between gap-3">
                        <div className="flex items-center gap-3 min-w-0">
                            <Button variant="ghost" size="icon" className="shrink-0" asChild>
                                <Link href="/order/free">
                                    <ArrowLeft className="h-4 w-4" />
                                </Link>
                            </Button>
                            <div className="relative w-8 h-8 shrink-0">
                                <ThemeImage
                                    src={`/images/games/icons/${imgName}`}
                                    alt={game.name}
                                    fill
                                    className="object-cover rounded-md"
                                />
                            </div>
                            <div className="min-w-0">
                                <h1 className="text-sm font-semibold truncate">{game.name}</h1>
                                <p className="text-xs text-muted-foreground">Free Server</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-1.5 text-sm text-muted-foreground shrink-0">
                            <Server className="h-3.5 w-3.5" />
                            <span className="text-xs">
                                {stats.currentFreeServers}/{stats.maxFreeServers}
                            </span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Main content */}
            <div className="w-full pt-4 pb-4 max-w-7xl mx-auto px-0 md:px-6 flex-1">
                {/* Disabled notice */}
                {isCreationDisabled && (
                    <div className="rounded-lg border border-yellow-500/20 bg-yellow-500/5 px-4 py-3 mb-4 text-sm text-muted-foreground">
                        {getDisabledMessage()}
                    </div>
                )}

                {/* Game Configuration */}
                <Card className="p-2 md:p-6">
                    <GameConfigComponent ref={gameConfigRef} game={game} onSubmit={onSubmit} />
                </Card>
            </div>

            {/* Sticky bottom bar */}
            <div className="sticky bottom-0 z-10 bg-background/95 backdrop-blur-md border-t p-3">
                <div className="w-full max-w-5xl mx-auto flex items-center justify-between gap-3">
                    {isCreationDisabled && (
                        <p className="text-xs text-muted-foreground hidden sm:block">
                            {getDisabledMessage()}
                        </p>
                    )}
                    <Button
                        onClick={handleCreateFreeServer}
                        disabled={isCreationDisabled || loading}
                        className="w-full sm:w-auto sm:ml-auto bg-green-600 hover:bg-green-700"
                    >
                        <Gift className="mr-2 h-4 w-4" />
                        {loading ? 'Creating...' : 'Create Free Server'}
                    </Button>
                </div>
            </div>
        </div>
    );
}

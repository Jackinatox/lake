'use client';

import { checkoutFreeGameServer } from '@/app/actions/checkout/checkout';
import { GameConfigComponent } from '@/components/booking2/game-config';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { authClient } from '@/lib/auth-client';
import { Game, GameConfig } from '@/models/config';
import { ArrowLeft, Gift, Info } from 'lucide-react';
import Image from 'next/image';
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
            setLoading(true);
            const jobId = await checkoutFreeGameServer(config);
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
        <div className="md:-my-4">
            {/* Header */}
            <div className="sticky top-0 z-10 bg-background/80 backdrop-blur-md border-b py-4">
                <div className="w-full px-1 max-w-7xl mx-auto">
                    <div className="flex items-center justify-between gap-4">
                        <div className="flex items-center gap-4">
                            <Button variant="ghost" size="icon" asChild>
                                <Link href={`/order/${gameSlug}`}>
                                    <ArrowLeft className="h-4 w-4" />
                                </Link>
                            </Button>
                            <div className="relative w-10 h-10 shrink-0">
                                <Image
                                    src={`/images/light/games/icons/${imgName}`}
                                    alt={game.name}
                                    fill
                                    className="object-cover rounded-lg block dark:hidden"
                                />
                                <Image
                                    src={`/images/dark/games/icons/${imgName}`}
                                    alt={game.name}
                                    fill
                                    className="object-cover rounded-lg hidden dark:block"
                                />
                            </div>
                            <div>
                                <h1 className="text-xl sm:text-2xl font-bold">Free Server</h1>
                                <p className="text-sm text-muted-foreground">{game.name}</p>
                            </div>
                        </div>
                        <Badge
                            variant="secondary"
                            className="bg-green-500/20 text-green-600 border-green-500/30 text-sm px-3 py-1"
                        >
                            <Gift className="h-4 w-4 mr-1.5" />
                            Free
                        </Badge>
                    </div>
                </div>
            </div>

            {/* Main content */}
            <div className="w-full pt-4 pb-28 max-w-7xl mx-auto">
                {/* Info banner */}
                <div className="rounded-xl border border-green-500/20 bg-green-500/5 p-4 mb-6">
                    <div className="flex items-start gap-3">
                        <Info className="h-5 w-5 text-green-500 mt-0.5 shrink-0" />
                        <div className="text-sm text-muted-foreground">
                            <p>
                                Free servers come with limited resources. No credit card required.
                            </p>
                            <p className="mt-1">
                                Free servers: {stats.currentFreeServers} / {stats.maxFreeServers}
                            </p>
                        </div>
                    </div>
                </div>

                {/* Game Configuration */}
                <Card className="p-2 md:p-6">
                    <div className="mb-4 md:mb-6 flex items-center gap-4">
                        <div className="relative w-14 h-14 md:w-16 md:h-16 shrink-0">
                            <Image
                                src={`/images/light/games/icons/${imgName}`}
                                alt={game.name}
                                fill
                                className="object-cover rounded-lg block dark:hidden shadow-md"
                            />
                            <Image
                                src={`/images/dark/games/icons/${imgName}`}
                                alt={game.name}
                                fill
                                className="object-cover rounded-lg hidden dark:block shadow-md"
                            />
                        </div>
                        <div>
                            <h2 className="text-2xl md:text-3xl font-bold text-primary/90">
                                {game.name}
                            </h2>
                            <p className="text-sm text-muted-foreground">
                                Configure your free game server
                            </p>
                        </div>
                    </div>
                    <GameConfigComponent ref={gameConfigRef} game={game} onSubmit={onSubmit} />
                </Card>
            </div>

            {/* Sticky bottom navigation */}
            <div className="sticky bottom-0 z-10 bg-background/95 backdrop-blur-md border-t p-4">
                <div className="w-full max-w-7xl mx-auto">
                    <div className="flex flex-col-reverse sm:flex-row justify-between items-center gap-4">
                        <Button variant="outline" asChild className="w-full sm:w-auto">
                            <Link href={`/order/${gameSlug}`}>
                                <ArrowLeft className="mr-2 h-4 w-4" />
                                Back
                            </Link>
                        </Button>
                        <div className="flex items-center gap-4 w-full sm:w-auto">
                            {isCreationDisabled && (
                                <p className="text-sm text-muted-foreground">
                                    {getDisabledMessage()}
                                </p>
                            )}
                            <Button
                                onClick={handleCreateFreeServer}
                                disabled={isCreationDisabled || loading}
                                className="w-full sm:w-auto sm:ml-auto bg-linear-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700"
                            >
                                {loading ? 'Creating...' : 'Create Free Server'}
                                <Gift className="ml-2 h-4 w-4" />
                            </Button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

'use client';

import { checkoutAction, checkoutFreeGameServer, CheckoutParams } from '@/app/actions/checkout';
import { GameConfigComponent } from '@/components/booking2/game-config';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Game, GameConfig } from '@/models/config';
import { useRef } from 'react';

interface FreeGameServerBookingProps {
    game: Game;
}

export default function FreeGameServerBooking({ game }: FreeGameServerBookingProps) {
    const gameConfigRef = useRef<{ submit: () => void }>(null);

    const onSubmit = async (config: GameConfig) => {
        console.log(config);
        await checkoutFreeGameServer(config);
    };

    const handleCreateFreeServer = () => {
        gameConfigRef.current?.submit();
    };

    return (
        <Card className="p-6 space-y-4">
            <CardContent className="flex flex-col gap-6">
                <GameConfigComponent game={game} onSubmit={onSubmit} ref={gameConfigRef} />
                <Button onClick={handleCreateFreeServer}>Create Free Gameserver</Button>
            </CardContent>
        </Card>
    );
}

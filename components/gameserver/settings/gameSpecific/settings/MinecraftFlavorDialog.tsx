'use client';

import { Button } from '@/components/ui/button';
import { GameServer } from '@/models/gameServerModel';
import Link from 'next/link';

interface MinecraftFlavorDialogProps {
    triggerText?: string;
    server: GameServer;
}

export function MinecraftFlavorDialog({
    triggerText = 'Server flavour ändern',
    server,
}: MinecraftFlavorDialogProps) {
    // Link to the change game page with the server's gameDataId and deleteFiles=false for flavor changes
    const changeGameUrl = `/gameserver/${server.identifier}/changeGame/${server.gameDataId}?deleteFiles=false`;

    return (
        <Button variant="outline" className="w-full sm:w-auto" asChild>
            <Link href={changeGameUrl}>{triggerText}</Link>
        </Button>
    );
}

"use server"

import { auth } from '@/auth';
import GameDashboard from '@/components/gameserver/Console/gameDashboard';
import { Builder } from 'pterodactyl.js';
import React from 'react'


const url = process.env.NEXT_PUBLIC_PTERODACTYL_URL;
const apiKey = process.env.PTERODACTYL_API_KEY;

if (!url || !apiKey) {
    throw new Error('PTERODACTYL_URL and PTERODACTYL_API_KEY must be defined');
}



async function serverCrap({ params }: { params: Promise<{ server_id: string }> }) {
    const serverId = (await params).server_id;

    const session = await auth();

    if (!session?.user) {
        return <>Not logged in</>;
    }

    const ptApiKey = session?.user.ptKey;

    const client = new Builder().setURL(url).setAPIKey(ptApiKey).asUser();
    const server = await client.getClientServer(serverId);
    console.log(server)


    return (
        <>
            <GameDashboard server={server.toJSON()} ptApiKey={ptApiKey}></GameDashboard>
        </>
    )
}

export default serverCrap
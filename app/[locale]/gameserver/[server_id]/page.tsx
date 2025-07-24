"use server"

import { auth } from '@/auth';
import GameDashboard from '@/components/gameserver/Console/gameDashboard';
import { createPtClient } from '@/lib/Pterodactyl/ptAdminClient';
import { GameServer } from '@/models/gameServerModel';
import { Builder } from 'pterodactyl.js';
import React from 'react'


const baseUrl = process.env.NEXT_PUBLIC_PTERODACTYL_URL
const apiKey = process.env.PTERODACTYL_API_KEY;

if (!baseUrl || !apiKey) {
    throw new Error('PTERODACTYL_URL and PTERODACTYL_API_KEY must be defined');
}



async function serverCrap({ params }: { params: Promise<{ server_id: string }> }) {
    const serverId = (await params).server_id;

    const session = await auth();

    if (!session?.user) {
        return <>Not logged in</>;
    }

    const ptApiKey = session?.user.ptKey;

    const response = await fetch(
        `${baseUrl}/api/client/servers/${serverId}`,
        {
            method: "GET",
            headers: {
                Authorization: `Bearer ${ptApiKey}`,
                // Authorization: `Bearer ptlc_dUhOyxSMfmFeeAbOyOzIZiuyOXs0qX0pLEOt5F76VpP`,
                Accept: "application/json",
                "Content-Type": "application/json",
            },
        },
    )

    const data = await response.json();

    if (response.status === 403 || response.status === 404) {
        console.error('auth error to pt API', data);
        return <>Auth error</>
    }

    if (!response.ok) {
        console.error('error from pt API', data);
        return <>An error occured</>
    }


    try {
        let server = { ...data.attributes };
        const pt = createPtClient();
        const adminServer = await pt.getServer(server.internal_id.toString());

        const updatedServer = {
            ...server,
            egg_id: adminServer.egg,
            // add more modifications here if needed
        };

        // console.log('my server: ', JSON.stringify(updatedServer, null, 2));

        return (
            <>
                <GameDashboard server={updatedServer} ptApiKey={ptApiKey} gameId={1}></GameDashboard>
            </>)
    } catch (error) {
        return <> Error from pt API {error} </>
    }
}

export default serverCrap
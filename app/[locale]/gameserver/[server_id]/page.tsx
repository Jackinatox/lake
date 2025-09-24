"use server"

import { auth } from '@/auth';
import NotLoggedIn from '@/components/auth/NoAuthMessage';
import NotAllowedMessage from '@/components/auth/NotAllowedMessage';
import GameDashboard from '@/components/gameserver/Console/gameDashboard';
import { createPtClient } from '@/lib/Pterodactyl/ptAdminClient';
import { GameServer } from '@/models/gameServerModel';
import { prisma } from '@/prisma';
import { headers } from 'next/headers';


const baseUrl = process.env.NEXT_PUBLIC_PTERODACTYL_URL
const apiKey = process.env.PTERODACTYL_API_KEY;

if (!baseUrl || !apiKey) {
    throw new Error('PTERODACTYL_URL and PTERODACTYL_API_KEY must be defined');
}



async function serverCrap({ params }: { params: Promise<{ server_id: string }> }) {

    // -- Auth
    const serverId = (await params).server_id;

    const session = await auth.api.getSession({
        headers: await headers()
    })

    if (!session) {
        return <NotLoggedIn />;
    }

    // actual server data
    const isServerValid = await prisma.gameServer.findFirst({
        where: {
            ptServerId: serverId,
            userId: session.user.id,
            status: {
                notIn: ['CREATION_FAILED', 'DELETED']
            }
        }
    });

    if (!isServerValid) {
        return <NotAllowedMessage />
    }

    const ptApiKey = session.user.ptKey;

    const response = await fetch(
        `${baseUrl}/api/client/servers/${serverId}`,
        {
            method: "GET",
            headers: {
                Authorization: `Bearer ${ptApiKey}`,
                Accept: "application/json",
                "Content-Type": "application/json",
            },
        },
    )

    if (response.status === 403 || response.status === 404) {
        return <NotAllowedMessage />
    }
    
    const data = await response.json();

    if (!response.ok) {
        console.error('error from pt API', data);
        return <>An error occured</>
    }


    try {        
        let server = { ...data.attributes };
        const pt = createPtClient();
        const adminServer = await pt.getServer(isServerValid.ptAdminId.toString());

        let updatedServer: GameServer = {
            ...server,
            egg_id: adminServer.egg,
            gameDataId: isServerValid.gameDataId,
            gameData: JSON.parse(isServerValid.gameConfig as string)
        };


        return (
            <div className='flex justify-center'>

                <div className='max-w-screen-2xl'>

                    <GameDashboard server={updatedServer} ptApiKey={ptApiKey}></GameDashboard>
                </div>
            </div>
        )
    } catch (error) {
        return <> Error from pt API {error} </>
    }
}

export default serverCrap
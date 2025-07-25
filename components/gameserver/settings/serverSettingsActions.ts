"use server"

import { auth } from "@/auth"
import { createPtClient } from "@/lib/Pterodactyl/ptAdminClient";
import { createPtUserClient } from "@/lib/Pterodactyl/ptUserClient";
import { ClientServer } from "pterodactyl.js";

const ptUrl = process.env.NEXT_PUBLIC_PTERODACTYL_URL;
const ptAdminKey = process.env.PTERODACTYL_API_KEY;


export async function renameClientServer(server, newName: string): Promise<boolean> {
    const session = await auth();

    if (!session?.user)
        return false;

    if (newName.length > 200)
        return false;

    try {
        fetch(`${ptUrl}/api/client/servers/${server}/settings/rename`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${session?.user.ptKey}`,
                'Accept': 'application/json',
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                name: newName
            })
        })
    } catch (error) {
        return false;
    }
    return true;
}

export async function reinstallSerevr(server: string): Promise<boolean> {
    const session = await auth();

    if (!session?.user)
        return false;

    try {
        fetch(`${ptUrl}/api/client/servers/${server}/settings/reinstall`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${session?.user.ptKey}`,
                'Accept': 'application/json',
                'Content-Type': 'application/json',
            }
        });
    } catch (error) {
        return false;
    }
    return true;
}

export async function changeServerStartup(server, docker_image: string): Promise<boolean> {
    const session = await auth();

    if (!session?.user)
        return false;

    let clientserver: ClientServer;

    try {
        const clientserver = await createPtUserClient(session?.user.ptKey).getClientServer(server);
    } catch {
        return false;
    }


    try {
        if (clientserver.serverOwner) {
            const admin = createPtClient();

            // Get full server details with admin API
            const adminServer = await fetch(`${ptUrl}/api/application/servers/${clientserver.internalId}`, {
                method: 'PATCH',
                headers: {
                    'Authorization': `Bearer ${ptAdminKey}`,
                    'Accept': 'application/json',
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({})
            }).then(response => response.json()).then(server => server.attributes);


            // Update the serevr Configuration
            await fetch(`${ptUrl}/api/application/servers/${clientserver.internalId}/startup`, {
                method: 'PATCH',
                headers: {
                    'Authorization': `Bearer ${ptAdminKey}`,
                    'Accept': 'application/json',
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    skip_scripts: false,
                    egg: adminServer.egg,
                    environment: adminServer.container.environment,
                    startup: adminServer.container.startup_command,
                    image: docker_image
                })
            });
        }
    } catch (error) {
        return false;
    }
    return true;
}
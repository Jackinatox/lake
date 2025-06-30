"use server"

import { auth } from "@/auth"

const ptUrl = process.env.NEXT_PUBLIC_PTERODACTYL_URL;

export default async function renameClientServer(server, newName: string): Promise<boolean> {
    const session = await auth();

    if (!session?.user)
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
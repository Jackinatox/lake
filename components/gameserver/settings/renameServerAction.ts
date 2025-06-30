"use server"

import { auth } from "@/auth"

const ptUrl = process.env.NEXT_PUBLIC_PTERODACTYL_URL;

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
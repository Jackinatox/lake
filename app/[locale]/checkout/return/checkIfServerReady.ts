"use server"

import { auth } from "@/auth"
import { prisma } from "@/prisma";

const endpointSecret = process.env.webhookSecret;
const panelUrl = process.env.NEXT_PUBLIC_PTERODACTYL_URL;

export default async function checkIfServerReady(stripeSession: string, checkInstallation: boolean): Promise<string | null> {
    const session = await auth();

    if (session?.user) {
        const server = await prisma.serverOrder.findFirst({ where: { stripeSessionId: stripeSession } });
        if (checkInstallation) {

            const isInstalling = await fetch(`${panelUrl}/api/client/account`, {
                method: 'GET',
                headers: {
                    Authorization: `Bearer ${session.user.ptKey}`,
                    Accept: "application/json",
                    "Content-Type": "application/json",
                },
            })
                .then((data) => data.json())
                .then((data) => Boolean(data.attributes.is_installing));

            return isInstalling ?  null : server.serverId;
        }
        return server?.serverId || null;
    }

    return null;
}
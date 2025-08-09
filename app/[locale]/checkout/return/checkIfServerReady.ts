"use server"

import { auth } from "@/auth"
import { prisma } from "@/prisma";

const endpointSecret = process.env.webhookSecret;
const panelUrl = process.env.NEXT_PUBLIC_PTERODACTYL_URL;

import { GameServerStatus } from "@prisma/client";

export default async function checkIfServerReady(stripeSession: string): Promise<{ status: GameServerStatus | null, serverId: string | null }> {
    const session = await auth();

    if (session?.user) {
        const serverOrder = await prisma.gameServerOrder.findFirst({ where: { stripeSessionId: stripeSession }, include: { gameServer: true} });

        // TODO: To use the new order logic, didnt get it fully yet

        if (!serverOrder) {
            return { status: null, serverId: null };
        }

        if (serverOrder.status === GameServerStatus.CREATED && serverOrder.gameServer.ptServerId) {
            try {
                const res = await fetch(`${panelUrl}/api/client/servers/${serverOrder.gameServer.ptServerId}`, {
                    method: 'GET',
                    headers: {
                        Authorization: `Bearer ${session.user.ptKey}`,
                        Accept: "application/json",
                        "Content-Type": "application/json",
                    },
                    next: { revalidate: 0 } // Disable cache for this request
                });

                if (res.ok) {
                    const data = await res.json();
                    const isInstalling = data.attributes.is_installing;

                    if (isInstalling === false) {
                        // The server is ready, update our DB and return the new status immediately.
                        await prisma.gameServer.update({
                            where: { id: serverOrder.gameServerId },
                            data: { status: "ACTIVE" },
                        });
                        // Return the new status directly to avoid a race condition.
                        return { status: GameServerStatus.DELETED, serverId: serverOrder.gameServer.ptServerId };
                    }
                    // If it's still installing, just return the current status.
                    return { status: GameServerStatus.CREATED, serverId: serverOrder.gameServer.ptServerId };
                } else {
                    console.error(`Pterodactyl API error: ${res.status} ${await res.text()}`);
                }
            } catch (error) {
                console.error("Failed to fetch server status:", error);
            }
        }
        
        // For any other status (PENDING, PAID, etc.), just return the current state from the DB.
        return { status: serverOrder.gameServer.status, serverId: serverOrder.gameServer.ptServerId  };
    }

    return { status: null, serverId: null };
}
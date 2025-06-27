"use server"

import { auth } from "@/auth"
import { prisma } from "@/prisma";

const endpointSecret = process.env.webhookSecret;
const panelUrl = process.env.NEXT_PUBLIC_PTERODACTYL_URL;

import { OrderStatus } from "@prisma/client";

export default async function checkIfServerReady(stripeSession: string): Promise<{ status: OrderStatus | null, serverId: string | null }> {
    const session = await auth();

    if (session?.user) {
        const serverOrder = await prisma.serverOrder.findFirst({ where: { stripeSessionId: stripeSession } });

        if (!serverOrder) {
            return { status: null, serverId: null };
        }

        if (serverOrder.status === OrderStatus.CREATED && serverOrder.serverId) {
            try {
                const res = await fetch(`${panelUrl}/api/client/servers/${serverOrder.serverId}`, {
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
                        await prisma.serverOrder.update({
                            where: { id: serverOrder.id },
                            data: { status: "INSTALLED" },
                        });
                        // Return the new status directly to avoid a race condition.
                        return { status: OrderStatus.INSTALLED, serverId: serverOrder.serverId };
                    }
                    // If it's still installing, just return the current status.
                    return { status: OrderStatus.CREATED, serverId: serverOrder.serverId };
                } else {
                    console.error(`Pterodactyl API error: ${res.status} ${await res.text()}`);
                }
            } catch (error) {
                console.error("Failed to fetch server status:", error);
            }
        }
        
        // For any other status (PENDING, PAID, etc.), just return the current state from the DB.
        return { status: serverOrder.status, serverId: serverOrder.serverId };
    }

    return { status: null, serverId: null };
}
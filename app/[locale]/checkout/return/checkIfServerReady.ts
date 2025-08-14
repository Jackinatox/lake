"use server"

import { auth } from "@/auth"
import { prisma } from "@/prisma";
import { ServerProvisionStatus } from "./ServerReadyPoller";

const panelUrl = process.env.NEXT_PUBLIC_PTERODACTYL_URL;

export default async function checkIfServerReady(stripeSession: string): Promise<{ status: ServerProvisionStatus | null, serverId: string | null }> {
    const session = await auth();

    if (session?.user) {
        const serverOrder = await prisma.gameServerOrder.findFirst({ where: { stripeSessionId: stripeSession }, include: { gameServer: true } });

        // TODO: To use the new order logic, didnt get it fully yet

        if (!serverOrder) {
            return { status: ServerProvisionStatus.ORDER_NOT_FOUND, serverId: null };
        }
        if (serverOrder.status === "PENDING") {
            return { status: ServerProvisionStatus.PAYMENT_PROCESSING, serverId: null }
        }
        if (serverOrder.status === "FAILED") {
            return { status: ServerProvisionStatus.PAYMENT_FAILED, serverId: null }
        }


        if (serverOrder.gameServer) {
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
                        return { status: ServerProvisionStatus.READY, serverId: serverOrder.gameServer.ptServerId };
                    }
                    // If it's still installing, just return the current status.
                    return { status: ServerProvisionStatus.PROVISIONING, serverId: serverOrder.gameServer.ptServerId };
                } else {
                    console.error(`Pterodactyl API error: ${res.status} ${await res.text()}`);
                    return { status: ServerProvisionStatus.INTERNAL_ERROR, serverId: null }
                }
            } catch (error) {
                console.error("Failed to fetch server status:", error);
                return { status: ServerProvisionStatus.INTERNAL_ERROR, serverId: null }
            }
        }

        // For any other status (PENDING, PAID, etc.), just return the current state from the DB.
        return { status: ServerProvisionStatus.READY, serverId: serverOrder.gameServer.ptServerId };
    }

    return { status: ServerProvisionStatus.INTERNAL_ERROR, serverId: null }
}
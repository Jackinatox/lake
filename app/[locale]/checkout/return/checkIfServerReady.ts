"use server"

import { auth } from "@/auth"
import { prisma } from "@/prisma";

const panelUrl = process.env.NEXT_PUBLIC_PTERODACTYL_URL;

import { GameServerStatus } from "@prisma/client";

// Extend GameServerStatus with custom types for API responses only
export type ExtendedGameServerStatus = GameServerStatus | "SERVER_NOT_FOUND" | "INSTALLING";

export default async function checkIfServerReady(
    stripeSession: string
): Promise<{ status: ExtendedGameServerStatus | null, serverId: string | null }> {
    const session = await auth();

    if (!session?.user)
        throw new Error("User not authenticated");

    // -------------------------

    const serverOrder = await prisma.gameServerOrder.findFirst({
        where: { stripeSessionId: stripeSession },
        include: { gameServer: true }
    });

    if (!serverOrder) {
        // Custom status for not found
        return { status: "SERVER_NOT_FOUND", serverId: null };
    }

    if (serverOrder.status === "PAID") {
        if (serverOrder.gameServer.status === "CREATED") {
            try {
                const res = await fetch(`${panelUrl}/api/client/servers/${serverOrder.gameServer.ptServerId}`, {
                    method: 'GET',
                    headers: {
                        Authorization: `Bearer ${session.user.ptKey}`,
                        Accept: "application/json",
                        "Content-Type": "application/json",
                    },
                    next: { revalidate: 0 }
                });

                if (res.ok) {
                    const data = await res.json();
                    const isInstalling = data.attributes.is_installing;

                    if (isInstalling === false) {
                        await prisma.gameServer.update({
                            where: { id: serverOrder.gameServerId },
                            data: { status: "ACTIVE" },
                        });
                        return { status: "ACTIVE", serverId: serverOrder.gameServer.ptServerId };
                    }
                    return { status: "INSTALLING", serverId: serverOrder.gameServer.ptServerId };
                } else {
                    console.error(`Pterodactyl API error: ${res.status} ${await res.text()}`);
                }
            } catch (error) {
                console.error("Failed to fetch server status:", error);
            }
        }
        return { status: "ACTIVE", serverId: serverOrder.gameServer.ptServerId };
    }

}
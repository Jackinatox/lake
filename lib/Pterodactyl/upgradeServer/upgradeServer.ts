import { prisma } from "@/prisma";
import { GameServerOrder } from "@prisma/client";
import * as Sentry from "@sentry/nextjs";
import { env } from 'next-runtime-env';
import { createPtClient } from "../ptAdminClient";

// This function doesnt auth the user, make sure to do that before calling this function
export default async function upgradeGameServer(serverOrder: GameServerOrder) {
    const panelUrl = env('NEXT_PUBLIC_PTERODACTYL_URL');
    const ptApiKey = env('PTERODACTYL_API_KEY');
    const gameServer = await prisma.gameServer.findUnique({
        where: { id: serverOrder.gameServerId },
        include: { user: true },
    });
    const pt = createPtClient();

    const ptServer = await pt.getServer(gameServer.ptAdminId.toString());

    console.log("expires: ", gameServer.expires);
    try {
        const response = await fetch(
            `${panelUrl}/api/application/servers/${gameServer.ptAdminId}/build`,
            {
                method: "PATCH",
                headers: {
                    Authorization: `Bearer ${ptApiKey}`,
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    allocation: ptServer.allocation,
                    memory: serverOrder.ramMB,
                    swap: ptServer.limits.swap,
                    disk: ptServer.limits.disk,
                    io: ptServer.limits.io,
                    cpu: serverOrder.cpuPercent,
                    feature_limits: {
                        allocations: ptServer.featureLimits.allocations,
                        databases: ptServer.featureLimits.databases,
                        backups: ptServer.featureLimits.backups,
                    },
                }),
            },
        );

        if (!response.ok) {
            throw new Error("PT API Error: " + (await response.json()));
        }
        console.log("ptServer: ", ptServer);
        const responseData = await response.json();
        console.log("response: ", responseData);
        await prisma.gameServer.update({
            where: { id: gameServer.id },
            data: {
                cpuPercent: serverOrder.cpuPercent,
                ramMB: serverOrder.ramMB,
                expires: serverOrder.expiresAt,
            },
        });
    } catch (error) {
        // TODO: notify admin
        Sentry.logger.fatal('Upgrade Server Error', { error })

        console.error("Error upgrading game server:", error);
        throw new Error("Failed to upgrade game server");
    }
}

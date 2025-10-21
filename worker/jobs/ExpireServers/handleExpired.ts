import { env } from "bun";
import type { GameServer } from "../../generated/client";
import { prisma } from "../../prisma";

export async function handleExpired(server: GameServer) {
    await suspendServer(server)
    // send suspended email
    await prisma.gameServer.update({
        where: { id: server.id },
        data: { status: 'EXPIRED' }
    })
    console.log(`Server ${server.id} marked as EXPIRED in database.`);
}

async function suspendServer(server: GameServer) {
    //simulate PT call
    console.log(`Suspending server ${server.id}`);
    const response = await fetch(env.NEXT_PUBLIC_PTERODACTYL_URL + `/api/application/${server.ptServerId}/suspend`, {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${env.PTERODACTYL_API_KEY}`,
            'Content-Type': 'application/json',
        },
    })
    await new Promise((resolve) => setTimeout(resolve, 50));
}
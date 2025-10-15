import { prisma } from "@/prisma";
import { GameServer } from "@prisma/client";

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
    // await new Promise((resolve) => setTimeout(resolve, 50));
}
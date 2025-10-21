import { parentPort } from "worker_threads";
import { prisma } from "../../prisma";
import { handleExpired } from "./handleExpired";

const JobName = "ExpireServers";

let processed = 0;
var shutdown = false;
const now = new Date();
const count = await prisma.gameServer.count({
    where: { expires: { lte: now }, status: { notIn: ['EXPIRED', 'DELETED', "CREATION_FAILED"] } },
})

parentPort?.on("message", (msg) => {
    if (msg?.type === "stop") {
        console.log(`${JobName} received stop signal`);
        shutdown = true;
    }
});

(async () => {
    console.log(`${JobName} started`);
    for (let i = 0; i < 70; i++) {
        if (shutdown) {
            throw new Error(`${JobName} stopping as requested`);
        }


        while (true) {
            const expiring = await prisma.gameServer.findMany({
                where: { expires: { lte: now }, status: { notIn: ['EXPIRED', 'DELETED', "CREATION_FAILED"] } },
                take: 20,
                orderBy: { expires: 'asc' },
            })

            if (expiring.length === 0) break

            for (const s of expiring) {
                processed += 1;
                console.log(`Notifying server ${s.id} of upcoming expiration at ${s.expires}`)
                await handleExpired(s);

                parentPort?.postMessage({ processed, total: count });

                await new Promise((resolve) => setTimeout(resolve, 200)); // Throttle to not overwhelm db and email service
            }
        }

    }
    parentPort?.postMessage('done');
})();



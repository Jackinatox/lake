import { parentPort } from "worker_threads";
import { prisma } from "../../prisma";
import { logInfo, logWarn, logError, logFatal, generateJobRunId } from "../../lib/logger";
import { WorkerJobType, type GameServer } from "../../generated/client";
import { handleServer as generateEmail } from "./handleReminder";

const JobName = "GenerateExpiryEmails";

let processed = 0;
var shutdown = false;

const jobRun = generateJobRunId(WorkerJobType.GENERATE_EMAILS);

const now = new Date();
const count = -1;

parentPort?.on("message", (msg) => {
    if (msg?.type === "stop") {
        console.log(`${JobName} received stop signal`);
        logWarn(WorkerJobType.GENERATE_EMAILS, "Job received stop signal", null, { jobRun }).catch(console.error);
        shutdown = true;
    }
});

(async () => {
    try {
        console.log(`${JobName} started`);
        await logInfo(WorkerJobType.GENERATE_EMAILS, `Job started, processing ${count} servers`, {
            totalServers: count,
            jobRun
        }, { jobRun });

        // Process 1-day expiry reminders
        const cutoffDate1Day = new Date(now.getTime() + 24 * 60 * 60 * 1000);
        const expiring1day = await prisma.gameServer.findMany({
            where: {
                expires: { lte: cutoffDate1Day, gt: now },
                status: { notIn: ['EXPIRED', 'DELETED', 'CREATION_FAILED'] },
                Email: {
                    none: { type: "DELETE_GAME_SERVER_1DAY", expiresAt: { gt: now, lte: cutoffDate1Day } }
                }
            },
            orderBy: { expires: 'asc' },
            include: { Email: true },
        });

        for (const server of expiring1day) {
            await createEmailJob(server, 1, jobRun);
            processed += 1;
        }

        // Process 7-day expiry reminders

        const cutoffDate7Days = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
        const expiring7days = await prisma.gameServer.findMany({
            where: {
                expires: { lte: cutoffDate7Days, gt: now },
                status: { notIn: ['EXPIRED', 'DELETED', 'CREATION_FAILED'] },
                Email: {
                    none: { type: "DELETE_GAME_SERVER_7DAYS", expiresAt: { gt: now, lte: cutoffDate7Days } }
                }
            },
            orderBy: { expires: 'asc' },
            include: { Email: true },
        });

        for (const server of expiring7days) {
            await createEmailJob(server, 7, jobRun);
            processed += 1;
        }



        await logInfo(WorkerJobType.GENERATE_EMAILS, `Job completed successfully`, {
            totalProcessed: processed,
            totalServers: count
        }, { jobRun });
        console.log(`${JobName} completed successfully, processed ${processed} servers`);

    } catch (error) {
        await logFatal(WorkerJobType.GENERATE_EMAILS, `Job failed with critical error`, {
            error: error instanceof Error ? error.message : String(error),
            stack: error instanceof Error ? error.stack : undefined,
            processed,
            total: count,
            jobRun
        }, { jobRun });

        console.error(`${JobName} failed:`, error);
        throw error;
    }

    parentPort?.postMessage('done');
})().catch(async (error) => {
    await logFatal(WorkerJobType.GENERATE_EMAILS, `Job crashed unexpectedly`, {
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
        processed,
        total: count,
        jobRun
    }, { jobRun });

    console.error(`${JobName} crashed:`, error);
    process.exit(1);
});


async function createEmailJob(server: GameServer, days: 1 | 7, jobRun: string) {
    try {
        console.log(`Generating email for server ${server.id} expires at ${server.expires}`)
        await generateEmail(server.id, days, jobRun, server.expires);

        parentPort?.postMessage({ processed, total: count });
    } catch (serverError) {
        await logError(WorkerJobType.GENERATE_EMAILS, `Failed to process individual server`, {
            serverId: server.id,
            error: serverError instanceof Error ? serverError.message : String(serverError),
            stack: serverError instanceof Error ? serverError.stack : undefined,
            serverDetails: {
                id: server.id,
                expires: server.expires,
                status: server.status,
                userId: server.userId
            }
        }, { gameServerId: server.id, userId: server.userId, jobRun });

        console.error(`Failed to process server ${server.id}:`, serverError);
        parentPort?.postMessage({ processed, total: count });
    }
}
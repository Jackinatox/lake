import { parentPort } from "worker_threads";
import { WorkerJobType } from "../../generated/client";
import { generateJobRunId, logError, logFatal, logInfo, logWarn } from "../../lib/logger";
import { prisma } from "../../prisma";
import { DELETE_GAMESERVER_AFTER_DAYS } from "../../WorkerConstants";
import { handleDeleted } from "./handleDeleted";

const JobName = "DeleteServers";

let processed = 0;
var shutdown = false;

// Generate a unique job run ID for this execution
const jobRun = generateJobRunId(WorkerJobType.DELETE_SERVERS);

const now = new Date();
// Calculate the deletion threshold: servers that expired DELETE_GAMESERVER_AFTER_DAYS ago
const deletionThreshold = new Date(now.getTime() - DELETE_GAMESERVER_AFTER_DAYS * 24 * 60 * 60 * 1000);

const count = await prisma.gameServer.count({
    where: { 
        expires: { lte: deletionThreshold }, 
        status: 'EXPIRED'
    },
})

parentPort?.on("message", (msg) => {
    if (msg?.type === "stop") {
        console.log(`${JobName} received stop signal`);
        logWarn(WorkerJobType.DELETE_SERVERS, "Job received stop signal", null, { jobRun }).catch(console.error);
        shutdown = true;
    }
});

(async () => {
    try {
        console.log(`${JobName} started`);
        await logInfo(WorkerJobType.DELETE_SERVERS, `Job started, processing ${count} servers`, {
            totalServers: count,
            deletionThreshold: deletionThreshold.toISOString(),
            jobRun
        }, { jobRun });

        while (true) {
            if (shutdown) {
                await logWarn(WorkerJobType.DELETE_SERVERS, "Job stopping as requested", { processed }, { jobRun });
                throw new Error(`${JobName} stopping as requested`);
            }

            const toDelete = await prisma.gameServer.findMany({
                where: { 
                    expires: { lte: deletionThreshold }, 
                    status: 'EXPIRED'
                },
                take: 20,
                orderBy: { expires: 'asc' },
            })

            if (toDelete.length === 0) break

            for (const server of toDelete) {
                try {
                    processed += 1;
                    console.log(`Processing server ${server.id} expired at ${server.expires}, deleting now`)
                    await handleDeleted(server, jobRun);

                    parentPort?.postMessage({ processed, total: count });

                } catch (serverError) {
                    await logError(WorkerJobType.DELETE_SERVERS, `Failed to process individual server`, {
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
        }

        await logInfo(WorkerJobType.DELETE_SERVERS, `Job completed successfully`, {
            totalProcessed: processed,
            totalServers: count
        }, { jobRun });
        console.log(`${JobName} completed successfully, processed ${processed} servers`);

    } catch (error) {
        await logFatal(WorkerJobType.DELETE_SERVERS, `Job failed with critical error`, {
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
    await logFatal(WorkerJobType.DELETE_SERVERS, `Job crashed unexpectedly`, {
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
        processed,
        total: count,
        jobRun
    }, { jobRun });

    console.error(`${JobName} crashed:`, error);
    process.exit(1);
});




import { parentPort } from "worker_threads";
import { prisma } from "../../prisma";
import { handleExpired } from "./handleExpired";
import { logInfo, logWarn, logError, logFatal, generateJobRunId } from "../../lib/logger";
import { WorkerJobType } from "../../generated/client";

const JobName = "ExpireServers";

let processed = 0;
var shutdown = false;

// Generate a unique job run ID for this execution
const jobRun = generateJobRunId(WorkerJobType.EXPIRE_SERVERS);

const now = new Date();
const count = await prisma.gameServer.count({
    where: { expires: { lte: now }, status: { notIn: ['EXPIRED', 'DELETED', "CREATION_FAILED"] } },
})

parentPort?.on("message", (msg) => {
    if (msg?.type === "stop") {
        console.log(`${JobName} received stop signal`);
        logWarn(WorkerJobType.EXPIRE_SERVERS, "Job received stop signal", null, { jobRun }).catch(console.error);
        shutdown = true;
    }
});

(async () => {
    try {
        console.log(`${JobName} started`);
        await logInfo(WorkerJobType.EXPIRE_SERVERS, `Job started, processing ${count} servers`, {
            totalServers: count,
            jobRun
        }, { jobRun });

        for (let i = 0; i < 70; i++) {
            if (shutdown) {
                await logWarn(WorkerJobType.EXPIRE_SERVERS, "Job stopping as requested", { iteration: i, processed }, { jobRun });
                throw new Error(`${JobName} stopping as requested`);
            }

            while (true) {
                const expiring = await prisma.gameServer.findMany({
                    where: { expires: { lte: now }, status: { notIn: ['EXPIRED', 'DELETED', "CREATION_FAILED"] } },
                    take: 20,
                    orderBy: { expires: 'asc' },
                })

                if (expiring.length === 0) break

                for (const server of expiring) {
                    try {
                        console.log(`Processing server ${server.id} expired at ${server.expires}`)
                        await handleExpired(server, jobRun);
                        processed += 1;

                        parentPort?.postMessage({ processed, total: count });

                    } catch (serverError) {
                        // Individual server processing failed, but continue with others
                        await logError(WorkerJobType.EXPIRE_SERVERS, `Failed to process individual server`, {
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
                        processed += 1; // Count as processed even if failed
                        parentPort?.postMessage({ processed, total: count });
                    }
                    await new Promise((resolve) => setTimeout(resolve, 400)); // Throttle to not overwhelm db and email service
                }
            }
        }

        await logInfo(WorkerJobType.EXPIRE_SERVERS, `Job completed successfully`, {
            totalProcessed: processed,
            totalServers: count
        }, { jobRun });
        console.log(`${JobName} completed successfully, processed ${processed} servers`);

    } catch (error) {
        await logFatal(WorkerJobType.EXPIRE_SERVERS, `Job failed with critical error`, {
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
    await logFatal(WorkerJobType.EXPIRE_SERVERS, `Job crashed unexpectedly`, {
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
        processed,
        total: count,
        jobRun
    }, { jobRun });

    console.error(`${JobName} crashed:`, error);
    process.exit(1);
});



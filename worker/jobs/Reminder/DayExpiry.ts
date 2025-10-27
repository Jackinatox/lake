import { parentPort } from "worker_threads";
import { prisma } from "../../prisma";
import { logInfo, logWarn, logError, logFatal, generateJobRunId } from "../../lib/logger";
import { WorkerJobType, type GameServer } from "../../generated/client";
import { handleServer as generateEmail } from "./handleReminder";

const JobName = "Generate1DayExpiryEmails";

let processed = 0;
var shutdown = false;

const jobRun = generateJobRunId(WorkerJobType.GENERATE_EMAILS);

const now = new Date();
const count = await prisma.gameServer.count({
    where: { expires: { lte: now }, status: { notIn: ['EXPIRED', 'DELETED', "CREATION_FAILED"] } },
})

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

        for (let i = 0; i < 70; i++) {
            if (shutdown) {
                await logWarn(WorkerJobType.GENERATE_EMAILS, "Job stopping as requested", { iteration: i, processed }, { jobRun });
                throw new Error(`${JobName} stopping as requested`);
            }

            while (true) {
                const cutoffDate = new Date(now.getTime() + 24 * 60 * 60 * 1000);
                const expiring = await prisma.gameServer.findMany({
                    where: {
            expires: { lte: cutoffDate, gt: now },
                        status: { notIn: ['EXPIRED', 'DELETED', 'CREATION_FAILED'] },
                        Email: {
                            none: {
                                type: "DELETE_GAME_SERVER_1DAY"
                            }
                        }
                    },
                    take: 20,
                    orderBy: { expires: 'asc' },
                    include: {
                        Email: true
                    },
                });

                // TODO: enable typescrript strict mode

                if (expiring.length === 0) break

                for (const server of expiring) {
                    try {
                        processed += 1;
                        console.log(`Generating email for server ${server.id} expires at ${server.expires}`)
                        await generateEmail(server.id, 1, jobRun);

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
            }
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
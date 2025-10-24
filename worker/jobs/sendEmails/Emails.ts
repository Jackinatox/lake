import { parentPort } from "worker_threads";
import { prisma } from "../../prisma";
import { logInfo, logWarn, logError, logFatal, generateJobRunId } from "../../lib/logger";
import { WorkerJobType } from "../../generated/client";
import SendEmail from "./sendEmail";

const JobName = "SendEmails";

let processed = 0;
var shutdown = false;

// Generate a unique job run ID for this execution
const jobRun = generateJobRunId(WorkerJobType.SEND_EMAILS);

const now = new Date();
const emailCount = await prisma.email.count({
    where: { retries: { lt: 4 }, status: { in: ["PENDING", "FAILED"] } },
})

parentPort?.on("message", (msg) => {
    if (msg?.type === "stop") {
        console.log(`${JobName} received stop signal`);
        logWarn(WorkerJobType.SEND_EMAILS, "Job received stop signal", null, { jobRun }).catch(console.error);
        shutdown = true;
    }
});

(async () => {
    try {
        console.log(`${JobName} started`);
        await logInfo(WorkerJobType.SEND_EMAILS, `Job started, sending ${emailCount} emails`, {
            totalEmails: emailCount,
            jobRun
        }, { jobRun });

        for (let i = 0; i < 70; i++) {
            if (shutdown) {
                await logWarn(WorkerJobType.SEND_EMAILS, "Job stopping as requested", { iteration: i, processed }, { jobRun });
                throw new Error(`${JobName} stopping as requested`);
            }

            while (true) {
                const emails = await prisma.email.findMany({
                    where: { retries: { lt: 4 }, status: { in: ["PENDING", "FAILED"] } },
                    take: 20,
                    orderBy: { createdAt: 'asc' },
                })

                if (emails.length === 0) break

                for (const email of emails) {
                    try {
                        processed += 1;
                        await SendEmail(email, jobRun);

                        parentPort?.postMessage({ processed, total: emailCount });

                    } catch (serverError) {
                        // Individual server processing failed, but continue with others
                        // TODO: Add Log function specialized to email
                        await logError(WorkerJobType.SEND_EMAILS, `Failed to send Email`, {
                            serverId: email.id,
                            error: serverError instanceof Error ? serverError.message : String(serverError),
                            stack: serverError instanceof Error ? serverError.stack : undefined,
                            serverDetails: {
                                id: email.id,
                                createdAt: email.createdAt,
                                status: email.status,
                                recipient: email.recipient
                            }
                        }, { gameServerId: undefined, userId: undefined, jobRun });

                        console.error(`Failed to process email ${email.id}:`, serverError);
                        parentPort?.postMessage({ processed, total: emailCount });
                    }
                    await new Promise((resolve) => setTimeout(resolve, 400)); // Throttle to not overwhelm db and email service
                }
            }
        }

        await logInfo(WorkerJobType.SEND_EMAILS, `Job completed successfully`, {
            totalProcessed: processed,
            totalServers: emailCount
        }, { jobRun });
        console.log(`${JobName} completed successfully, processed ${processed} emails`);

    } catch (error) {
        await logFatal(WorkerJobType.SEND_EMAILS, `Job failed with critical error`, {
            error: error instanceof Error ? error.message : String(error),
            stack: error instanceof Error ? error.stack : undefined,
            processed,
            total: emailCount,
            jobRun
        }, { jobRun });

        console.error(`${JobName} failed:`, error);
        throw error;
    }

    parentPort?.postMessage('done');
})().catch(async (error) => {
    await logFatal(WorkerJobType.SEND_EMAILS, `Job crashed unexpectedly`, {
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
        processed,
        total: emailCount,
        jobRun
    }, { jobRun });

    console.error(`${JobName} crashed:`, error);
    process.exit(1);
});



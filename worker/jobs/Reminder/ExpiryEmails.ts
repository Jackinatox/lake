import { parentPort } from 'worker_threads';
import { prisma } from '../../prisma';
import { logInfo, logWarn, logError, logFatal, generateJobRunId } from '../../lib/logger';
import { handleServer as generateEmail } from './handleReminder';
import { WorkerJobType } from '../../client/generated/enums';
import type { GameServer } from '../../client/generated/client';

const JobName = 'GenerateExpiryEmails';

let processed = 0;
var shutdown = false;

const jobRun = generateJobRunId(WorkerJobType.GENERATE_EMAILS);

const now = new Date();
const count = -1;

parentPort?.on('message', (msg) => {
    if (msg?.type === 'stop') {
        console.log(`${JobName} received stop signal`);
        logWarn(WorkerJobType.GENERATE_EMAILS, 'Job received stop signal', null, { jobRun }).catch(
            console.error,
        );
        shutdown = true;
    }
});

(async () => {
    try {
        console.log(`${JobName} started`);
        await logInfo(
            WorkerJobType.GENERATE_EMAILS,
            `Job started, processing ${count} servers`,
            {
                totalServers: count,
                jobRun,
            },
            { jobRun },
        );

        // Process 1-day expiry reminders
        // Find servers that expire in approximately 1 day (between now and 2 days from now)
        const twoDaysFromNow = new Date(now.getTime() + 2 * 24 * 60 * 60 * 1000);
        const expiring1day = await prisma.gameServer.findMany({
            where: {
                expires: { lte: twoDaysFromNow, gt: now },
                status: { notIn: ['EXPIRED', 'DELETED', 'CREATION_FAILED'] },
                Email: {
                    none: { type: 'GAME_SERVER_EXPIRING_1_DAY' },
                },
            },
            orderBy: { expires: 'asc' },
        });

        for (const server of expiring1day) {
            await createEmailJob(server, 1, jobRun);
            processed += 1;
        }

        // Process 7-day expiry reminders
        // Find servers that expire in approximately 7 days (between 6 and 8 days from now)
        const sixDaysFromNow = new Date(now.getTime() + 6 * 24 * 60 * 60 * 1000);
        const eightDaysFromNow = new Date(now.getTime() + 8 * 24 * 60 * 60 * 1000);
        const expiring7days = await prisma.gameServer.findMany({
            where: {
                expires: { lte: eightDaysFromNow, gte: sixDaysFromNow },
                status: { notIn: ['EXPIRED', 'DELETED', 'CREATION_FAILED'] },
                Email: {
                    none: { type: 'GAME_SERVER_EXPIRING_7_DAYS' },
                },
            },
            orderBy: { expires: 'asc' },
        });

        for (const server of expiring7days) {
            await createEmailJob(server, 7, jobRun);
            processed += 1;
        }

        await logInfo(
            WorkerJobType.GENERATE_EMAILS,
            `Job completed successfully`,
            {
                totalProcessed: processed,
                totalServers: count,
            },
            { jobRun },
        );
        console.log(`${JobName} completed successfully, processed ${processed} servers`);
    } catch (error) {
        await logFatal(
            WorkerJobType.GENERATE_EMAILS,
            `Job failed with critical error`,
            {
                error: error instanceof Error ? error.message : String(error),
                stack: error instanceof Error ? error.stack : undefined,
                processed,
                total: count,
                jobRun,
            },
            { jobRun },
        );

        console.error(`${JobName} failed:`, error);
        throw error;
    }

    parentPort?.postMessage('done');
})().catch(async (error) => {
    await logFatal(
        WorkerJobType.GENERATE_EMAILS,
        `Job crashed unexpectedly`,
        {
            error: error instanceof Error ? error.message : String(error),
            stack: error instanceof Error ? error.stack : undefined,
            processed,
            total: count,
            jobRun,
        },
        { jobRun },
    );

    console.error(`${JobName} crashed:`, error);
    process.exit(1);
});

async function createEmailJob(server: GameServer, days: 1 | 7, jobRun: string) {
    try {
        console.log(`Generating email for server ${server.id} expires at ${server.expires}`);
        await generateEmail(server.id, days, jobRun, server.expires);

        parentPort?.postMessage({ processed, total: count });
    } catch (serverError) {
        await logError(
            WorkerJobType.GENERATE_EMAILS,
            `Failed to process individual server`,
            {
                serverId: server.id,
                error: serverError instanceof Error ? serverError.message : String(serverError),
                stack: serverError instanceof Error ? serverError.stack : undefined,
                serverDetails: {
                    id: server.id,
                    expires: server.expires,
                    status: server.status,
                    userId: server.userId,
                },
            },
            { gameServerId: server.id, userId: server.userId, jobRun },
        );

        console.error(`Failed to process server ${server.id}:`, serverError);
        parentPort?.postMessage({ processed, total: count });
    }
}

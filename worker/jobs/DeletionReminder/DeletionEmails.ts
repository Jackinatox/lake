import { parentPort } from 'worker_threads';
import { prisma } from '../../prisma';
import { logInfo, logWarn, logError, logFatal, generateJobRunId } from '../../lib/logger';
import { WorkerJobType, type GameServer } from '../../generated/client';
import { handleServer as generateEmail } from './handleDeletionReminder';
import { DELETE_GAMESERVER_AFTER_DAYS } from '../../WorkerConstants';

const JobName = 'GenerateDeletionEmails';

let processed = 0;
var shutdown = false;

const jobRun = generateJobRunId(WorkerJobType.GENERATE_DELETION_EMAILS);

const now = new Date();
const count = -1;

parentPort?.on('message', (msg) => {
    if (msg?.type === 'stop') {
        console.log(`${JobName} received stop signal`);
        logWarn(WorkerJobType.GENERATE_DELETION_EMAILS, 'Job received stop signal', null, {
            jobRun,
        }).catch(console.error);
        shutdown = true;
    }
});

(async () => {
    try {
        console.log(`${JobName} started`);
        await logInfo(
            WorkerJobType.GENERATE_DELETION_EMAILS,
            `Job started, processing ${count} servers`,
            {
                totalServers: count,
                jobRun,
            },
            { jobRun },
        );

        // Process 1-day deletion reminders
        // Find servers that will be deleted in approximately 1 day (between now and 2 days from now)
        const oneDayFromNow = new Date(now.getTime() + 24 * 60 * 60 * 1000);
        const twoDaysFromNow = new Date(now.getTime() + 2 * 24 * 60 * 60 * 1000);
        const expiryThreshold1DayMin = new Date(
            now.getTime() - (DELETE_GAMESERVER_AFTER_DAYS - 1) * 24 * 60 * 60 * 1000,
        );
        const expiryThreshold1DayMax = new Date(
            twoDaysFromNow.getTime() - DELETE_GAMESERVER_AFTER_DAYS * 24 * 60 * 60 * 1000,
        );

        const deleting1day = await prisma.gameServer.findMany({
            where: {
                expires: { lte: expiryThreshold1DayMax, gte: expiryThreshold1DayMin },
                status: 'EXPIRED',
                Email: {
                    none: {
                        type: 'GAME_SERVER_DELETION_1_DAY',
                    },
                },
            },
            orderBy: { expires: 'asc' },
            include: { Email: true },
        });

        for (const server of deleting1day) {
            const deletionDate = new Date(server.expires);
            deletionDate.setDate(deletionDate.getDate() + DELETE_GAMESERVER_AFTER_DAYS);

            await createEmailJob(server, 1, jobRun, deletionDate);
            processed += 1;
        }

        // Process 7-day deletion reminders
        // Find servers that will be deleted in approximately 7 days (between 6 and 8 days from now)
        const sixDaysFromNow = new Date(now.getTime() + 6 * 24 * 60 * 60 * 1000);
        const eightDaysFromNow = new Date(now.getTime() + 8 * 24 * 60 * 60 * 1000);
        const expiryThreshold7DayMin = new Date(
            sixDaysFromNow.getTime() - DELETE_GAMESERVER_AFTER_DAYS * 24 * 60 * 60 * 1000,
        );
        const expiryThreshold7DayMax = new Date(
            eightDaysFromNow.getTime() - DELETE_GAMESERVER_AFTER_DAYS * 24 * 60 * 60 * 1000,
        );

        const deleting7days = await prisma.gameServer.findMany({
            where: {
                expires: { lte: expiryThreshold7DayMax, gte: expiryThreshold7DayMin },
                status: 'EXPIRED',
                Email: {
                    none: {
                        type: 'GAME_SERVER_DELETION_7_DAYS',
                    },
                },
            },
            orderBy: { expires: 'asc' },
            include: { Email: true },
        });

        for (const server of deleting7days) {
            const deletionDate = new Date(server.expires);
            deletionDate.setDate(deletionDate.getDate() + DELETE_GAMESERVER_AFTER_DAYS);

            await createEmailJob(server, 7, jobRun, deletionDate);
            processed += 1;
        }

        await logInfo(
            WorkerJobType.GENERATE_DELETION_EMAILS,
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
            WorkerJobType.GENERATE_DELETION_EMAILS,
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
        WorkerJobType.GENERATE_DELETION_EMAILS,
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

async function createEmailJob(server: GameServer, days: 1 | 7, jobRun: string, deletionDate: Date) {
    try {
        console.log(
            `Generating deletion email for server ${server.id} expires at ${server.expires}, deletes at ${deletionDate}`,
        );
        await generateEmail(server.id, days, jobRun, deletionDate);

        parentPort?.postMessage({ processed, total: count });
    } catch (serverError) {
        await logError(
            WorkerJobType.GENERATE_DELETION_EMAILS,
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

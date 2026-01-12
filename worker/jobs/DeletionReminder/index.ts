import { prisma } from '../../prisma';
import { logInfo, logError, logFatal, generateJobRunId } from '../../lib/logger';
import { handleServer as generateEmail } from './handleDeletionReminder';
import { DELETE_GAMESERVER_AFTER_DAYS } from '../../WorkerConstants';
import { WorkerJobType } from '../../client/generated/enums';
import type { GameServer } from '../../client/generated/client';

const JobName = 'GenerateDeletionEmails';

export async function runGenerateDeletionEmails(): Promise<{ processed: number }> {
    let processed = 0;
    const jobRun = generateJobRunId(WorkerJobType.GENERATE_DELETION_EMAILS);
    const now = new Date();

    try {
        console.log(`${JobName} started`);
        await logInfo(
            WorkerJobType.GENERATE_DELETION_EMAILS,
            `Job started`,
            { jobRun },
            { jobRun },
        );

        // Process 1-day deletion reminders
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
                Email: { none: { type: 'GAME_SERVER_DELETION_1_DAY' } },
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
                Email: { none: { type: 'GAME_SERVER_DELETION_7_DAYS' } },
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
            { totalProcessed: processed },
            { jobRun },
        );
        console.log(`${JobName} completed successfully, processed ${processed} servers`);
        return { processed };
    } catch (error) {
        await logFatal(
            WorkerJobType.GENERATE_DELETION_EMAILS,
            `Job failed with critical error`,
            {
                error: error instanceof Error ? error.message : String(error),
                stack: error instanceof Error ? error.stack : undefined,
                processed,
                jobRun,
            },
            { jobRun },
        );
        console.error(`${JobName} failed:`, error);
        throw error;
    }
}

async function createEmailJob(server: GameServer, days: 1 | 7, jobRun: string, deletionDate: Date) {
    try {
        console.log(
            `Generating deletion email for server ${server.id} expires at ${server.expires}, deletes at ${deletionDate}`,
        );
        await generateEmail(server.id, days, jobRun, deletionDate);
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
    }
}

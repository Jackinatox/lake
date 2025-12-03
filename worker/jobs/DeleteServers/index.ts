import { generateJobRunId, logError, logFatal, logInfo } from '../../lib/logger';
import { prisma } from '../../prisma';
import { DELETE_GAMESERVER_AFTER_DAYS } from '../../WorkerConstants';
import { handleDeleted } from './handleDeleted';
import { WorkerJobType } from '../../client/generated/enums';

const JobName = 'DeleteServers';

export async function runDeleteServers(): Promise<{ processed: number; total: number }> {
    let processed = 0;
    const jobRun = generateJobRunId(WorkerJobType.DELETE_SERVERS);

    const now = new Date();
    const deletionThreshold = new Date(
        now.getTime() - DELETE_GAMESERVER_AFTER_DAYS * 24 * 60 * 60 * 1000,
    );

    const count = await prisma.gameServer.count({
        where: {
            expires: { lte: deletionThreshold },
            status: 'EXPIRED',
        },
    });

    try {
        console.log(`${JobName} started`);
        await logInfo(
            WorkerJobType.DELETE_SERVERS,
            `Job started, processing ${count} servers`,
            { totalServers: count, deletionThreshold: deletionThreshold.toISOString(), jobRun },
            { jobRun },
        );

        while (true) {
            const toDelete = await prisma.gameServer.findMany({
                where: {
                    expires: { lte: deletionThreshold },
                    status: 'EXPIRED',
                },
                take: 20,
                orderBy: { expires: 'asc' },
            });

            if (toDelete.length === 0) break;

            for (const server of toDelete) {
                try {
                    processed += 1;
                    console.log(`Processing server ${server.id} expired at ${server.expires}, deleting now`);
                    await handleDeleted(server, jobRun);
                } catch (serverError) {
                    await logError(
                        WorkerJobType.DELETE_SERVERS,
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
        }

        await logInfo(
            WorkerJobType.DELETE_SERVERS,
            `Job completed successfully`,
            { totalProcessed: processed, totalServers: count },
            { jobRun },
        );
        console.log(`${JobName} completed successfully, processed ${processed} servers`);
        return { processed, total: count };
    } catch (error) {
        await logFatal(
            WorkerJobType.DELETE_SERVERS,
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
}

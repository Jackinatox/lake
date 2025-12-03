import { generateJobRunId, logError, logFatal, logInfo, logWarn } from '../../lib/logger';
import { prisma } from '../../prisma';
import { handleExpired } from './handleExpired';
import { WorkerJobType } from '../../client/generated/enums';

const JobName = 'ExpireServers';

export async function runExpireServers(): Promise<{ processed: number; total: number }> {
    let processed = 0;
    const jobRun = generateJobRunId(WorkerJobType.EXPIRE_SERVERS);

    const now = new Date();
    const count = await prisma.gameServer.count({
        where: { expires: { lte: now }, status: { notIn: ['EXPIRED', 'DELETED', 'CREATION_FAILED'] } },
    });

    try {
        console.log(`${JobName} started`);
        await logInfo(
            WorkerJobType.EXPIRE_SERVERS,
            `Job started, processing ${count} servers`,
            { totalServers: count, jobRun },
            { jobRun },
        );

        while (true) {
            const expiring = await prisma.gameServer.findMany({
                where: {
                    expires: { lte: now },
                    status: { notIn: ['EXPIRED', 'DELETED', 'CREATION_FAILED'] },
                },
                take: 20,
                orderBy: { expires: 'asc' },
            });

            if (expiring.length === 0) break;

            for (const server of expiring) {
                try {
                    processed += 1;
                    console.log(`Processing server ${server.id} expired at ${server.expires}`);
                    await handleExpired(server, jobRun);
                } catch (serverError) {
                    await logError(
                        WorkerJobType.EXPIRE_SERVERS,
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
            WorkerJobType.EXPIRE_SERVERS,
            `Job completed successfully`,
            { totalProcessed: processed, totalServers: count },
            { jobRun },
        );
        console.log(`${JobName} completed successfully, processed ${processed} servers`);
        return { processed, total: count };
    } catch (error) {
        await logFatal(
            WorkerJobType.EXPIRE_SERVERS,
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

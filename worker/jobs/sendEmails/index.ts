import { prisma } from '../../prisma';
import { logInfo, logError, logFatal, generateJobRunId } from '../../lib/logger';
import SendEmail from './sendEmail';
import { WorkerJobType } from '../../client/generated/enums';

const JobName = 'SendEmails';

export async function runSendEmails(): Promise<{ processed: number; total: number }> {
    let processed = 0;
    const jobRun = generateJobRunId(WorkerJobType.SEND_EMAILS);

    const emailCount = await prisma.email.count({
        where: { retries: { lt: 4 }, status: { in: ['PENDING', 'FAILED'] } },
    });

    try {
        console.log(`${JobName} started`);
        await logInfo(
            WorkerJobType.SEND_EMAILS,
            `Job started, sending ${emailCount} emails`,
            { totalEmails: emailCount, jobRun },
            { jobRun },
        );

        while (true) {
            const emails = await prisma.email.findMany({
                where: { retries: { lt: 4 }, status: { in: ['PENDING', 'FAILED'] } },
                take: 20,
                orderBy: { createdAt: 'asc' },
            });

            if (emails.length === 0) break;

            for (const email of emails) {
                try {
                    processed += 1;
                    await SendEmail(email, jobRun);
                } catch (serverError) {
                    await logError(
                        WorkerJobType.SEND_EMAILS,
                        `Failed to send Email`,
                        {
                            emailId: email.id,
                            error:
                                serverError instanceof Error
                                    ? serverError.message
                                    : String(serverError),
                            stack: serverError instanceof Error ? serverError.stack : undefined,
                            emailDetails: {
                                id: email.id,
                                createdAt: email.createdAt,
                                status: email.status,
                                recipient: email.recipient,
                            },
                        },
                        { jobRun },
                    );
                    console.error(`Failed to process email ${email.id}:`, serverError);
                }
                // Throttle to not overwhelm db and email service
                await new Promise((resolve) => setTimeout(resolve, 400));
            }
        }

        await logInfo(
            WorkerJobType.SEND_EMAILS,
            `Job completed successfully`,
            { totalProcessed: processed, totalEmails: emailCount },
            { jobRun },
        );
        console.log(`${JobName} completed successfully, processed ${processed} emails`);
        return { processed, total: emailCount };
    } catch (error) {
        await logFatal(
            WorkerJobType.SEND_EMAILS,
            `Job failed with critical error`,
            {
                error: error instanceof Error ? error.message : String(error),
                stack: error instanceof Error ? error.stack : undefined,
                processed,
                total: emailCount,
                jobRun,
            },
            { jobRun },
        );
        console.error(`${JobName} failed:`, error);
        throw error;
    }
}

import { GameServerOrder } from '@/app/client/generated/browser';
import { logger } from '@/lib/logger';
import { env } from 'next-runtime-env';

export type JobId = string;

export async function provisionServerWithWorker(order: GameServerOrder): Promise<JobId> {
    try {
        const workerUrl = env('WORKER_IP');

        const response = await fetch(`${workerUrl}/v1/queue/provision`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ orderId: order.id }),
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`Failed to queue server provisioning job: ${errorText}`);
        }

        const data = await response.json();
        const jobId: JobId = data.jobId;

        logger.trace('Queued server provisioning job with worker', 'GAME_SERVER', {
            userId: order.userId,
            details: { jobId },
        });

        return jobId;
    } catch (error) {
        logger.error('Error provisioning server with worker', 'GAME_SERVER', {
            userId: order.userId,
            details: { error: error instanceof Error ? error.message : JSON.stringify(error) },
        });
        throw error;
    }
}

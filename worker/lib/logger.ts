import { LogLevel, type WorkerJobType } from '../client/generated/enums';
import { prisma } from '../prisma';

// Simple logging functions
export async function logInfo(
    jobType: WorkerJobType,
    message: string,
    details?: any,
    context?: { gameServerId?: string; userId?: string; jobRun?: string },
) {
    return log(LogLevel.INFO, jobType, message, details, context);
}

export async function logWarn(
    jobType: WorkerJobType,
    message: string,
    details?: any,
    context?: { gameServerId?: string; userId?: string; jobRun?: string },
) {
    return log(LogLevel.WARN, jobType, message, details, context);
}

export async function logError(
    jobType: WorkerJobType,
    message: string,
    details?: any,
    context?: { gameServerId?: string; userId?: string; jobRun?: string },
) {
    return log(LogLevel.ERROR, jobType, message, details, context);
}

export async function logFatal(
    jobType: WorkerJobType,
    message: string,
    details?: any,
    context?: { gameServerId?: string; userId?: string; jobRun?: string },
) {
    return log(LogLevel.FATAL, jobType, message, details, context);
}

async function log(
    level: LogLevel,
    jobType: WorkerJobType,
    message: string,
    details?: any,
    context?: { gameServerId?: string; userId?: string; jobRun?: string },
) {
    try {
        await prisma.workerLog.create({
            data: {
                jobType,
                jobRun: context?.jobRun || `error_no_jobRun_${Date.now()}`,
                level,
                message,
                details: details ? JSON.parse(JSON.stringify(details)) : null,
                gameServerId: context?.gameServerId || null,
                userId: context?.userId || null,
            },
        });

        // Also log to console for immediate feedback
        const contextStr = context
            ? ` [GameServer: ${context.gameServerId || 'N/A'}, User: ${context.userId || 'N/A'}]`
            : '';
        console.log(`[${level}:${jobType}] ${message}${contextStr}`);
    } catch (error) {
        // Fallback to console if database logging fails
        console.error('Failed to log to database:', error);
        console.log(`[${level}:${jobType}] ${message}`);
        // TODO: Notify developers about logging failure (e.g., via email or external service)
    }
}

// Utility function to generate a job run ID
export function generateJobRunId(jobType: WorkerJobType): string {
    return `${jobType}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

// Utility functions for querying logs
export async function getRecentLogs(jobType?: WorkerJobType, limit: number = 100) {
    return prisma.workerLog.findMany({
        where: jobType ? { jobType } : undefined,
        include: {
            gameServer: {
                select: { id: true, name: true, status: true },
            },
            user: {
                select: { id: true, name: true, email: true },
            },
        },
        orderBy: { createdAt: 'desc' },
        take: limit,
    });
}

export async function getErrorLogs(jobType?: WorkerJobType, hours: number = 24) {
    const since = new Date(Date.now() - hours * 60 * 60 * 1000);
    return prisma.workerLog.findMany({
        where: {
            jobType,
            level: { in: [LogLevel.ERROR, LogLevel.FATAL] },
            createdAt: { gte: since },
        },
        include: {
            gameServer: {
                select: { id: true, name: true, status: true },
            },
            user: {
                select: { id: true, name: true, email: true },
            },
        },
        orderBy: { createdAt: 'desc' },
    });
}

export async function getJobRunLogs(jobRun: string) {
    return prisma.workerLog.findMany({
        where: { jobRun },
        include: {
            gameServer: {
                select: { id: true, name: true, status: true },
            },
            user: {
                select: { id: true, name: true, email: true },
            },
        },
        orderBy: { createdAt: 'asc' },
    });
}

export async function getFailedJobRuns(jobType?: WorkerJobType, hours: number = 24) {
    const since = new Date(Date.now() - hours * 60 * 60 * 1000);
    return prisma.workerLog.groupBy({
        by: ['jobRun'],
        where: {
            jobType,
            level: { in: [LogLevel.ERROR, LogLevel.FATAL] },
            createdAt: { gte: since },
        },
        _count: { id: true },
    });
}

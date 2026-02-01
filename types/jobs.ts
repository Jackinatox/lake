// Types matching the API documentation
export type WorkerJobType =
    | 'EXPIRE_SERVERS'
    | 'SEND_EMAILS'
    | 'GENERATE_EMAILS'
    | 'DELETE_SERVERS'
    | 'GENERATE_DELETION_EMAILS'
    | 'CHECK_NEW_VERSIONS';

export type JobRunStatus = 'RUNNING' | 'COMPLETED' | 'FAILED' | 'CANCELLED';

export type LogLevel = 'TRACE' | 'INFO' | 'WARN' | 'ERROR' | 'FATAL';

export interface JobStatusResponse {
    timestamp: string;
    jobs: Record<string, { isRunning: boolean }>;
}

export interface JobRunSummary {
    id: string;
    jobType: WorkerJobType;
    status: JobRunStatus;
    startedAt: string;
    endedAt: string | null;
    itemsProcessed: number;
    itemsTotal: number;
    itemsFailed: number;
    errorMessage: string | null;
}

export interface RecentRunsResponse {
    timestamp: string;
    runs: JobRunSummary[];
}

export interface WorkerLog {
    id: number;
    jobType: WorkerJobType;
    jobRun: string;
    level: LogLevel;
    message: string;
    details: Record<string, unknown> | null;
    gameServerId: string | null;
    userId: string | null;
    createdAt: string;
    gameServer: {
        id: string;
        name: string;
        status: string;
    } | null;
    user: {
        id: string;
        name: string;
        email: string;
    } | null;
}

export interface JobRunDetails extends JobRunSummary {
    errorStack: string | null;
    metadata: Record<string, unknown> | null;
    logs: WorkerLog[];
}

export interface TriggerJobResponse {
    timestamp: string;
    success: boolean;
    result?: {
        processed: number;
        total: number;
        failed: number;
    };
    error?: string;
}

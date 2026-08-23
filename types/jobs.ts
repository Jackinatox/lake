import type { GameServer, JobRun, User, WorkerLog } from '@/app/client/generated/browser';

/**
 * Rows reach the client as JSON, so every `Date` column arrives as an ISO string.
 */
type Serialized<T> = {
    [K in keyof T]: [T[K]] extends [Date]
        ? string
        : [T[K]] extends [Date | null]
          ? string | null
          : T[K];
};

/** `/api/jobs/status` — proxied from the worker, not stored in the DB. */
export interface JobStatusResponse {
    timestamp: string;
    jobs: Record<string, { isRunning: boolean }>;
}

/** A `JobRun` row without the columns only the details endpoint returns. */
export type JobRunSummary = Serialized<Omit<JobRun, 'errorStack' | 'metadata'>>;

/** `/api/jobs/runs` — the latest run per job type. */
export interface RecentRunsResponse {
    timestamp: string;
    runs: JobRunSummary[];
}

/** A `WorkerLog` row with the game server / user context the details endpoint includes. */
export interface JobRunLog extends Serialized<WorkerLog> {
    gameServer: Pick<GameServer, 'id' | 'name' | 'status'> | null;
    user: Pick<User, 'id' | 'name' | 'username' | 'email'> | null;
}

/** `/api/jobs/runs/[id]` — the full `JobRun` row plus its logs. */
export interface JobRunDetails extends Serialized<JobRun> {
    logs: JobRunLog[];
}

/** `/api/jobs/trigger/[jobName]` — proxied from the worker. */
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

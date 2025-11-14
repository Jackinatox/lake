export interface JobStatus {
    running: boolean;
    processed: number;
    total: number;
    lastRun?: string;
}

export type JobStatusMap = Record<string, JobStatus>;

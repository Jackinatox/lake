import { WorkerJobType } from '@/app/client/generated/browser';

/**
 * The worker owns the list of runnable jobs and exposes each one under a PascalCase name
 * (`/api/jobs/status` returns them as the keys of its `jobs` map). Lake never hardcodes that
 * list: whatever the worker reports gets a card, and whatever it accepts can be triggered.
 *
 * A job name is the PascalCase form of its `WorkerJobType`, apart from the exceptions below.
 * The mapping is only needed to line a card up with its latest `JobRun` row.
 */
const JOB_NAME_TO_TYPE_OVERRIDES: Record<string, WorkerJobType> = {
    GenerateExpiryEmails: WorkerJobType.GENERATE_EMAILS,
};

/** Job names are interpolated into the worker URL, so keep them to a bare identifier. */
const JOB_NAME_PATTERN = /^[A-Za-z][A-Za-z0-9]*$/;

export function isValidWorkerJobName(jobName: string): boolean {
    return JOB_NAME_PATTERN.test(jobName);
}

/** `ExpireServers` → `EXPIRE_SERVERS`; `undefined` when the worker job has no DB enum value. */
export function workerJobNameToJobType(jobName: string): WorkerJobType | undefined {
    const override = JOB_NAME_TO_TYPE_OVERRIDES[jobName];
    if (override) return override;

    const jobType = jobName.replace(/([a-z0-9])([A-Z])/g, '$1_$2').toUpperCase();

    return Object.values(WorkerJobType).find((value) => value === jobType);
}

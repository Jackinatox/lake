'use client';

import { useJobStatus, useRecentRuns } from '@/hooks/useJobsApi';
import { JobStatusCardNew } from './JobStatusCardNew';
import { AlertCircle } from 'lucide-react';
import { JobStatusSkeleton } from './Job-Status-Sekelton';
import { workerJobNameToJobType } from '@/lib/jobs/workerJobs';

export function JobStatusGrid() {
    const {
        data: statusData,
        error: statusError,
        isLoading: statusLoading,
        refetch: refetchStatus,
    } = useJobStatus();
    const { data: runsData, error: runsError, refetch: refetchRuns } = useRecentRuns();

    const handleTriggerSuccess = () => {
        refetchStatus();
        refetchRuns();
    };

    if (statusLoading) {
        return <JobStatusSkeleton />;
    }

    if (statusError) {
        return (
            <div className="p-4 border border-destructive/50 rounded-lg bg-destructive/10 flex items-center gap-2">
                <AlertCircle className="h-5 w-5 text-destructive" />
                <span className="text-destructive">
                    Failed to fetch job statuses: {statusError}
                </span>
            </div>
        );
    }

    if (!statusData || !statusData.jobs) {
        return (
            <div className="p-4 border rounded-lg">
                <p className="text-muted-foreground">No job data available</p>
            </div>
        );
    }

    return (
        <div className="grid gap-3 md:gap-4 md:grid-cols-2 lg:grid-cols-3 mb-6">
            {Object.entries(statusData.jobs).map(([jobName, jobData]) => {
                // Find the most recent run for this job
                const jobType = workerJobNameToJobType(jobName);
                const lastRun = runsData?.runs?.find((run) => run.jobType === jobType);

                return (
                    <JobStatusCardNew
                        key={jobName}
                        jobName={jobName}
                        isRunning={jobData.isRunning}
                        lastRun={lastRun}
                        onTriggerSuccess={handleTriggerSuccess}
                    />
                );
            })}
        </div>
    );
}

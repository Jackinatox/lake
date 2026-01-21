'use client';

import { useState, useEffect, useCallback } from 'react';
import type {
    JobStatusResponse,
    RecentRunsResponse,
    JobRunDetails,
    TriggerJobResponse,
} from '@/types/jobs';

const POLLING_INTERVALS = {
    jobStatus: 15000, // 15 seconds
    recentRuns: 30000, // 30 seconds
    runDetails: 5000, // 5 seconds (only when viewing details of RUNNING job)
};

// Hook for job status polling
export function useJobStatus() {
    const [data, setData] = useState<JobStatusResponse | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    const fetchStatus = useCallback(async () => {
        try {
            const response = await fetch('/api/jobs/status');
            if (!response.ok) throw new Error('Failed to fetch job status');
            const json = await response.json();
            setData(json);
            setError(null);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Unknown error');
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchStatus();
        const interval = setInterval(fetchStatus, POLLING_INTERVALS.jobStatus);
        return () => clearInterval(interval);
    }, [fetchStatus]);

    return { data, error, isLoading, refetch: fetchStatus };
}

// Hook for recent runs polling
export function useRecentRuns() {
    const [data, setData] = useState<RecentRunsResponse | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    const fetchRuns = useCallback(async () => {
        try {
            const response = await fetch('/api/jobs/runs');
            if (!response.ok) throw new Error('Failed to fetch job runs');
            const json = await response.json();
            setData(json);
            setError(null);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Unknown error');
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchRuns();
        const interval = setInterval(fetchRuns, POLLING_INTERVALS.recentRuns);
        return () => clearInterval(interval);
    }, [fetchRuns]);

    return { data, error, isLoading, refetch: fetchRuns };
}

// Hook for job run details with conditional polling
export function useJobRunDetails(runId: string | null, enabled: boolean = true) {
    const [data, setData] = useState<JobRunDetails | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);

    const fetchDetails = useCallback(async () => {
        if (!runId || !enabled) return;

        setIsLoading(true);
        try {
            const response = await fetch(`/api/jobs/runs/${runId}`);
            if (response.status === 404) {
                setError('Job run not found');
                setData(null);
                return;
            }
            if (!response.ok) throw new Error('Failed to fetch job run details');
            const json = await response.json();
            setData(json);
            setError(null);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Unknown error');
        } finally {
            setIsLoading(false);
        }
    }, [runId, enabled]);

    useEffect(() => {
        if (!enabled || !runId) {
            setData(null);
            return;
        }

        fetchDetails();

        // Poll faster if job is running
        const interval = setInterval(() => {
            if (data?.status === 'RUNNING') {
                fetchDetails();
            }
        }, POLLING_INTERVALS.runDetails);

        return () => clearInterval(interval);
    }, [runId, enabled, fetchDetails, data?.status]);

    return { data, error, isLoading, refetch: fetchDetails };
}

// Hook for triggering jobs
export function useTriggerJob() {
    const [isTriggering, setIsTriggering] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const triggerJob = useCallback(async (jobName: string): Promise<TriggerJobResponse | null> => {
        setIsTriggering(true);
        setError(null);

        try {
            const response = await fetch(`/api/jobs/trigger/${jobName}`, {
                method: 'POST',
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Failed to trigger job');
            }

            const result = await response.json();
            return result;
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Unknown error';
            setError(errorMessage);
            return null;
        } finally {
            setIsTriggering(false);
        }
    }, []);

    return { triggerJob, isTriggering, error };
}

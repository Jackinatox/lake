'use client';

import { useRecentRuns } from '@/hooks/useJobsApi';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertCircle, CheckCircle2, XCircle, Loader2, Clock, Eye } from 'lucide-react';
import type { JobRunSummary, JobRunStatus } from '@/types/jobs';
import { formatDistanceToNow } from 'date-fns';

interface RecentRunsTableProps {
    onViewDetails: (runId: string) => void;
}

const STATUS_CONFIG: Record<
    JobRunStatus,
    { variant: 'default' | 'destructive' | 'secondary' | 'outline'; icon: any; label: string }
> = {
    RUNNING: { variant: 'default', icon: Loader2, label: 'Running' },
    COMPLETED: { variant: 'secondary', icon: CheckCircle2, label: 'Completed' },
    FAILED: { variant: 'destructive', icon: XCircle, label: 'Failed' },
    CANCELLED: { variant: 'outline', icon: XCircle, label: 'Cancelled' },
};

function RunRow({ run, onViewDetails }: { run: JobRunSummary; onViewDetails: (id: string) => void }) {
    const statusConfig = STATUS_CONFIG[run.status];
    const Icon = statusConfig.icon;
    const duration = run.endedAt
        ? Math.round((new Date(run.endedAt).getTime() - new Date(run.startedAt).getTime()) / 1000)
        : null;

    return (
        <div className="flex flex-col sm:flex-row sm:items-center gap-3 p-3 md:p-4 border rounded-lg hover:bg-accent/50 transition-colors">
            <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                    <Badge variant={statusConfig.variant} className="shrink-0">
                        {run.status === 'RUNNING' ? (
                            <Icon className="h-3 w-3 mr-1 animate-spin" />
                        ) : (
                            <Icon className="h-3 w-3 mr-1" />
                        )}
                        {statusConfig.label}
                    </Badge>
                    <span className="font-medium text-sm truncate">{run.jobType}</span>
                </div>

                <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {formatDistanceToNow(new Date(run.startedAt), { addSuffix: true })}
                    </span>
                    {duration !== null && <span>Duration: {duration}s</span>}
                    <span>
                        Progress: {run.itemsProcessed}/{run.itemsTotal}
                    </span>
                    {run.itemsFailed > 0 && (
                        <span className="text-destructive font-medium">Failed: {run.itemsFailed}</span>
                    )}
                </div>

                {run.errorMessage && (
                    <p className="text-xs text-destructive mt-1 truncate">{run.errorMessage}</p>
                )}
            </div>

            <Button
                variant="outline"
                size="sm"
                onClick={() => onViewDetails(run.id)}
                className="shrink-0"
            >
                <Eye className="h-4 w-4 mr-2" />
                Details
            </Button>
        </div>
    );
}

export function RecentRunsTable({ onViewDetails }: RecentRunsTableProps) {
    const { data, error, isLoading } = useRecentRuns();

    if (isLoading) {
        return (
            <Card>
                <CardHeader>
                    <CardTitle>Recent Job Runs</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="flex items-center justify-center py-8">
                        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                    </div>
                </CardContent>
            </Card>
        );
    }

    if (error) {
        return (
            <Card>
                <CardHeader>
                    <CardTitle>Recent Job Runs</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="flex items-center gap-2 text-destructive">
                        <AlertCircle className="h-5 w-5" />
                        <span>Failed to fetch recent runs: {error}</span>
                    </div>
                </CardContent>
            </Card>
        );
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle>Recent Job Runs</CardTitle>
                <p className="text-sm text-muted-foreground">
                    Last updated: {data?.timestamp ? new Date(data.timestamp).toLocaleTimeString() : 'N/A'}
                </p>
            </CardHeader>
            <CardContent>
                {data?.runs && data.runs.length > 0 ? (
                    <div className="space-y-2">
                        {data.runs.map((run) => (
                            <RunRow key={run.id} run={run} onViewDetails={onViewDetails} />
                        ))}
                    </div>
                ) : (
                    <p className="text-center text-muted-foreground py-8">No recent job runs</p>
                )}
            </CardContent>
        </Card>
    );
}

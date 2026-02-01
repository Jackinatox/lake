'use client';

import { useJobRunDetails } from '@/hooks/useJobsApi';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Loader2, AlertCircle, CheckCircle2, XCircle, Clock } from 'lucide-react';
import type { JobRunStatus, LogLevel, WorkerLog } from '@/types/jobs';
import { formatDistanceToNow, format } from 'date-fns';
import { useState } from 'react';
import { Button } from '@/components/ui/button';

interface JobRunDetailsModalProps {
    runId: string | null;
    isOpen: boolean;
    onClose: () => void;
}

const STATUS_CONFIG: Record<
    JobRunStatus,
    { variant: 'default' | 'destructive' | 'secondary' | 'outline'; icon: any }
> = {
    RUNNING: { variant: 'default', icon: Loader2 },
    COMPLETED: { variant: 'secondary', icon: CheckCircle2 },
    FAILED: { variant: 'destructive', icon: XCircle },
    CANCELLED: { variant: 'outline', icon: XCircle },
};

const LOG_LEVEL_CONFIG: Record<LogLevel, { color: string; bgColor: string; label: string }> = {
    TRACE: { color: 'text-gray-600', bgColor: 'bg-gray-100', label: 'TRACE' },
    INFO: { color: 'text-blue-600', bgColor: 'bg-blue-50', label: 'INFO' },
    WARN: { color: 'text-yellow-600', bgColor: 'bg-yellow-50', label: 'WARN' },
    ERROR: { color: 'text-red-600', bgColor: 'bg-red-50', label: 'ERROR' },
    FATAL: { color: 'text-purple-600', bgColor: 'bg-purple-50', label: 'FATAL' },
};

function LogEntry({ log }: { log: WorkerLog }) {
    const [showDetails, setShowDetails] = useState(false);
    const config = LOG_LEVEL_CONFIG[log.level];

    return (
        <div className={`p-3 rounded-lg border ${config.bgColor}`}>
            <div className="flex items-start gap-2 mb-1">
                <Badge variant="outline" className={`${config.color} shrink-0 text-xs`}>
                    {config.label}
                </Badge>
                <span className="text-xs text-muted-foreground">
                    {format(new Date(log.createdAt), 'HH:mm:ss.SSS')}
                </span>
            </div>

            <p className="text-sm mb-2">{log.message}</p>

            {log.gameServer && (
                <p className="text-xs text-muted-foreground mb-1">
                    Server: {log.gameServer.name} ({log.gameServer.id})
                </p>
            )}

            {log.user && (
                <p className="text-xs text-muted-foreground mb-1">
                    User: {log.user.name} ({log.user.email})
                </p>
            )}

            {log.details && (
                <div className="mt-2">
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setShowDetails(!showDetails)}
                        className="h-6 text-xs"
                    >
                        {showDetails ? 'Hide' : 'Show'} Details
                    </Button>
                    {showDetails && (
                        <pre className="mt-2 p-2 bg-background rounded text-xs overflow-x-auto">
                            {JSON.stringify(log.details, null, 2)}
                        </pre>
                    )}
                </div>
            )}
        </div>
    );
}

export function JobRunDetailsModal({ runId, isOpen, onClose }: JobRunDetailsModalProps) {
    const { data, error, isLoading } = useJobRunDetails(runId, isOpen);

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="max-w-4xl max-h-[90vh]">
                <DialogHeader>
                    <DialogTitle>Job Run Details</DialogTitle>
                    <DialogDescription>
                        {runId ? `Run ID: ${runId}` : 'No run selected'}
                    </DialogDescription>
                </DialogHeader>

                {isLoading && (
                    <div className="flex items-center justify-center py-12">
                        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                    </div>
                )}

                {error && (
                    <div className="flex items-center gap-2 text-destructive p-4">
                        <AlertCircle className="h-5 w-5" />
                        <span>{error}</span>
                    </div>
                )}

                {data && (
                    <div className="space-y-4">
                        {/* Summary Section */}
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 bg-accent/50 rounded-lg">
                            <div>
                                <p className="text-xs text-muted-foreground mb-1">Status</p>
                                <Badge variant={STATUS_CONFIG[data.status].variant}>
                                    {data.status}
                                </Badge>
                            </div>
                            <div>
                                <p className="text-xs text-muted-foreground mb-1">Job Type</p>
                                <p className="text-sm font-medium">{data.jobType}</p>
                            </div>
                            <div>
                                <p className="text-xs text-muted-foreground mb-1">Progress</p>
                                <p className="text-sm font-medium">
                                    {data.itemsProcessed}/{data.itemsTotal}
                                </p>
                            </div>
                            <div>
                                <p className="text-xs text-muted-foreground mb-1">Failed</p>
                                <p className="text-sm font-medium text-destructive">
                                    {data.itemsFailed}
                                </p>
                            </div>
                        </div>

                        {/* Timing Information */}
                        <div className="grid grid-cols-2 gap-4 text-sm">
                            <div>
                                <p className="text-muted-foreground mb-1">Started</p>
                                <p className="font-medium">
                                    {format(new Date(data.startedAt), 'PPpp')}
                                </p>
                                <p className="text-xs text-muted-foreground">
                                    {formatDistanceToNow(new Date(data.startedAt), {
                                        addSuffix: true,
                                    })}
                                </p>
                            </div>
                            {data.endedAt && (
                                <div>
                                    <p className="text-muted-foreground mb-1">Ended</p>
                                    <p className="font-medium">
                                        {format(new Date(data.endedAt), 'PPpp')}
                                    </p>
                                    <p className="text-xs text-muted-foreground">
                                        Duration:{' '}
                                        {Math.round(
                                            (new Date(data.endedAt).getTime() -
                                                new Date(data.startedAt).getTime()) /
                                                1000,
                                        )}
                                        s
                                    </p>
                                </div>
                            )}
                        </div>

                        {/* Error Message */}
                        {data.errorMessage && (
                            <div className="p-3 bg-destructive/10 border border-destructive/50 rounded-lg">
                                <p className="text-sm font-medium text-destructive mb-1">
                                    Error Message
                                </p>
                                <p className="text-sm">{data.errorMessage}</p>
                                {data.errorStack && (
                                    <details className="mt-2">
                                        <summary className="text-xs cursor-pointer text-muted-foreground">
                                            Show stack trace
                                        </summary>
                                        <pre className="mt-2 p-2 bg-background rounded text-xs overflow-x-auto">
                                            {data.errorStack}
                                        </pre>
                                    </details>
                                )}
                            </div>
                        )}

                        {/* Metadata */}
                        {data.metadata && (
                            <details>
                                <summary className="text-sm font-medium cursor-pointer mb-2">
                                    Metadata
                                </summary>
                                <pre className="p-3 bg-accent rounded text-xs overflow-x-auto">
                                    {JSON.stringify(data.metadata, null, 2)}
                                </pre>
                            </details>
                        )}

                        {/* Logs Section */}
                        <div>
                            <div className="flex items-center justify-between mb-3">
                                <h3 className="text-sm font-medium">Logs ({data.logs.length})</h3>
                                {data.status === 'RUNNING' && (
                                    <Badge variant="outline" className="text-xs">
                                        <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                                        Auto-refreshing
                                    </Badge>
                                )}
                            </div>

                            <ScrollArea className="h-100 rounded-lg border p-3">
                                <div className="space-y-2">
                                    {data.logs.length > 0 ? (
                                        data.logs.map((log) => <LogEntry key={log.id} log={log} />)
                                    ) : (
                                        <p className="text-center text-muted-foreground py-8">
                                            No logs available
                                        </p>
                                    )}
                                </div>
                            </ScrollArea>
                        </div>
                    </div>
                )}
            </DialogContent>
        </Dialog>
    );
}

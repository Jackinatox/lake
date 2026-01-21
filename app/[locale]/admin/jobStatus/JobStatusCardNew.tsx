'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { AlertCircle, CheckCircle2, Clock, Play, Loader2, XCircle } from 'lucide-react';
import { useTriggerJob } from '@/hooks/useJobsApi';
import { useToast } from '@/hooks/use-toast';
import { formatDistanceToNow } from 'date-fns';
import type { JobRunSummary } from '@/types/jobs';
import { useState } from 'react';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from '@/components/ui/alert-dialog';

interface JobStatusCardNewProps {
    jobName: string;
    isRunning: boolean;
    lastRun?: JobRunSummary | null;
    onTriggerSuccess?: () => void;
}

// Map frontend job names to backend job names
const JOB_NAME_MAP: Record<string, string> = {
    'ExpireServers': 'ExpireServers',
    'DeleteServers': 'DeleteServers',
    'SendEmails': 'SendEmails',
    'GenerateExpiryEmails': 'GenerateExpiryEmails',
    'GenerateDeletionEmails': 'GenerateDeletionEmails',
};

export function JobStatusCardNew({ jobName, isRunning, lastRun, onTriggerSuccess }: JobStatusCardNewProps) {
    const { triggerJob, isTriggering } = useTriggerJob();
    const { toast } = useToast();
    const [showConfirmDialog, setShowConfirmDialog] = useState(false);

    const hasError = lastRun?.status === 'FAILED';
    const hasWarning = lastRun && lastRun.itemsFailed > 0 && lastRun.status === 'COMPLETED';

    const handleTrigger = async () => {
        const backendJobName = JOB_NAME_MAP[jobName] || jobName;
        const result = await triggerJob(backendJobName);

        if (result?.success) {
            toast({
                title: 'Job triggered successfully',
                description: `Processed: ${result.result?.processed}/${result.result?.total}, Failed: ${result.result?.failed}`,
                variant: 'default',
            });
            onTriggerSuccess?.();
        } else {
            toast({
                title: 'Failed to trigger job',
                description: result?.error || 'Unknown error',
                variant: 'destructive',
            });
        }
        setShowConfirmDialog(false);
    };

    return (
        <>
            <Card className={hasError ? 'border-destructive/50' : ''}>
                <CardHeader className="pb-3">
                    <div className="flex items-start justify-between gap-2">
                        <CardTitle className="text-lg font-medium">{jobName}</CardTitle>
                        <Badge
                            variant={isRunning ? 'default' : 'secondary'}
                            className="shrink-0"
                        >
                            {isRunning ? (
                                <>
                                    <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                                    Running
                                </>
                            ) : (
                                'Idle'
                            )}
                        </Badge>
                    </div>
                </CardHeader>
                <CardContent className="space-y-3">
                    {/* Last Run Info */}
                    {lastRun ? (
                        <div className="space-y-2 pb-3 border-b border-border">
                            <div className="flex items-center justify-between text-sm">
                                <span className="text-muted-foreground flex items-center gap-1.5">
                                    {lastRun.status === 'COMPLETED' ? (
                                        <CheckCircle2 className="h-4 w-4 text-green-600" />
                                    ) : lastRun.status === 'FAILED' ? (
                                        <XCircle className="h-4 w-4 text-destructive" />
                                    ) : (
                                        <Clock className="h-4 w-4" />
                                    )}
                                    Last run
                                </span>
                                <Badge
                                    variant={lastRun.status === 'FAILED' ? 'destructive' : hasWarning ? 'outline' : 'secondary'}
                                    className="text-xs"
                                >
                                    {lastRun.status}
                                </Badge>
                            </div>
                            
                            <div className="text-xs text-muted-foreground">
                                {formatDistanceToNow(new Date(lastRun.startedAt), { addSuffix: true })}
                            </div>

                            <div className="flex items-center justify-between text-xs">
                                <span className="text-muted-foreground">Progress:</span>
                                <span className="font-medium">
                                    {lastRun.itemsProcessed}/{lastRun.itemsTotal}
                                    {lastRun.itemsFailed > 0 && (
                                        <span className="text-destructive ml-1">
                                            ({lastRun.itemsFailed} failed)
                                        </span>
                                    )}
                                </span>
                            </div>

                            {lastRun.errorMessage && (
                                <div className="pt-2">
                                    <div className="flex items-start gap-1.5 text-xs text-destructive">
                                        <AlertCircle className="h-3 w-3 mt-0.5 shrink-0" />
                                        <span className="line-clamp-2">{lastRun.errorMessage}</span>
                                    </div>
                                </div>
                            )}
                        </div>
                    ) : (
                        <div className="pb-3 border-b border-border">
                            <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                <Clock className="h-3 w-3" />
                                <span>No recent run data available</span>
                            </div>
                        </div>
                    )}

                    <Button
                        onClick={() => setShowConfirmDialog(true)}
                        disabled={isRunning || isTriggering}
                        className="w-full"
                        variant={hasError ? 'default' : 'outline'}
                        size="sm"
                    >
                        {isTriggering ? (
                            <>
                                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                Triggering...
                            </>
                        ) : (
                            <>
                                <Play className="h-4 w-4 mr-2" />
                                {hasError ? 'Retry Job' : 'Trigger Job'}
                            </>
                        )}
                    </Button>
                </CardContent>
            </Card>

            <AlertDialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Trigger Job: {jobName}</AlertDialogTitle>
                        <AlertDialogDescription>
                            Are you sure you want to manually trigger this job? This will run the job immediately.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={handleTrigger}>
                            Trigger Job
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </>
    );
}

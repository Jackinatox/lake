import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { AlertCircle, CheckCircle2, Clock } from 'lucide-react';

interface JobStatus {
    name: string;
    running: boolean;
    lastRun?: string;
    lastError?: string;
    runCount: number;
}

interface JobStatusCardProps {
    jobName: string;
    job: JobStatus;
}

export function JobStatusCard({ jobName, job }: JobStatusCardProps) {
    const hasError = !!job.lastError;

    const formatLastRun = (isoString?: string) => {
        if (!isoString) return 'Never';
        const date = new Date(isoString);
        return date.toLocaleString('de-DE', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
        });
    };

    return (
        <Card className={hasError ? 'border-destructive/50' : ''}>
            <CardHeader className="pb-3">
                <div className="flex items-start justify-between gap-2">
                    <CardTitle className="text-lg font-medium">{jobName}</CardTitle>
                    <Badge
                        variant={job.running ? 'default' : hasError ? 'destructive' : 'secondary'}
                        className="shrink-0"
                    >
                        {job.running ? 'Running' : hasError ? 'Error' : 'Idle'}
                    </Badge>
                </div>
            </CardHeader>
            <CardContent className="space-y-3">
                <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground flex items-center gap-1.5">
                        <CheckCircle2 className="h-4 w-4" />
                        Run count
                    </span>
                    <span className="font-medium text-foreground">{job.runCount}</span>
                </div>

                <div className="flex items-center justify-between text-sm pt-2 border-t border-border">
                    <span className="text-muted-foreground flex items-center gap-1.5">
                        <Clock className="h-4 w-4" />
                        Last run
                    </span>
                    <span className="text-foreground">{formatLastRun(job.lastRun)}</span>
                </div>

                {hasError && (
                    <div className="pt-2 border-t border-border">
                        <div className="flex items-start gap-1.5 text-sm text-destructive">
                            <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
                            <span className="break-all">{job.lastError}</span>
                        </div>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}

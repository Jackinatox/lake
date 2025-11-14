import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { JobStatus } from '@/worker/workerTypes';

interface JobStatusCardProps {
    jobName: string;
    job: JobStatus;
}

export function JobStatusCard({ jobName, job }: JobStatusCardProps) {
    const progressPercentage = job.total > 0 ? Math.round((job.processed / job.total) * 100) : 0;

    return (
        <Card>
            <CardHeader className="pb-3">
                <div className="flex items-start justify-between gap-2">
                    <CardTitle className="text-lg font-medium">{jobName}</CardTitle>
                    <Badge variant={job.running ? 'default' : 'secondary'} className="shrink-0">
                        {job.running ? 'Running' : 'Idle'}
                    </Badge>
                </div>
            </CardHeader>
            <CardContent className="space-y-4">
                <div>
                    <div className="flex items-center justify-between text-sm mb-2">
                        <span className="text-muted-foreground">Progress</span>
                        <span className="font-medium text-foreground">
                            {job.processed} / {job.total}
                        </span>
                    </div>
                    <Progress value={progressPercentage} className="h-2" />
                    <p className="text-xs text-muted-foreground mt-1">
                        {progressPercentage}% complete
                    </p>
                </div>

                {job.lastRun && (
                    <div className="flex items-center justify-between text-sm pt-2 border-t border-border">
                        <span className="text-muted-foreground">Last run</span>
                        <span className="text-foreground">{job.lastRun}</span>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}

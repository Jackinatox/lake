'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/hooks/use-toast';
import type { JobStatusResponse } from '@/app/api/provisioning/[jobId]/route';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import { CheckCircle2, Clock, Loader2, XCircle } from 'lucide-react';

interface ProvisioningStatusProps {
    jobId: string;
}

export default function ProvisioningStatus({ jobId }: ProvisioningStatusProps) {
    const [status, setStatus] = useState<JobStatusResponse | null>(null);
    const [error, setError] = useState<{ message: string; code?: number } | null>(null);
    const { toast } = useToast();
    const router = useRouter();
    const t = useTranslations('provisioning');

    useEffect(() => {
        let intervalId: NodeJS.Timeout;

        const fetchStatus = async () => {
            try {
                const response = await fetch(`/api/provisioning/${jobId}`);
                const data: JobStatusResponse = await response.json();

                if (!data.success) {
                    setError({
                        message: data.error || t('errorFetchingStatus'),
                        code: response.status,
                    });
                    if (response.status === 404) {
                        clearInterval(intervalId);
                    }
                    return;
                }

                setStatus(data);

                // If completed, redirect to the gameserver page
                //TODO: Redirect to an error page when completed but no ptServerId
                if (data.state === 'completed' && data.data?.ptAdminId) {
                    clearInterval(intervalId);
                    router.push(`/gameserver/${data.data!.ptServerId}?start=true`);
                }

                // If failed, show error
                if (data.state === 'failed') {
                    clearInterval(intervalId);
                    setError({
                        message: data.error || t('provisioningFailed'),
                        code: response.status,
                    });
                    toast({
                        title: t('error'),
                        description: data.error || t('provisioningFailed'),
                        variant: 'destructive',
                    });
                }
            } catch (err) {
                console.error('Error fetching job status:', err);
                setError({ message: t('errorFetchingStatus') });
            }
        };

        // Initial fetch
        fetchStatus();

        // Poll every 2 seconds
        intervalId = setInterval(fetchStatus, 2000);

        return () => {
            if (intervalId) {
                clearInterval(intervalId);
            }
        };
    }, [jobId, router, toast, t]);

    const getStateIcon = () => {
        if (!status) return <Loader2 className="w-8 h-8 animate-spin text-primary" />;

        switch (status.state) {
            case 'queued':
                return <Clock className="w-8 h-8 text-yellow-500" />;
            case 'active':
                return <Loader2 className="w-8 h-8 animate-spin text-blue-500" />;
            case 'completed':
                return <CheckCircle2 className="w-8 h-8 text-green-500" />;
            case 'failed':
                return <XCircle className="w-8 h-8 text-red-500" />;
            default:
                return <Loader2 className="w-8 h-8 animate-spin text-primary" />;
        }
    };

    const getStateText = () => {
        if (!status) return t('loading');

        switch (status.state) {
            case 'queued':
                return t('stateQueued');
            case 'active':
                return t('stateActive');
            case 'completed':
                return t('stateCompleted');
            case 'failed':
                return t('stateFailed');
            default:
                return t('loading');
        }
    };
    const progress = status?.progress ?? 0;

    if (error?.code === 404) {
        // Not found
        return (
            <Card className="w-full max-w-2xl mx-auto">
                <CardHeader>
                    <div className="flex items-center gap-4">
                        <XCircle className="w-8 h-8 text-red-500" />
                        <div>
                            <CardTitle>{t('notFoundTitle')}</CardTitle>
                            <CardDescription>{t('notFoundDescription')}</CardDescription>
                        </div>
                    </div>
                </CardHeader>
                <CardContent>
                    <Button onClick={() => router.push('/profile')} className="w-full">
                        {t('backToProfile')}
                    </Button>
                </CardContent>
            </Card>
        );
    }

    if (error) {
        return (
            <Card className="w-full max-w-2xl mx-auto">
                <CardHeader>
                    <div className="flex items-center gap-4">
                        <XCircle className="w-8 h-8 text-red-500" />
                        <div>
                            <CardTitle>{t('error')}</CardTitle>
                            <CardDescription>{error.message}</CardDescription>
                        </div>
                    </div>
                </CardHeader>
                <CardContent>
                    <Button onClick={() => router.push('/profile')} className="w-full">
                        {t('backToProfile')}
                    </Button>
                </CardContent>
            </Card>
        );
    }

    return (
        <Card className="w-full max-w-2xl mx-auto">
            <CardHeader>
                <div className="flex items-center gap-4">
                    {getStateIcon()}
                    <div>
                        <CardTitle>{t('title')}</CardTitle>
                        <CardDescription>{getStateText()}</CardDescription>
                    </div>
                </div>
            </CardHeader>
            <CardContent className="space-y-6">
                {/* Progress Bar */}
                <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">{t('progress')}</span>
                        <span className="font-medium">{progress}%</span>
                    </div>
                    <Progress value={progress} className="h-3" />
                </div>

                {/* Status Details */}
                {status && (
                    <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                            <span className="text-muted-foreground">{t('jobId')}:</span>
                            <span className="font-mono">{status.jobId}</span>
                        </div>
                    </div>
                )}

                {/* Additional Info */}
                <div className="text-sm text-muted-foreground text-center pt-4">
                    {status?.state === 'completed' ? t('redirecting') : t('pleaseWait')}
                </div>
            </CardContent>
        </Card>
    );
}

'use client';

import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { CheckCircle2, RefreshCw, XCircle } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useState } from 'react';

interface FixPortsDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onConfirm: () => Promise<boolean>;
    onRestart: () => void;
}

type Status = 'idle' | 'loading' | 'success' | 'error';

export default function FixPortsDialog({
    open,
    onOpenChange,
    onConfirm,
    onRestart,
}: FixPortsDialogProps) {
    const t = useTranslations('gameserver.networkManager');
    const [status, setStatus] = useState<Status>('idle');

    const handleConfirm = async () => {
        setStatus('loading');
        const ok = await onConfirm();
        setStatus(ok ? 'success' : 'error');
    };

    const handleRestart = () => {
        onRestart();
        handleOpenChange(false);
    };

    const handleOpenChange = (next: boolean) => {
        if (!next) setStatus('idle');
        onOpenChange(next);
    };

    return (
        <Dialog open={open} onOpenChange={handleOpenChange}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>{t('fixPortsDialogTitle')}</DialogTitle>
                    {status === 'idle' && (
                        <DialogDescription>{t('fixPortsDialogDescription')}</DialogDescription>
                    )}
                </DialogHeader>

                {status === 'idle' && (
                    <p className="text-sm text-muted-foreground">{t('fixPortsDialogDetail')}</p>
                )}

                {status === 'success' && (
                    <div className="flex items-center gap-2 text-green-600">
                        <CheckCircle2 className="h-5 w-5 shrink-0" />
                        <p className="text-sm font-medium">{t('fixPortsSuccess')}</p>
                    </div>
                )}

                {status === 'error' && (
                    <div className="flex items-center gap-2 text-destructive">
                        <XCircle className="h-5 w-5 shrink-0" />
                        <p className="text-sm font-medium">{t('fixPortsFailed')}</p>
                    </div>
                )}

                <DialogFooter>
                    {status === 'idle' && (
                        <>
                            <Button variant="outline" onClick={() => handleOpenChange(false)}>
                                {t('cancel')}
                            </Button>
                            <Button onClick={handleConfirm}>{t('fixPortsConfirm')}</Button>
                        </>
                    )}

                    {status === 'loading' && (
                        <Button disabled>
                            <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                            {t('fixingPorts')}
                        </Button>
                    )}

                    {status === 'success' && (
                        <>
                            <Button variant="outline" onClick={() => handleOpenChange(false)}>
                                {t('cancel')}
                            </Button>
                            <Button onClick={handleRestart}>{t('fixPortsRestartNow')}</Button>
                        </>
                    )}

                    {status === 'error' && (
                        <>
                            <Button variant="outline" onClick={() => handleOpenChange(false)}>
                                {t('cancel')}
                            </Button>
                            <Button variant="destructive" onClick={handleConfirm}>
                                {t('fixPortsRetry')}
                            </Button>
                        </>
                    )}
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}

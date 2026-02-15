'use client';

import React, { useState } from 'react';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogFooter,
    DialogTitle,
    DialogDescription,
    DialogClose,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { AlertCircle } from 'lucide-react';
import { useTranslations } from 'next-intl';
import type { Allocation } from './types';

interface DeleteAllocationDialogProps {
    allocation: Allocation | null;
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onConfirm: () => Promise<boolean>;
}

export default function DeleteAllocationDialog({
    allocation,
    open,
    onOpenChange,
    onConfirm,
}: DeleteAllocationDialogProps) {
    const t = useTranslations('gameserver.networkManager');
    const [deleting, setDeleting] = useState(false);

    const handleConfirm = async () => {
        setDeleting(true);
        const success = await onConfirm();
        setDeleting(false);
        if (success) {
            onOpenChange(false);
        }
    };

    const displayAddress = allocation
        ? allocation.ip_alias
            ? `${allocation.ip_alias}:${allocation.port}`
            : `${allocation.ip}:${allocation.port}`
        : '';

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <AlertCircle className="h-5 w-5 text-destructive" />
                        {t('deleteDialogTitle')}
                    </DialogTitle>
                    <DialogDescription>
                        {t('deleteDialogDescription', { address: displayAddress })}
                    </DialogDescription>
                </DialogHeader>

                <div className="py-2">
                    <p className="text-sm text-muted-foreground">{t('deleteDialogWarning')}</p>
                </div>

                <DialogFooter>
                    <DialogClose asChild>
                        <Button variant="outline" disabled={deleting}>
                            {t('cancel')}
                        </Button>
                    </DialogClose>
                    <Button variant="destructive" onClick={handleConfirm} disabled={deleting}>
                        {deleting ? t('deleting') : t('deleteConfirm')}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}

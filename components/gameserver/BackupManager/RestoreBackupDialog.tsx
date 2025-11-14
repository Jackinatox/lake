'use client';

import { useState, type ReactNode } from 'react';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Loader2 } from 'lucide-react';

import type { Backup } from './types';
import { formatBytes, formatDateTime, deriveStatusLabel } from './utils';
import { notifyRestoreStarted } from '../serverEvents';
import { GameServer } from '@/models/gameServerModel';

interface RestoreBackupDialogProps {
    server: GameServer;
    backup: Backup;
    trigger: ReactNode;
    onConfirm: (options: { truncate: boolean }) => Promise<boolean>;
}

export function RestoreBackupDialog({
    backup,
    trigger,
    onConfirm,
    server,
}: RestoreBackupDialogProps) {
    const [open, setOpen] = useState(false);
    const [truncate, setTruncate] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleOpenChange = (nextOpen: boolean) => {
        setOpen(nextOpen);
        if (!nextOpen) {
            setTruncate(true);
            setIsSubmitting(false);
        }
    };

    const handleConfirm = async (event: React.MouseEvent<HTMLButtonElement>) => {
        event.preventDefault();
        if (isSubmitting) return;
        setIsSubmitting(true);
        notifyRestoreStarted(server.identifier);
        const ok = await onConfirm({ truncate });
        if (ok) {
            handleOpenChange(false);
        } else {
            setIsSubmitting(false);
        }
    };

    const statusLabel = deriveStatusLabel(backup.status);

    const formatSize = (bytes: number) => {
        if (bytes === undefined || bytes === null) return 'Unknown';
        if (bytes === 0) return '0 B';
        const units = ['B', 'KB', 'MB', 'GB', 'TB'];
        let size = bytes;
        let unitIndex = 0;
        while (size >= 1024 && unitIndex < units.length - 1) {
            size /= 1024;
            unitIndex += 1;
        }
        return `${size.toFixed(size >= 10 || unitIndex === 0 ? 0 : 1)} ${units[unitIndex]}`;
    };

    return (
        <AlertDialog open={open} onOpenChange={handleOpenChange}>
            <AlertDialogTrigger asChild>{trigger}</AlertDialogTrigger>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>Restore this backup?</AlertDialogTitle>
                    <AlertDialogDescription>
                        Restoring <span className="font-medium">{backup.name}</span> will replace
                        all current server files with the backup contents. The server stops
                        automatically during the restore process.
                    </AlertDialogDescription>
                </AlertDialogHeader>

                <div className="rounded-md border p-3 text-sm">
                    <p className="mb-2 font-medium">Backup details</p>
                    <ul className="list-disc space-y-1 pl-4 text-muted-foreground">
                        <li>Created at {formatDateTime(backup.createdAt)}</li>
                        <li>Status: {statusLabel}</li>
                        <li>Size: {formatBytes(backup.bytes)}</li>
                    </ul>
                </div>

                <div className="flex items-center justify-between rounded-md border p-3">
                    <Label htmlFor="truncate-switch" className="flex flex-col gap-1 text-sm">
                        <span>Delete existing files first</span>
                        <span className="text-xs text-muted-foreground">
                            Keeps the backup clean by removing leftover files. Recommended for most
                            restores.
                        </span>
                    </Label>
                    <Switch id="truncate-switch" checked={truncate} onCheckedChange={setTruncate} />
                </div>

                <AlertDialogFooter>
                    <AlertDialogCancel disabled={isSubmitting}>Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={handleConfirm} disabled={isSubmitting}>
                        {isSubmitting ? (
                            <span className="flex items-center gap-2">
                                <Loader2 className="h-4 w-4 animate-spin" /> Restoring
                            </span>
                        ) : (
                            'Restore'
                        )}
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    );
}

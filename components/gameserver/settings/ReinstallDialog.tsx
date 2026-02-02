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
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { RefreshCw } from 'lucide-react';
import { useTranslations } from 'next-intl';
import ReinstallPTServerClient from '@/lib/Pterodactyl/Functions/ReinstallPTUserServer';
import { notifyReinstallStarted } from '../serverEvents';

interface ReinstallDialogProps {
    apiKey: string;
    server_id: string;
}

const ReinstallDialog = ({ apiKey, server_id }: ReinstallDialogProps) => {
    const t = useTranslations('gameserverSettings');
    const [open, setOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [deleteAllFiles, setDeleteAllFiles] = useState(false);

    const handleOpenChange = (nextOpen: boolean) => {
        setOpen(nextOpen);
        if (!nextOpen) {
            setDeleteAllFiles(false);
        }
    };

    const handleReinstall = async () => {
        setIsLoading(true);
        notifyReinstallStarted(server_id);
        const response = await ReinstallPTServerClient(server_id, apiKey, deleteAllFiles);

        if (!response.ok) {
            console.error('Failed to reinstall server:', response.statusText);
        }

        setIsLoading(false);
        setOpen(false);
        setDeleteAllFiles(false);
    };

    return (
        <>
            <Button variant="destructive" onClick={() => setOpen(true)} className="w-full">
                <RefreshCw className="h-4 w-4 mr-2" />
                {t('management.reinstall.button' as any)}
            </Button>
            <Dialog open={open} onOpenChange={handleOpenChange}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>{t('management.reinstall.confirmTitle' as any)}</DialogTitle>
                        <DialogDescription>
                            {t('management.reinstall.confirmDescription' as any)}
                        </DialogDescription>
                    </DialogHeader>
                    <div className="flex items-center gap-2 pt-4">
                        <Checkbox
                            id="delete-all-files"
                            checked={deleteAllFiles}
                            onCheckedChange={(checked) => setDeleteAllFiles(checked === true)}
                            disabled={isLoading}
                        />
                        <Label htmlFor="delete-all-files" className="text-sm font-normal">
                            {t('management.reinstall.deleteFilesLabel' as any)}
                        </Label>
                    </div>
                    <DialogFooter>
                        <DialogClose asChild>
                            <Button variant="outline" disabled={isLoading}>
                                {t('deleteFreeServer.cancel' as any)}
                            </Button>
                        </DialogClose>
                        <Button
                            variant="destructive"
                            onClick={handleReinstall}
                            disabled={isLoading}
                        >
                            {isLoading
                                ? t('management.reinstall.reinstalling' as any)
                                : t('management.reinstall.button' as any)}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    );
};

export default ReinstallDialog;

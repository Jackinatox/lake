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
import { notifyReinstallStarted } from '../serverEvents';
import { reinstallServer } from './serverSettingsActions';

interface ReinstallDialogProps {
    server_id: string;
}

const ReinstallDialog = ({ server_id }: ReinstallDialogProps) => {
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
        try {
            const success = await reinstallServer(server_id, deleteAllFiles);
            if (success) {
                notifyReinstallStarted(server_id);
            } else {
                console.error('Failed to reinstall server:', server_id);
            }
        } catch (error) {
            console.error('Failed to reinstall server:', error);
        }
        setOpen(false);
        setDeleteAllFiles(false);
        setIsLoading(false);
    };

    return (
        <>
            <Button variant="destructive" onClick={() => setOpen(true)} className="w-full">
                <RefreshCw className="h-4 w-4 mr-2" />
                {t('management.reinstall.button')}
            </Button>
            <Dialog open={open} onOpenChange={handleOpenChange}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>{t('management.reinstall.confirmTitle')}</DialogTitle>
                        <DialogDescription>
                            {t('management.reinstall.confirmDescription')}
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
                            {t('management.reinstall.deleteFilesLabel')}
                        </Label>
                    </div>
                    <DialogFooter>
                        <DialogClose asChild>
                            <Button variant="outline" disabled={isLoading}>
                                {t('deleteFreeServer.cancel')}
                            </Button>
                        </DialogClose>
                        <Button
                            variant="destructive"
                            onClick={handleReinstall}
                            disabled={isLoading}
                        >
                            {isLoading
                                ? t('management.reinstall.reinstalling')
                                : t('management.reinstall.button')}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    );
};

export default ReinstallDialog;

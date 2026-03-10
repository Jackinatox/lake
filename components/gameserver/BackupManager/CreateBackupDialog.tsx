'use client';

import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';

interface CreateBackupDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onCreate: (payload: {
        name?: string;
        ignoredPatterns: string[];
        isLocked: boolean;
    }) => Promise<boolean>;
    isSubmitting: boolean;
    disabled?: boolean;
}

const ignoredPlaceholder = ['*.log', 'cache/*', 'temp/*'].join('\n');

export function CreateBackupDialog({
    open,
    onOpenChange,
    onCreate,
    isSubmitting,
    disabled,
}: CreateBackupDialogProps) {
    const [name, setName] = useState('');
    const [ignored, setIgnored] = useState('');
    const [isLocked, setIsLocked] = useState(false);
    const t = useTranslations('backupManager.createDialog');

    useEffect(() => {
        if (!open) {
            setName('');
            setIgnored('');
            setIsLocked(false);
        }
    }, [open]);

    const handleSubmit = async () => {
        if (disabled) return false;
        const wasCreated = await onCreate({
            name: name.trim() || undefined,
            ignoredPatterns: ignored
                .split('\n')
                .map((line) => line.trim())
                .filter(Boolean),
            isLocked,
        });

        if (wasCreated) {
            onOpenChange(false);
        }

        return wasCreated;
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-lg">
                <DialogHeader>
                    <DialogTitle>{t('title')}</DialogTitle>
                    <DialogDescription>
                        {t('description')}
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-4 py-2">
                    <div className="space-y-2">
                        <Label htmlFor="backup-name">{t('nameLabel')}</Label>
                        <Input
                            id="backup-name"
                            placeholder={t('namePlaceholder')}
                            value={name}
                            onChange={(event) => setName(event.target.value)}
                            autoFocus
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="backup-ignored">{t('ignoredLabel')}</Label>
                        <Textarea
                            id="backup-ignored"
                            placeholder={ignoredPlaceholder}
                            value={ignored}
                            onChange={(event) => setIgnored(event.target.value)}
                            rows={4}
                        />
                        <p className="text-xs text-muted-foreground">
                            {t('ignoredHint')}
                        </p>
                    </div>

                    <div className="flex items-center justify-between rounded-md border p-3">
                        <div>
                            <Label htmlFor="backup-lock" className="flex flex-col">
                                <span>{t('lockLabel')}</span>
                                <span className="text-xs text-muted-foreground">
                                    {t('lockDescription')}
                                </span>
                            </Label>
                        </div>
                        <Switch id="backup-lock" checked={isLocked} onCheckedChange={setIsLocked} />
                    </div>
                </div>

                <DialogFooter>
                    <Button
                        type="button"
                        variant="outline"
                        onClick={() => onOpenChange(false)}
                        disabled={isSubmitting}
                    >
                        {t('cancel')}
                    </Button>
                    <Button
                        type="button"
                        onClick={handleSubmit}
                        disabled={isSubmitting || disabled}
                    >
                        {isSubmitting ? t('creating') : t('create')}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}

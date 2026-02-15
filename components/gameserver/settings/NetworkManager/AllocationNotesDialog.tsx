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
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { useTranslations } from 'next-intl';
import type { Allocation } from './types';

interface AllocationNotesDialogProps {
    allocation: Allocation | null;
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onSave: (allocationId: number, notes: string) => Promise<boolean>;
}

export default function AllocationNotesDialog({
    allocation,
    open,
    onOpenChange,
    onSave,
}: AllocationNotesDialogProps) {
    const t = useTranslations('gameserver.networkManager');
    const [notes, setNotes] = useState('');
    const [saving, setSaving] = useState(false);

    // Sync notes when dialog opens with a new allocation
    React.useEffect(() => {
        if (allocation && open) {
            setNotes(allocation.notes ?? '');
        }
    }, [allocation, open]);

    const handleSave = async () => {
        if (!allocation) return;
        setSaving(true);
        const success = await onSave(allocation.id, notes);
        setSaving(false);
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
                    <DialogTitle>{t('notesDialogTitle')}</DialogTitle>
                    <DialogDescription>
                        {t('notesDialogDescription', { address: displayAddress })}
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-2 py-2">
                    <Label htmlFor="allocation-notes">{t('notes')}</Label>
                    <Textarea
                        id="allocation-notes"
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                        placeholder={t('notesPlaceholder')}
                        maxLength={255}
                        rows={3}
                        className="resize-none"
                    />
                    <p className="text-xs text-muted-foreground text-right">
                        {notes.length}/255
                    </p>
                </div>

                <DialogFooter>
                    <DialogClose asChild>
                        <Button variant="outline" disabled={saving}>
                            {t('cancel')}
                        </Button>
                    </DialogClose>
                    <Button onClick={handleSave} disabled={saving}>
                        {saving ? t('saving') : t('save')}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}

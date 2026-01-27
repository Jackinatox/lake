'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
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
import { Bone, LucideSkull, Skull, SkullIcon, Trash, TriangleAlert } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { deleteFreeServer } from './serverSettingsActions';

interface DeleteFreeServerModalProps {
    ptServerId: string;
}

export default function DeleteFreeServerModal({ ptServerId }: DeleteFreeServerModalProps) {
    const [open, setOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [confirmed, setConfirmed] = useState(false);
    const t = useTranslations('gameserverSettings.deleteFreeServer');
    const { toast } = useToast();
    const router = useRouter();

    const handleOpenChange = (nextOpen: boolean) => {
        setOpen(nextOpen);
        if (!nextOpen) setConfirmed(false);
    };

    const handleDelete = async () => {
        setIsLoading(true);
        try {
            const result = await deleteFreeServer(ptServerId);
            if (result) {
                toast({ title: t('success.title'), description: t('success.description') });
                router.push('/gameserver');
            } else {
                toast({
                    title: t('error.title'),
                    description: t('error.description'),
                    variant: 'destructive',
                });
            }
        } catch (err) {
            toast({
                title: t('error.title'),
                description: t('error.description'),
                variant: 'destructive',
            });
        }

        setIsLoading(false);
        setOpen(false);
    };

    return (
        <>
            <Button
                variant="destructive"
                onClick={() => setOpen(true)}
                className="w-full"
            >
                <Bone className="h-4 w-4 text-red-700 mr-2" />
                {t('button')}
                <TriangleAlert className="ml-2 h-4 w-4 text-red-700" />
            </Button>

            <Dialog open={open} onOpenChange={handleOpenChange}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>{t('title')}</DialogTitle>
                        <DialogDescription>{t('description')}</DialogDescription>
                    </DialogHeader>

                    <div className="flex items-center gap-2 pt-4">
                        <Checkbox
                            id="confirm-delete"
                            checked={confirmed}
                            onCheckedChange={(c) => setConfirmed(c === true)}
                            disabled={isLoading}
                        />
                        <Label htmlFor="confirm-delete" className="text-sm font-normal">
                            {t('checkbox')}
                        </Label>
                    </div>

                    <DialogFooter>
                        <DialogClose asChild>
                            <Button variant="outline" disabled={isLoading}>
                                {t('cancel')}
                            </Button>
                        </DialogClose>
                        <Button
                            variant="destructive"
                            onClick={handleDelete}
                            disabled={!confirmed || isLoading}
                        >
                            {isLoading ? t('deleting') : t('delete')}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    );
}

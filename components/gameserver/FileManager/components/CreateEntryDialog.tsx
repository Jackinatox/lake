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
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { FormEvent, memo } from 'react';
import { useTranslations } from 'next-intl';
import type { CreateEntryType } from '../types';

interface CreateEntryDialogProps {
    open: boolean;
    directory: string;
    entryType: CreateEntryType;
    name: string;
    isCreating: boolean;
    onOpenChange: (open: boolean) => void;
    onNameChange: (value: string) => void;
    onCreate: () => void;
}

function formatDirectory(directory: string) {
    return directory || '/';
}

const CreateEntryDialogComponent = ({
    open,
    directory,
    entryType,
    name,
    isCreating,
    onOpenChange,
    onNameChange,
    onCreate,
}: CreateEntryDialogProps) => {
    const t = useTranslations('gameserver.fileManager.create');

    const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        onCreate();
    };

    const isFile = entryType === 'file';

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-md">
                <form className="space-y-4" onSubmit={handleSubmit}>
                    <DialogHeader>
                        <DialogTitle>
                            {isFile ? t('dialogTitleFile') : t('dialogTitleFolder')}
                        </DialogTitle>
                        <DialogDescription>
                            {isFile
                                ? t('dialogDescriptionFile', {
                                      directory: formatDirectory(directory),
                                  })
                                : t('dialogDescriptionFolder', {
                                      directory: formatDirectory(directory),
                                  })}
                        </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-2">
                        <Label htmlFor="create-entry-name">{t('nameLabel')}</Label>
                        <Input
                            id="create-entry-name"
                            value={name}
                            onChange={(event) => onNameChange(event.target.value)}
                            placeholder={
                                isFile ? t('inputPlaceholderFile') : t('inputPlaceholderFolder')
                            }
                            autoFocus
                            disabled={isCreating}
                        />
                    </div>

                    <DialogFooter>
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => onOpenChange(false)}
                            disabled={isCreating}
                        >
                            {t('cancelButton')}
                        </Button>
                        <Button type="submit" disabled={isCreating}>
                            {isCreating
                                ? isFile
                                    ? t('creatingButtonFile')
                                    : t('creatingButtonFolder')
                                : isFile
                                  ? t('createButtonFile')
                                  : t('createButtonFolder')}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
};

export const CreateEntryDialog = memo(CreateEntryDialogComponent);

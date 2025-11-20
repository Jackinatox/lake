'use client';

import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { useTranslations } from 'next-intl';

interface DeleteFilesCheckboxProps {
    deleteFiles: boolean;
    setDeleteFiles: (v: boolean) => void;
    isFlavorChange: boolean;
}

export default function DeleteFilesCheckbox({
    deleteFiles,
    setDeleteFiles,
    isFlavorChange,
}: DeleteFilesCheckboxProps) {
    const t = useTranslations('changeGame');

    return (
        <div className="flex items-center space-x-2 rounded-lg border border-border/60 bg-muted/30 p-3">
            <Checkbox
                id="delete-files"
                checked={deleteFiles}
                onCheckedChange={(checked) => setDeleteFiles(checked === true)}
            />
            <Label
                htmlFor="delete-files"
                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
            >
                {isFlavorChange ? t('flavorChangeCheckbox') : t('gameChangeCheckbox')}
            </Label>
        </div>
    );
}

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
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Loader2 } from 'lucide-react';
import { memo } from 'react';
import { useTranslations } from 'next-intl';

interface FileEditorDialogProps {
    open: boolean;
    fileName: string | null;
    filePath: string | null;
    isBinary: boolean;
    loading: boolean;
    saving: boolean;
    content: string;
    onClose: () => void;
    onChange: (value: string) => void;
    onSave: () => void;
}

const FileEditorDialogComponent = ({
    open,
    fileName,
    filePath,
    isBinary,
    loading,
    saving,
    content,
    onClose,
    onChange,
    onSave,
}: FileEditorDialogProps) => {
    const t = useTranslations('gameserver.fileManager.editor');
    const title = fileName ?? t('dialogTitle');

    return (
        <Dialog open={open} onOpenChange={(value) => !value && onClose()}>
            <DialogContent className="max-h-[85vh] w-full max-w-3xl overflow-hidden p-0 sm:p-0">
                <DialogHeader className="space-y-2 border-b px-6 py-4">
                    <div className="flex items-center justify-between gap-3">
                        <DialogTitle className="truncate text-lg font-semibold">
                            {title}
                        </DialogTitle>
                        {filePath && (
                            <Badge variant="outline" className="font-mono text-xs">
                                {filePath}
                            </Badge>
                        )}
                    </div>
                    <DialogDescription>
                        {isBinary
                            ? t('dialogDescriptionBinary')
                            : t('dialogDescriptionEditable')}
                    </DialogDescription>
                </DialogHeader>
                <div className="flex flex-col gap-4 px-6 py-5">
                    {loading ? (
                        <div className="flex h-70 items-center justify-center text-muted-foreground">
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            {t('loadingText')}
                        </div>
                    ) : isBinary ? (
                        <div className="space-y-4 text-sm text-muted-foreground">
                            <p>
                                {t('binaryFileWarning')}
                            </p>
                            <p>{t('binaryFileDownload')}</p>
                        </div>
                    ) : (
                        <Textarea
                            value={content}
                            onChange={(event) => onChange(event.target.value)}
                            className="min-h-80 font-mono text-sm"
                            spellCheck={false}
                        />
                    )}
                </div>
                <DialogFooter className="border-t bg-muted/30 px-6 py-4">
                    <div className="flex w-full flex-col-reverse gap-2 sm:flex-row sm:justify-between sm:gap-4">
                        <Button variant="ghost" onClick={onClose} disabled={saving}>
                            {t('cancelButton')}
                        </Button>
                        <Button onClick={onSave} disabled={saving || loading || isBinary}>
                            {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            {t('saveButton')}
                        </Button>
                    </div>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};

export const FileEditorDialog = memo(FileEditorDialogComponent);

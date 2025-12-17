'use client';

import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { UploadCloud } from 'lucide-react';
import { formatFileSize } from '@/lib/Pterodactyl/file-utils';
import { ChangeEvent, ReactNode, memo, useEffect, useMemo, useState } from 'react';
import { useTranslations } from 'next-intl';

interface FileUploadDialogProps {
    children?: ReactNode;
    open: boolean;
    directory: string;
    progress: number;
    isUploading: boolean;
    files: FileList | null;
    onOpenChange: (open: boolean) => void;
    onFileSelect: (files: FileList | null) => void;
    onUpload: () => void;
}

function formatDirectory(directory: string) {
    return directory || '/';
}

const MAX_FILES = 200;

function limitFileList(files: FileList, limit: number): FileList {
    const transfer = new DataTransfer();
    for (const file of Array.from(files).slice(0, limit)) {
        transfer.items.add(file);
    }
    return transfer.files;
}

function getTotalBytes(files: FileList | null): number {
    if (!files || files.length === 0) return 0;
    return Array.from(files).reduce((sum, file) => sum + (file.size ?? 0), 0);
}

const FileUploadDialogComponent = ({
    children,
    open,
    directory,
    progress,
    isUploading,
    files,
    onOpenChange,
    onFileSelect,
    onUpload,
}: FileUploadDialogProps) => {
    const t = useTranslations('gameserver.fileManager.upload');
    const [omittedCount, setOmittedCount] = useState(0);
    const progressLabel = useMemo(() => {
        if (!isUploading) return null;
        return `${progress}%`;
    }, [isUploading, progress]);

    const totalBytes = useMemo(() => getTotalBytes(files), [files]);

    useEffect(() => {
        if (!open) setOmittedCount(0);
    }, [open]);

    const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
        const selected = event.target.files;
        if (!selected || selected.length === 0) {
            setOmittedCount(0);
            onFileSelect(null);
            return;
        }

        if (selected.length > MAX_FILES) {
            setOmittedCount(selected.length - MAX_FILES);
            onFileSelect(limitFileList(selected, MAX_FILES));
        } else {
            setOmittedCount(0);
            onFileSelect(selected);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            {children && <DialogTrigger asChild>{children}</DialogTrigger>}
            <DialogContent className="max-h-[85vh] overflow-hidden">
                <DialogHeader>
                    <DialogTitle>{t('dialogTitle')}</DialogTitle>
                    <DialogDescription>
                        {t('dialogDescription', { directory: formatDirectory(directory) })}
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-4 overflow-hidden">
                    <div className="rounded-lg border border-dashed p-6 text-center">
                        <UploadCloud className="mx-auto h-10 w-10 text-muted-foreground" />
                        <p className="mt-4 text-sm text-muted-foreground">{t('selectFilesText')}</p>
                        <div className="mt-4 flex justify-center">
                            <Label
                                htmlFor="file-upload-input"
                                className="cursor-pointer rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground shadow-sm hover:bg-primary/90"
                            >
                                {t('chooseFilesButton')}
                            </Label>
                            <Input
                                id="file-upload-input"
                                type="file"
                                multiple
                                className="sr-only"
                                onChange={handleFileChange}
                                disabled={isUploading}
                            />
                        </div>
                    </div>

                    {files && files.length > 0 && (
                        <div className="rounded-md border bg-muted/40 p-3 text-sm overflow-hidden">
                            <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                                <p className="font-medium">
                                    {t('selectedFilesLabel')}{' '}
                                    <span className="text-muted-foreground">
                                        ({files.length}/{MAX_FILES})
                                    </span>
                                </p>
                                <p className="text-xs text-muted-foreground">
                                    Total: {formatFileSize(totalBytes)}
                                </p>
                            </div>

                            {omittedCount > 0 && (
                                <p className="mt-2 text-xs text-destructive">
                                    Only the first {MAX_FILES} files were selected. {omittedCount}{' '}
                                    file(s) were ignored.
                                </p>
                            )}

                            <div className="mt-2 max-h-56 overflow-y-auto rounded-md bg-background/60 p-2">
                                <ul className="space-y-1 text-xs">
                                    {Array.from(files).map((file) => (
                                        <li
                                            key={`${file.name}-${file.size}-${file.lastModified}`}
                                            className="flex items-center gap-2"
                                        >
                                            <span className="min-w-0 flex-1 truncate font-mono">
                                                {file.name}
                                            </span>
                                            <span className="shrink-0 tabular-nums text-muted-foreground">
                                                {formatFileSize(file.size)}
                                            </span>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        </div>
                    )}

                    {isUploading && (
                        <div className="space-y-2">
                            <Progress value={progress} />
                            <p className="text-sm text-muted-foreground">{progressLabel}</p>
                        </div>
                    )}
                </div>

                <DialogFooter className="gap-2">
                    <Button
                        type="button"
                        variant="outline"
                        onClick={() => onOpenChange(false)}
                        disabled={isUploading}
                    >
                        {t('cancelButton')}
                    </Button>
                    <Button
                        type="button"
                        onClick={onUpload}
                        disabled={isUploading || !files || files.length === 0}
                    >
                        {t('uploadButton')}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};

export const FileUploadDialog = memo(FileUploadDialogComponent);

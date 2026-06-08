'use client';

import { ReactNode, DragEvent, memo, useRef, useState } from 'react';
import { FolderX, UploadCloud } from 'lucide-react';
import { useTranslations } from 'next-intl';

import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

interface FileDropZoneProps {
    disabled?: boolean;
    children: ReactNode;
    onFilesDrop: (files: FileList) => void;
    onFolderDrop: () => void;
}

type FileSystemEntryLike = {
    isDirectory?: boolean;
};

type DataTransferItemWithEntry = DataTransferItem & {
    webkitGetAsEntry?: () => FileSystemEntryLike | null;
};

function hasFileItems(dataTransfer: DataTransfer) {
    const items = Array.from(dataTransfer.items ?? []);
    if (items.some((item) => item.kind === 'file')) {
        return true;
    }

    return dataTransfer.types.includes('Files');
}

function hasDirectoryItem(dataTransfer: DataTransfer) {
    return Array.from(dataTransfer.items ?? []).some((item) => {
        if (item.kind !== 'file') return false;

        const entry = (item as DataTransferItemWithEntry).webkitGetAsEntry?.();
        return Boolean(entry?.isDirectory);
    });
}

function hasDirectoryFileSignal(files: FileList) {
    return Array.from(files).some((file) =>
        (file as File & { webkitRelativePath?: string }).webkitRelativePath?.includes('/'),
    );
}

const FileDropZoneComponent = ({
    disabled,
    children,
    onFilesDrop,
    onFolderDrop,
}: FileDropZoneProps) => {
    const t = useTranslations('gameserver.fileManager.dropZone');
    const dragDepthRef = useRef(0);
    const [isDraggingFiles, setIsDraggingFiles] = useState(false);
    const [isRejectingFolder, setIsRejectingFolder] = useState(false);

    const resetDragState = () => {
        dragDepthRef.current = 0;
        setIsDraggingFiles(false);
        setIsRejectingFolder(false);
    };

    const updateDragState = (event: DragEvent<HTMLDivElement>) => {
        const rejectingFolder = hasDirectoryItem(event.dataTransfer);
        setIsDraggingFiles(true);
        setIsRejectingFolder(rejectingFolder);
        event.dataTransfer.dropEffect = rejectingFolder ? 'none' : 'copy';
    };

    const handleDragEnter = (event: DragEvent<HTMLDivElement>) => {
        if (disabled || !hasFileItems(event.dataTransfer)) return;

        event.preventDefault();
        dragDepthRef.current += 1;
        updateDragState(event);
    };

    const handleDragOver = (event: DragEvent<HTMLDivElement>) => {
        if (disabled || !hasFileItems(event.dataTransfer)) return;

        event.preventDefault();
        updateDragState(event);
    };

    const handleDragLeave = (event: DragEvent<HTMLDivElement>) => {
        if (disabled || !isDraggingFiles) return;

        event.preventDefault();
        dragDepthRef.current = Math.max(0, dragDepthRef.current - 1);
        if (dragDepthRef.current === 0) {
            resetDragState();
        }
    };

    const handleDrop = (event: DragEvent<HTMLDivElement>) => {
        if (disabled || !hasFileItems(event.dataTransfer)) return;

        event.preventDefault();
        const droppedFiles = event.dataTransfer.files;
        const droppedFolder =
            hasDirectoryItem(event.dataTransfer) || hasDirectoryFileSignal(droppedFiles);
        resetDragState();

        if (droppedFolder) {
            onFolderDrop();
            return;
        }

        if (droppedFiles.length > 0) {
            onFilesDrop(droppedFiles);
        }
    };

    return (
        <div
            className="relative space-y-3"
            onDragEnter={handleDragEnter}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
        >
            <div
                className={cn(
                    'flex flex-col gap-3 rounded-md border border-dashed bg-muted/30 px-3 py-3 text-sm sm:flex-row sm:items-center sm:justify-between',
                    disabled && 'opacity-60',
                    isDraggingFiles &&
                        !isRejectingFolder &&
                        'border-primary bg-primary/10 text-primary',
                    isRejectingFolder && 'border-destructive bg-destructive/10 text-destructive',
                )}
            >
                <div className="flex min-w-0 items-start gap-3">
                    {isRejectingFolder ? (
                        <FolderX className="mt-0.5 h-5 w-5 shrink-0" />
                    ) : (
                        <UploadCloud className="mt-0.5 h-5 w-5 shrink-0" />
                    )}
                    <div className="min-w-0">
                        <p className="font-medium">
                            {isRejectingFolder ? t('rejectTitle') : t('title')}
                        </p>
                        <p className="text-xs text-muted-foreground">
                            {isRejectingFolder ? t('rejectDescription') : t('description')}
                        </p>
                    </div>
                </div>
                <Badge
                    variant="outline"
                    className={cn(
                        'w-fit shrink-0 bg-background/80',
                        isRejectingFolder && 'border-destructive text-destructive',
                    )}
                >
                    {t('filesOnlyBadge')}
                </Badge>
            </div>

            <div className="relative">
                {children}
                {isDraggingFiles && (
                    <div
                        className={cn(
                            'pointer-events-none absolute inset-0 z-10 flex items-center justify-center rounded-md border-2 border-dashed bg-background/85 p-4 text-center backdrop-blur-sm',
                            isRejectingFolder
                                ? 'border-destructive text-destructive'
                                : 'border-primary text-primary',
                        )}
                    >
                        <div className="max-w-sm">
                            {isRejectingFolder ? (
                                <FolderX className="mx-auto h-8 w-8" />
                            ) : (
                                <UploadCloud className="mx-auto h-8 w-8" />
                            )}
                            <p className="mt-3 text-sm font-semibold">
                                {isRejectingFolder ? t('overlayRejectTitle') : t('overlayTitle')}
                            </p>
                            <p className="mt-1 text-xs text-muted-foreground">
                                {isRejectingFolder
                                    ? t('overlayRejectDescription')
                                    : t('overlayDescription')}
                            </p>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export const FileDropZone = memo(FileDropZoneComponent);

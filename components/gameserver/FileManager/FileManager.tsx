'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Input } from '@/components/ui/input';
import { FileWarning, FolderTree } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

import { DirectoryBreadcrumb } from './components/DirectoryBreadcrumb';
import { FileManagerToolbar } from './components/FileManagerToolbar';
import { DirectoryTable } from './components/DirectoryTable';
import { FileEditorDialog } from './components/FileEditorDialog';
import { FileUploadDialog } from './components/FileUploadDialog';
import type { FileEntry, SortColumn, SortDirection } from './types';
import {
    getDownloadUrl,
    listDirectory,
    readFile,
    deleteEntry,
    renameEntry,
    uploadFiles,
    writeFile,
} from './pteroFileApi';
import { GameServer } from '@/models/gameServerModel';
import { FtpAccessDetails } from './components/FtpAccessDetails';
import { FtpPasswordDialog } from './components/FtpPasswordDialog';
import { authClient } from '@/lib/auth-client';
import { MAX_EDITABLE_FILE_SIZE, MAX_EDITABLE_FILE_SIZE_LABEL } from '@/app/GlobalConstants';

interface FileManagerProps {
    apiKey: string;
    server: GameServer;
}

type UploadState = {
    open: boolean;
    files: FileList | null;
    uploading: boolean;
    progress: number;
};

type FileEditorState = {
    isOpen: boolean;
    path: string | null;
    fileName: string | null;
    content: string;
    loading: boolean;
    saving: boolean;
    isBinary: boolean;
};

const initialEditorState: FileEditorState = {
    isOpen: false,
    path: null,
    fileName: null,
    content: '',
    loading: false,
    saving: false,
    isBinary: false,
};

const initialUploadState: UploadState = {
    open: false,
    files: null,
    uploading: false,
    progress: 0,
};

const textLikeMimePrefixes = [
    'text/',
    'application/json',
    'application/xml',
    'application/yaml',
    'application/x-yaml',
    'application/javascript',
    'application/x-sh',
];

const textLikeExtensions = [
    '.txt',
    '.log',
    '.conf',
    '.config',
    '.cfg',
    '.ini',
    '.properties',
    '.json',
    '.xml',
    '.yaml',
    '.yml',
    '.toml',
    '.js',
    '.ts',
    '.jsx',
    '.tsx',
    '.css',
    '.scss',
    '.sass',
    '.html',
    '.htm',
    '.md',
    '.markdown',
    '.sh',
    '.bash',
    '.bat',
    '.cmd',
    '.py',
    '.java',
    '.cpp',
    '.c',
    '.h',
    '.hpp',
    '.php',
    '.rb',
    '.go',
    '.rs',
    '.swift',
    '.sql',
    '.env',
];

function isTextLikeFile(entry: FileEntry) {
    if (!entry.isFile) return false;
    if (textLikeMimePrefixes.some((prefix) => entry.mimetype?.startsWith(prefix))) {
        return true;
    }

    const lastDot = entry.name.lastIndexOf('.');
    if (lastDot === -1) return false;
    const extension = entry.name.slice(lastDot).toLowerCase();
    return textLikeExtensions.includes(extension);
}

function buildChildPath(parent: string, name: string, isDirectory: boolean) {
    if (!parent || parent === '/') {
        return `/${name}${isDirectory ? '/' : ''}`;
    }
    return `${parent}${name}${isDirectory ? '/' : ''}`;
}

function getParentPath(path: string) {
    if (!path || path === '/') return '/';
    const segments = path.split('/').filter(Boolean);
    segments.pop();
    return segments.length ? `/${segments.join('/')}/` : '/';
}

function normalizeDirectoryPath(path: string) {
    if (!path) return '/';
    if (path === '/') return '/';
    return path.endsWith('/') ? path : `${path}/`;
}

const parseTimestamp = (value: string | undefined) => {
    if (!value) return 0;
    const timestamp = Date.parse(value);
    return Number.isNaN(timestamp) ? 0 : timestamp;
};

const sorters: Record<SortColumn, (a: FileEntry, b: FileEntry) => number> = {
    name: (a, b) => a.name.localeCompare(b.name, undefined, { sensitivity: 'base' }),
    size: (a, b) => (a.size ?? 0) - (b.size ?? 0),
    modifiedAt: (a, b) => parseTimestamp(a.modifiedAt) - parseTimestamp(b.modifiedAt),
    createdAt: (a, b) => parseTimestamp(a.createdAt) - parseTimestamp(b.createdAt),
};

const FileManager = ({ server, apiKey }: FileManagerProps) => {
    const { toast } = useToast();
    const [currentPath, setCurrentPath] = useState<string>('/');
    const [entries, setEntries] = useState<FileEntry[]>([]);
    const [loading, setLoading] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);
    const [sortColumn, setSortColumn] = useState<SortColumn>('name');
    const [sortDirection, setSortDirection] = useState<SortDirection>('asc');
    const [filter, setFilter] = useState<string>('');
    const [editorState, setEditorState] = useState<FileEditorState>(initialEditorState);
    const [uploadState, setUploadState] = useState<UploadState>(initialUploadState);
    const [isFtpDetailsOpen, setIsFtpDetailsOpen] = useState<boolean>(false);
    const [passwordDialogOpen, setPasswordDialogOpen] = useState(false);
    const [renameTarget, setRenameTarget] = useState<FileEntry | null>(null);
    const [renameValue, setRenameValue] = useState('');
    const [renaming, setRenaming] = useState<boolean>(false);
    const [deleteTarget, setDeleteTarget] = useState<FileEntry | null>(null);
    const [deleting, setDeleting] = useState<boolean>(false);
    const [openMenuKey, setOpenMenuKey] = useState<string | null>(null);
    const { data: session } = authClient.useSession();

    const canInteract = Boolean(server && apiKey);

    const fetchDirectory = useCallback(
        async (path: string) => {
            if (!canInteract) return;

            const normalized = normalizeDirectoryPath(path);
            setLoading(true);
            setError(null);
            try {
                const response = await listDirectory(server.identifier, normalized, apiKey);
                setEntries(response.data ?? []);
                setCurrentPath(normalized);
                setOpenMenuKey(null);
            } catch (err) {
                console.error('Failed to load directory', err);
                const message = err instanceof Error ? err.message : 'Failed to load directory';
                setError(message);
                toast({
                    title: 'Unable to list files',
                    description: message,
                    variant: 'destructive',
                });
            } finally {
                setLoading(false);
            }
        },
        [apiKey, canInteract, server, toast],
    );

    useEffect(() => {
        void fetchDirectory('/');
    }, [fetchDirectory]);

    const sortedEntries = useMemo(() => {
        const filtered = filter
            ? entries.filter((entry) => entry.name.toLowerCase().includes(filter.toLowerCase()))
            : entries;

        const sorted = [...filtered].sort((a, b) => {
            if (a.isFile !== b.isFile) {
                return a.isFile ? 1 : -1;
            }
            const comparator = sorters[sortColumn] ?? sorters.name;
            const directionFactor = sortDirection === 'asc' ? 1 : -1;
            return comparator(a, b) * directionFactor;
        });

        return sorted;
    }, [entries, filter, sortColumn, sortDirection]);

    const handleSort = (column: SortColumn) => {
        setSortColumn((prevColumn) => {
            if (prevColumn === column) {
                setSortDirection((prevDirection) => (prevDirection === 'asc' ? 'desc' : 'asc'));
                return prevColumn;
            }
            setSortDirection('asc');
            return column;
        });
    };

    const handleNavigateTo = (path: string) => {
        if (!canInteract) return;
        void fetchDirectory(path);
    };

    const handleNavigateUp = () => {
        if (!canInteract) return;
        const parent = getParentPath(currentPath);
        void fetchDirectory(parent);
    };

    const openFile = async (entry: FileEntry) => {
        const filePath = buildChildPath(currentPath, entry.name, false);

        setEditorState({
            ...initialEditorState,
            isOpen: true,
            path: filePath,
            fileName: entry.name,
            loading: true,
            isBinary: false,
        });

        try {
            const content = await readFile(server.identifier, filePath, apiKey);
            setEditorState((state) => ({
                ...state,
                content,
                loading: false,
            }));
        } catch (err) {
            const message = err instanceof Error ? err.message : 'Failed to load file';
            toast({
                title: 'Unable to open file',
                description: message,
                variant: 'destructive',
            });
            setEditorState(initialEditorState);
        }
    };

    const handleEntryOpen = (entry: FileEntry) => {
        if (!canInteract) return;
        if (entry.isFile) {
            const entryKey = `${currentPath}${entry.name}`;
            if (!isTextLikeFile(entry)) {
                setOpenMenuKey(entryKey);
                return;
            }
            if ((entry.size ?? 0) > MAX_EDITABLE_FILE_SIZE) {
                toast({
                    title: 'File too large to edit',
                    description: `Only files up to ${MAX_EDITABLE_FILE_SIZE_LABEL} can be opened in the browser. Download the file to edit it locally.`,
                });
                return;
            }
            setOpenMenuKey(null);
            void openFile(entry);
        } else {
            setOpenMenuKey(null);
            const directoryPath = buildChildPath(currentPath, entry.name, true);
            void fetchDirectory(directoryPath);
        }
    };

    const handleEditorClose = () => {
        setEditorState(initialEditorState);
    };

    const handleSaveFile = async () => {
        if (!editorState.path) return;

        setEditorState((state) => ({ ...state, saving: true }));

        try {
            await writeFile(server.identifier, editorState.path, editorState.content, apiKey);
            toast({
                title: 'File saved',
                description: `${editorState.fileName} was updated successfully.`,
            });
            await fetchDirectory(currentPath);
        } catch (err) {
            const message = err instanceof Error ? err.message : 'Failed to save file';
            toast({
                title: 'Unable to save file',
                description: message,
                variant: 'destructive',
            });
        } finally {
            setEditorState((state) => ({ ...state, saving: false }));
        }
    };

    const handleDownload = async (entry: FileEntry) => {
        if (!canInteract) return;
        if (!entry.isFile) return;

        const filePath = buildChildPath(currentPath, entry.name, false);
        setOpenMenuKey(null);

        try {
            const url = await getDownloadUrl(server.identifier, filePath, apiKey);
            window.open(url, '_blank', 'noopener,noreferrer');
        } catch (err) {
            const message = err instanceof Error ? err.message : 'Failed to start download';
            toast({
                title: 'Unable to download',
                description: message,
                variant: 'destructive',
            });
        }
    };

    const handleRenameRequest = (entry: FileEntry) => {
        if (!canInteract) return;
        setRenameTarget(entry);
        setRenameValue(entry.name);
        setOpenMenuKey(null);
    };

    const handleRenameConfirm = async () => {
        if (!canInteract || !renameTarget) return;
        const trimmed = renameValue.trim();
        if (!trimmed) {
            toast({
                title: 'Name is required',
                description: 'Please enter a new name before saving.',
                variant: 'destructive',
            });
            return;
        }

        if (trimmed === renameTarget.name) {
            setRenameTarget(null);
            setRenameValue('');
            return;
        }

        setRenaming(true);
        try {
            await renameEntry(server.identifier, currentPath, renameTarget.name, trimmed, apiKey);
            toast({
                title: 'Entry renamed',
                description: `${renameTarget.name} is now ${trimmed}.`,
            });
            setRenameTarget(null);
            setRenameValue('');
            await fetchDirectory(currentPath);
        } catch (err) {
            const message = err instanceof Error ? err.message : 'Failed to rename entry';
            toast({
                title: 'Unable to rename',
                description: message,
                variant: 'destructive',
            });
        } finally {
            setRenaming(false);
        }
    };

    const handleDeleteRequest = (entry: FileEntry) => {
        if (!canInteract) return;
        setDeleteTarget(entry);
        setOpenMenuKey(null);
    };

    const handleDeleteConfirm = async () => {
        if (!canInteract || !deleteTarget) return;
        setDeleting(true);
        try {
            await deleteEntry(server.identifier, currentPath, deleteTarget.name, apiKey);
            toast({
                title: 'Entry deleted',
                description: `${deleteTarget.name} has been removed.`,
            });
            setDeleteTarget(null);
            setOpenMenuKey(null);
            if (deleteTarget.isFile && editorState.fileName === deleteTarget.name) {
                setEditorState(initialEditorState);
            }
            await fetchDirectory(currentPath);
        } catch (err) {
            const message = err instanceof Error ? err.message : 'Failed to delete entry';
            toast({
                title: 'Unable to delete',
                description: message,
                variant: 'destructive',
            });
        } finally {
            setDeleting(false);
        }
    };

    const handleRenameDialogClose = () => {
        if (renaming) return;
        setRenameTarget(null);
        setRenameValue('');
    };

    const handleDeleteDialogClose = () => {
        if (deleting) return;
        setDeleteTarget(null);
    };

    const handleUploadDialogOpen = (open: boolean) => {
        if (open) {
            setUploadState((state) => ({ ...state, open: true }));
        } else {
            setUploadState(initialUploadState);
        }
    };

    const handleFileSelect = (files: FileList | null) => {
        setUploadState((state) => ({ ...state, files }));
    };

    const handleUpload = async () => {
        if (!canInteract) return;
        if (!uploadState.files || uploadState.files.length === 0) {
            toast({
                title: 'No files selected',
                description: 'Choose one or more files before uploading.',
            });
            return;
        }

        setUploadState((state) => ({ ...state, uploading: true, progress: 0 }));

        try {
            await uploadFiles(
                server.identifier,
                currentPath,
                uploadState.files,
                apiKey,
                (progress) => {
                    setUploadState((state) => ({ ...state, progress }));
                },
            );

            toast({
                title: 'Upload complete',
                description: `${uploadState.files.length} file(s) uploaded successfully.`,
            });

            setUploadState(initialUploadState);
            await fetchDirectory(currentPath);
        } catch (err) {
            const message = err instanceof Error ? err.message : 'Upload failed';
            toast({
                title: 'Unable to upload',
                description: message,
                variant: 'destructive',
            });
            setUploadState((state) => ({ ...state, uploading: false }));
        }
    };

    const handleChangePassword = () => {
        setPasswordDialogOpen(true);
    };

    return (
        <Card className="w-full">
            <CardHeader className="space-y-3">
                <CardTitle className="flex items-center gap-3 text-xl">
                    <FolderTree className="h-5 w-5" />
                    File Manager
                </CardTitle>
                {!canInteract && (
                    <Alert variant="destructive">
                        <AlertDescription className="flex items-center gap-2 text-sm">
                            <FileWarning className="h-4 w-4" />
                            Provide a valid API key to browse and manage files.
                        </AlertDescription>
                    </Alert>
                )}
            </CardHeader>
            <CardContent className="space-y-5">
                <FtpAccessDetails
                    isOpen={isFtpDetailsOpen}
                    onOpenChange={setIsFtpDetailsOpen}
                    host={'sftp://' + server.sftp_details.ip}
                    port={server.sftp_details.port.toString()}
                    username={session?.user.ptUsername + '.' + server.identifier}
                    onChangePassword={handleChangePassword}
                />

                <FileManagerToolbar
                    onRefresh={() => fetchDirectory(currentPath)}
                    onUploadClick={() => handleUploadDialogOpen(true)}
                    onFilterChange={setFilter}
                    disabled={!canInteract || loading}
                />

                <DirectoryBreadcrumb path={currentPath} onNavigate={handleNavigateTo} />

                {error && (
                    <Alert variant="destructive">
                        <AlertDescription>{error}</AlertDescription>
                    </Alert>
                )}

                <DirectoryTable
                    entries={sortedEntries}
                    currentPath={currentPath}
                    loading={loading}
                    sortColumn={sortColumn}
                    sortDirection={sortDirection}
                    onSort={handleSort}
                    onOpen={handleEntryOpen}
                    onDownload={handleDownload}
                    onRename={handleRenameRequest}
                    onDelete={handleDeleteRequest}
                    onNavigateUp={handleNavigateUp}
                    menuOpenKey={openMenuKey}
                    onMenuOpenKeyChange={setOpenMenuKey}
                    isTextLikeFile={isTextLikeFile}
                />
            </CardContent>

            <FileEditorDialog
                open={editorState.isOpen}
                fileName={editorState.fileName}
                filePath={editorState.path}
                isBinary={editorState.isBinary}
                loading={editorState.loading}
                saving={editorState.saving}
                content={editorState.content}
                onChange={(value) => setEditorState((state) => ({ ...state, content: value }))}
                onSave={handleSaveFile}
                onClose={handleEditorClose}
            />

            <FileUploadDialog
                open={uploadState.open}
                directory={currentPath}
                progress={uploadState.progress}
                isUploading={uploadState.uploading}
                files={uploadState.files}
                onOpenChange={handleUploadDialogOpen}
                onFileSelect={handleFileSelect}
                onUpload={handleUpload}
            />

            <FtpPasswordDialog
                open={passwordDialogOpen}
                onOpenChange={setPasswordDialogOpen}
                serverIdentifier={server.identifier}
            />

            <AlertDialog
                open={Boolean(renameTarget)}
                onOpenChange={(open) => (!open ? handleRenameDialogClose() : null)}
            >
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>
                            Rename {renameTarget?.isFile ? 'file' : 'folder'}
                        </AlertDialogTitle>
                        <AlertDialogDescription>
                            Choose a new name for{' '}
                            <span className="font-semibold">{renameTarget?.name}</span>.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <Input
                        value={renameValue}
                        onChange={(event) => setRenameValue(event.target.value)}
                        placeholder="New name"
                        autoFocus
                        disabled={renaming}
                    />
                    <AlertDialogFooter>
                        <AlertDialogCancel onClick={handleRenameDialogClose} disabled={renaming}>
                            Cancel
                        </AlertDialogCancel>
                        <AlertDialogAction onClick={handleRenameConfirm} disabled={renaming}>
                            {renaming ? 'Renaming…' : 'Rename'}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            <AlertDialog
                open={Boolean(deleteTarget)}
                onOpenChange={(open) => (!open ? handleDeleteDialogClose() : null)}
            >
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>
                            Delete {deleteTarget?.isFile ? 'file' : 'folder'}
                        </AlertDialogTitle>
                        <AlertDialogDescription>
                            This action can&apos;t be undone. You&apos;re about to permanently
                            remove
                            <span className="font-semibold"> {deleteTarget?.name}</span>.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel onClick={handleDeleteDialogClose} disabled={deleting}>
                            Cancel
                        </AlertDialogCancel>
                        <AlertDialogAction
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                            onClick={handleDeleteConfirm}
                            disabled={deleting}
                        >
                            {deleting ? 'Deleting…' : 'Delete'}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </Card>
    );
};

export default FileManager;

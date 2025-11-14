'use client';

import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import type { GameServer } from '@/models/gameServerModel';
import { Loader2, Plus, RefreshCw } from 'lucide-react';
import { env } from 'next-runtime-env';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { BackupCard } from './BackupCard';
import { CreateBackupDialog } from './CreateBackupDialog';
import type { Backup, BackupStatus } from './types';
import { formatBytes } from './utils';
import PTUserServerPowerAction from '@/lib/Pterodactyl/Functions/StopPTUserServer';

interface BackupManagerProps {
    apiKey: string;
    server: GameServer;
}

const ptUrl = env('NEXT_PUBLIC_PTERODACTYL_URL');

function mapStatus(attributes: any): BackupStatus {
    if (!attributes?.completed_at) return 'creating';
    if (attributes?.is_successful === false) return 'failed';
    return 'completed';
}

function mapBackup(raw: any): Backup {
    const attributes = raw?.attributes ?? {};
    return {
        uuid: attributes.uuid,
        name: attributes.name || `Backup ${String(attributes.uuid ?? '').slice(0, 8)}`,
        ignoredFiles: Array.isArray(attributes.ignored_files) ? attributes.ignored_files : [],
        sha256Hash: attributes.sha256_hash ?? null,
        bytes: typeof attributes.bytes === 'number' ? attributes.bytes : 0,
        createdAt: attributes.created_at ?? '',
        completedAt: attributes.completed_at ?? null,
        status: mapStatus(attributes),
        isSuccessful:
            typeof attributes.is_successful === 'boolean' ? attributes.is_successful : null,
        isLocked: Boolean(attributes.is_locked),
    };
}

function BackupManager({ apiKey, server }: BackupManagerProps) {
    const { toast } = useToast();
    const [backups, setBackups] = useState<Backup[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [isCreateOpen, setIsCreateOpen] = useState(false);
    const [isCreating, setIsCreating] = useState(false);
    const [downloadingId, setDownloadingId] = useState<string | null>(null);
    const [unlockingId, setUnlockingId] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);

    const backupLimit = server.feature_limits?.backups ?? 0;

    const headers = useMemo(
        () => ({
            Authorization: `Bearer ${apiKey}`,
            Accept: 'application/vnd.pterodactyl.v1+json',
        }),
        [apiKey],
    );

    const fetchBackups = useCallback(
        async (options?: { silent?: boolean }) => {
            if (!ptUrl) {
                setError('Pterodactyl URL is not configured.');
                setIsLoading(false);
                return;
            }

            const silent = options?.silent ?? false;
            if (silent) {
                setIsRefreshing(true);
            } else {
                setIsLoading(true);
            }

            try {
                const response = await fetch(
                    `${ptUrl}/api/client/servers/${server.identifier}/backups`,
                    {
                        method: 'GET',
                        headers,
                    },
                );

                if (!response.ok) {
                    const message = await response.text();
                    throw new Error(message || 'Failed to load backups');
                }

                const payload = await response.json();
                const items: Backup[] = Array.isArray(payload?.data)
                    ? payload.data.map((entry: any) => mapBackup(entry))
                    : [];

                setBackups(items);
                setError(null);
            } catch (err) {
                const message = err instanceof Error ? err.message : 'Failed to load backups';
                setError(message);
                toast({
                    title: 'Unable to load backups',
                    description: message,
                    variant: 'destructive',
                });
            } finally {
                if (silent) {
                    setIsRefreshing(false);
                } else {
                    setIsLoading(false);
                }
            }
        },
        [headers, server.identifier, toast],
    );

    useEffect(() => {
        void fetchBackups();
    }, [fetchBackups]);

    useEffect(() => {
        const anyCreating = backups.filter((b) => b.status === 'creating').length > 0;

        if (anyCreating) {
            const interval = setInterval(() => {
                fetchBackups({ silent: true });
            }, 2000);

            return () => clearInterval(interval);
        }
    }, [backups]);

    const handleCreateBackup = useCallback(
        async (payload: { name?: string; ignoredPatterns: string[]; isLocked: boolean }) => {
            if (!ptUrl) {
                toast({
                    title: 'Missing configuration',
                    description: 'NEXT_PUBLIC_PTERODACTYL_URL is not set.',
                    variant: 'destructive',
                });
                return false;
            }

            setIsCreating(true);

            try {
                const body: Record<string, unknown> = {};
                if (payload.name) body.name = payload.name;
                if (payload.ignoredPatterns.length > 0) {
                    body.ignored = payload.ignoredPatterns.join('\n');
                }
                if (payload.isLocked) body.is_locked = true;

                const response = await fetch(
                    `${ptUrl}/api/client/servers/${server.identifier}/backups`,
                    {
                        method: 'POST',
                        headers: {
                            ...headers,
                            'Content-Type': 'application/json',
                        },
                        body: JSON.stringify(body),
                    },
                );

                if (response.status === 429) {
                    toast({
                        title: 'Rate limit exceeded',
                        description: 'You can only create 2 Backups every 10 minutes.',
                        variant: 'destructive',
                    });
                    await fetchBackups({ silent: true });
                    return false;
                }
                if (!response.ok) {
                    const message = await response.text();
                    throw new Error(message || 'Failed to create backup');
                }

                toast({
                    title: 'Backup scheduled',
                    description: 'The backup has been queued. Refresh to monitor progress.',
                });

                await fetchBackups({ silent: true });
                return true;
            } catch (err) {
                const message = err instanceof Error ? err.message : 'Failed to create backup';
                toast({
                    title: 'Backup creation failed',
                    description: message,
                    variant: 'destructive',
                });
                return false;
            } finally {
                setIsCreating(false);
            }
        },
        [fetchBackups, headers, server.identifier, toast],
    );

    const handleDownload = useCallback(
        async (backup: Backup) => {
            if (!ptUrl) {
                toast({
                    title: 'Missing configuration',
                    description: 'NEXT_PUBLIC_PTERODACTYL_URL is not set.',
                    variant: 'destructive',
                });
                return;
            }

            setDownloadingId(backup.uuid);

            try {
                const response = await fetch(
                    `${ptUrl}/api/client/servers/${server.identifier}/backups/${backup.uuid}/download`,
                    {
                        method: 'GET',
                        headers,
                    },
                );

                if (!response.ok) {
                    const message = await response.text();
                    throw new Error(message || 'Failed to generate download URL');
                }

                const payload = await response.json();
                const url = payload?.attributes?.url;
                if (!url) {
                    throw new Error('Download URL missing from response');
                }

                window.open(url, '_blank', 'noopener');
            } catch (err) {
                const message = err instanceof Error ? err.message : 'Failed to download backup';
                toast({
                    title: 'Download failed',
                    description: message,
                    variant: 'destructive',
                });
            } finally {
                setDownloadingId(null);
            }
        },
        [headers, server.identifier, toast],
    );

    const handleRestore = useCallback(
        async (backup: Backup, options: { truncate: boolean }) => {
            if (!ptUrl) {
                toast({
                    title: 'Missing configuration',
                    description: 'NEXT_PUBLIC_PTERODACTYL_URL is not set.',
                    variant: 'destructive',
                });
                return false;
            }

            try {
                await PTUserServerPowerAction(server.identifier, apiKey, 'kill');
                await new Promise((resolve) => setTimeout(resolve, 200));
            } catch (error) {
                console.log(error);
            }

            try {
                const response = await fetch(
                    `${ptUrl}/api/client/servers/${server.identifier}/backups/${backup.uuid}/restore`,
                    {
                        method: 'POST',
                        headers: {
                            ...headers,
                            'Content-Type': 'application/json',
                        },
                        body: JSON.stringify({ truncate: options.truncate }),
                    },
                );

                if (!response.ok) {
                    const message = await response.text();
                    throw new Error(message || 'Failed to start restore');
                }

                toast({
                    title: 'Restore started',
                    description: 'The server will revert to the selected backup shortly.',
                });

                // await fetchBackups({ silent: true })
                return true;
            } catch (err) {
                const message = err instanceof Error ? err.message : 'Failed to restore backup';
                toast({
                    title: 'Restore failed',
                    description: message,
                    variant: 'destructive',
                });
                return false;
            }
        },
        [fetchBackups, headers, server.identifier, toast],
    );

    const handleDelete = useCallback(
        async (backup: Backup) => {
            if (!ptUrl) {
                toast({
                    title: 'Missing configuration',
                    description: 'NEXT_PUBLIC_PTERODACTYL_URL is not set.',
                    variant: 'destructive',
                });
                return false;
            }

            try {
                const response = await fetch(
                    `${ptUrl}/api/client/servers/${server.identifier}/backups/${backup.uuid}`,
                    {
                        method: 'DELETE',
                        headers,
                    },
                );

                if (!response.ok) {
                    const message = await response.text();
                    throw new Error(message || 'Failed to delete backup');
                }

                toast({
                    title: 'Backup deleted',
                    description: 'The backup was deleted successfully.',
                });

                await fetchBackups({ silent: true });
                return true;
            } catch (err) {
                const message = err instanceof Error ? err.message : 'Failed to delete backup';
                toast({
                    title: 'Deletion failed',
                    description: message,
                    variant: 'destructive',
                });
                return false;
            }
        },
        [fetchBackups, headers, server.identifier, toast],
    );

    const handleUnlock = useCallback(
        async (backup: Backup) => {
            if (!ptUrl) {
                toast({
                    title: 'Missing configuration',
                    description: 'NEXT_PUBLIC_PTERODACTYL_URL is not set.',
                    variant: 'destructive',
                });
                return false;
            }

            setUnlockingId(backup.uuid);

            try {
                const response = await fetch(
                    `${ptUrl}/api/client/servers/${server.identifier}/backups/${backup.uuid}/lock`,
                    {
                        method: 'POST',
                        headers,
                    },
                );

                if (!response.ok) {
                    const message = await response.text();
                    throw new Error(message || 'Failed to unlock backup');
                }

                toast({
                    title: 'Backup unlocked',
                    description: 'The backup can now be deleted or modified.',
                });

                await fetchBackups({ silent: true });
                return true;
            } catch (err) {
                const message = err instanceof Error ? err.message : 'Failed to unlock backup';
                toast({
                    title: 'Unlock failed',
                    description: message,
                    variant: 'destructive',
                });
                return false;
            } finally {
                setUnlockingId(null);
            }
        },
        [fetchBackups, headers, server.identifier, toast],
    );

    const totalSize = useMemo(
        () => backups.reduce((sum, backup) => sum + (backup.bytes ?? 0), 0),
        [backups],
    );
    const limitReached = backupLimit > 0 && backups.length >= backupLimit;

    return (
        <Card className="space-y-6 sm:p-6 p-2">
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div>
                    <h2 className="text-xl font-semibold">Backups</h2>
                    <p className="text-sm text-muted-foreground">
                        Create, download, and restore snapshots of your server.
                    </p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => fetchBackups({ silent: true })}
                        disabled={isLoading || isRefreshing}
                    >
                        {isRefreshing ? (
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        ) : (
                            <RefreshCw className="mr-2 h-4 w-4" />
                        )}
                        Refresh
                    </Button>
                    <Button
                        size="sm"
                        onClick={() => setIsCreateOpen(true)}
                        disabled={limitReached || isCreating}
                    >
                        {isCreating ? (
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        ) : (
                            <Plus className="mr-2 h-4 w-4" />
                        )}
                        New backup
                    </Button>
                </div>
            </div>

            {backupLimit > 0 ? (
                <p className="text-sm text-muted-foreground">
                    Using {backups.length}/{backupLimit} backup slots · Total size{' '}
                    {formatBytes(totalSize)}
                </p>
            ) : (
                <p className="text-sm text-muted-foreground">
                    Unlimited backup slots · Total size {formatBytes(totalSize)}
                </p>
            )}

            {limitReached ? (
                <Alert>
                    <AlertTitle>Backup limit reached</AlertTitle>
                    <AlertDescription>
                        Delete an existing backup to free up space before creating a new one.
                    </AlertDescription>
                </Alert>
            ) : null}

            {!ptUrl ? (
                <Alert variant="destructive">
                    <AlertTitle>Configuration required</AlertTitle>
                    <AlertDescription>
                        Please set NEXT_PUBLIC_PTERODACTYL_URL to enable backup management.
                    </AlertDescription>
                </Alert>
            ) : null}

            {error && backups.length === 0 ? (
                <Alert variant="destructive">
                    <AlertTitle>Unable to load backups</AlertTitle>
                    <AlertDescription>{error}</AlertDescription>
                </Alert>
            ) : null}

            {isLoading ? (
                <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                    {Array.from({ length: 3 }).map((_, index) => (
                        <div
                            key={index}
                            className="h-52 rounded-lg border bg-muted/40 animate-pulse"
                        />
                    ))}
                </div>
            ) : backups.length === 0 ? (
                <div className="rounded-lg border border-dashed p-10 text-center text-sm text-muted-foreground">
                    No backups yet. Create your first snapshot to protect the server state.
                </div>
            ) : (
                <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                    {backups.map((backup) => (
                        <BackupCard
                            key={backup.uuid}
                            backup={backup}
                            server={server}
                            onDownload={handleDownload}
                            onRestore={handleRestore}
                            onDelete={handleDelete}
                            onUnlock={handleUnlock}
                            disabled={isRefreshing || isCreating}
                            isDownloading={downloadingId === backup.uuid}
                            isUnlocking={unlockingId === backup.uuid}
                        />
                    ))}
                </div>
            )}

            <CreateBackupDialog
                open={isCreateOpen}
                onOpenChange={setIsCreateOpen}
                onCreate={handleCreateBackup}
                isSubmitting={isCreating}
                disabled={limitReached}
            />
        </Card>
    );
}

export default BackupManager;

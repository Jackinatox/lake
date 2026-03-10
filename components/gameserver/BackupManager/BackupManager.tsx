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
import { useTranslations } from 'next-intl';

interface BackupManagerProps {
    apiKey: string;
    server: GameServer;
}

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
    const ptUrl = env('NEXT_PUBLIC_PTERODACTYL_URL');
    const { toast } = useToast();
    const t = useTranslations('backupManager');
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
                setError(t('toasts.notConfigured'));
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
                    throw new Error(message || t('toasts.failedToLoad'));
                }

                const payload = await response.json();
                const items: Backup[] = Array.isArray(payload?.data)
                    ? payload.data.map((entry: any) => mapBackup(entry))
                    : [];

                setBackups(items);
                setError(null);
            } catch (err) {
                const message = err instanceof Error ? err.message : t('toasts.failedToLoad');
                setError(message);
                toast({
                    title: t('unableToLoad'),
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
                    title: t('toasts.missingConfig'),
                    description: t('toasts.missingConfigDescription'),
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
                        title: t('toasts.rateLimitTitle'),
                        description: t('toasts.rateLimitDescription'),
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
                    title: t('toasts.backupScheduled'),
                    description: t('toasts.backupScheduledDescription'),
                });

                await fetchBackups({ silent: true });
                return true;
            } catch (err) {
                const message = err instanceof Error ? err.message : t('toasts.creationFailed');
                toast({
                    title: t('toasts.creationFailed'),
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
                    title: t('toasts.missingConfig'),
                    description: t('toasts.missingConfigDescription'),
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
                    throw new Error(message || t('toasts.failedToGenerateUrl'));
                }

                const payload = await response.json();
                const url = payload?.attributes?.url;
                if (!url) {
                    throw new Error(t('toasts.downloadUrlMissing'));
                }

                window.open(url, '_blank', 'noopener');
            } catch (err) {
                const message = err instanceof Error ? err.message : t('toasts.failedToDownload');
                toast({
                    title: t('toasts.downloadFailed'),
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
                    title: t('toasts.missingConfig'),
                    description: t('toasts.missingConfigDescription'),
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
                    throw new Error(message || t('toasts.failedToStartRestore'));
                }

                toast({
                    title: t('toasts.restoreStarted'),
                    description: t('toasts.restoreStartedDescription'),
                });

                // await fetchBackups({ silent: true })
                return true;
            } catch (err) {
                const message = err instanceof Error ? err.message : t('toasts.failedToRestore');
                toast({
                    title: t('toasts.restoreFailed'),
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
                    title: t('toasts.missingConfig'),
                    description: t('toasts.missingConfigDescription'),
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
                    throw new Error(message || t('toasts.failedToDelete'));
                }

                toast({
                    title: t('toasts.backupDeleted'),
                    description: t('toasts.backupDeletedDescription'),
                });

                await fetchBackups({ silent: true });
                return true;
            } catch (err) {
                const message = err instanceof Error ? err.message : t('toasts.failedToDelete');
                toast({
                    title: t('toasts.deletionFailed'),
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
                    title: t('toasts.missingConfig'),
                    description: t('toasts.missingConfigDescription'),
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
                    throw new Error(message || t('toasts.failedToUnlock'));
                }

                toast({
                    title: t('toasts.backupUnlocked'),
                    description: t('toasts.backupUnlockedDescription'),
                });

                await fetchBackups({ silent: true });
                return true;
            } catch (err) {
                const message = err instanceof Error ? err.message : t('toasts.failedToUnlock');
                toast({
                    title: t('toasts.unlockFailed'),
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
        <Card className="border-0 shadow-sm p-3 min-h-72 w-full min-w-0">
            <div className="space-y-3">
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <h2 className="text-base font-semibold">{t('title')}</h2>
                        <p className="text-xs text-muted-foreground">
                            {t('description')}
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
                            {t('refresh')}
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
                            {t('newBackup')}
                        </Button>
                    </div>
                </div>

                {backupLimit > 0 ? (
                    <p className="text-xs text-muted-foreground">
                        {t('slotsUsed', { used: backups.length, limit: backupLimit, size: formatBytes(totalSize) })}
                    </p>
                ) : (
                    <p className="text-xs text-muted-foreground">
                        {t('slotsUnlimited', { size: formatBytes(totalSize) })}
                    </p>
                )}

                {limitReached && (
                    <Alert>
                        <AlertTitle>{t('limitReachedTitle')}</AlertTitle>
                        <AlertDescription>
                            {t('limitReachedDescription')}
                        </AlertDescription>
                    </Alert>
                )}

                {!ptUrl && (
                    <Alert variant="destructive">
                        <AlertTitle>{t('configRequiredTitle')}</AlertTitle>
                        <AlertDescription>
                            {t('configRequiredDescription')}
                        </AlertDescription>
                    </Alert>
                )}

                {error && backups.length === 0 && (
                    <Alert variant="destructive">
                        <AlertTitle>{t('unableToLoad')}</AlertTitle>
                        <AlertDescription>{error}</AlertDescription>
                    </Alert>
                )}

                {isLoading ? (
                    <div className="grid gap-3 grid-cols-1 md:grid-cols-2">
                        {Array.from({ length: 2 }).map((_, index) => (
                            <div
                                key={index}
                                className="h-44 rounded-lg border bg-muted/40 animate-pulse"
                            />
                        ))}
                    </div>
                ) : backups.length === 0 ? (
                    <div className="rounded-lg border border-dashed p-6 text-center text-sm text-muted-foreground">
                        {t('noBackups')}
                    </div>
                ) : (
                    <div className="grid gap-3 grid-cols-1 md:grid-cols-2">
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
            </div>

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

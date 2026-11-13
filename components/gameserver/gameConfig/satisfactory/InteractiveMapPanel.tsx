'use client';

import { createSatisfactoryMapLink } from '@/app/actions/gameservers/satisfactoryMap';
import type { PteroFileEntry } from '@/components/gameserver/FileManager/pteroFileApi';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import { formatBytes } from '@/lib/GlobalFunctions/ptResourceLogic';
import { displaySaveName, listSaves } from '@/lib/satisfactoryMap/saves';
import { ExternalLink, FileQuestion, Loader2, Map as MapIcon, RefreshCw } from 'lucide-react';
import { useFormatter, useLocale, useNow, useTranslations } from 'next-intl';
import { useCallback, useEffect, useState } from 'react';
import type { GameConfigPanelProps } from '../types';

type SaveState =
    { status: 'loading' } | { status: 'ready'; saves: PteroFileEntry[] } | { status: 'error' };

/** What is being opened: the "newest save" link, or one specific save by file name. */
type OpenTarget = { kind: 'latest' } | { kind: 'file'; name: string };

/**
 * "Open in interactive map" for Satisfactory: a button for the newest save (its link follows
 * new autosaves), and every save below it with its own button. Opens the hosted map
 * (satisfactory-calculator.com) with a signed 24-hour link. See docs/satisfactory-interactive-map.md.
 */
export default function InteractiveMapPanel({ server, apiKey }: GameConfigPanelProps) {
    const t = useTranslations('gameserver.config.satisfactory.map');
    const locale = useLocale();
    const format = useFormatter();
    // Explicit "now" for relativeTime, ticking so "saved 2 minutes ago" stays current.
    const now = useNow({ updateInterval: 30_000 });
    const { toast } = useToast();
    const [state, setState] = useState<SaveState>({ status: 'loading' });
    // Key of the button whose link is being created: 'latest' or a file name.
    const [opening, setOpening] = useState<string | null>(null);

    const fetchSaves = useCallback(
        () =>
            listSaves(server.identifier, apiKey).then(
                (saves): SaveState => ({ status: 'ready', saves }),
                (): SaveState => ({ status: 'error' }),
            ),
        [server.identifier, apiKey],
    );

    useEffect(() => {
        let cancelled = false;
        void fetchSaves().then((next) => {
            if (!cancelled) setState(next);
        });
        return () => {
            cancelled = true;
        };
    }, [fetchSaves]);

    const handleRefresh = async () => {
        setState({ status: 'loading' });
        setState(await fetchSaves());
    };

    const handleOpen = async (target: OpenTarget) => {
        // Open the tab synchronously inside the click, otherwise popup blockers stop it once
        // the server action has resolved.
        const tab = window.open('', '_blank');
        setOpening(target.kind === 'latest' ? 'latest' : target.name);
        try {
            const result = await createSatisfactoryMapLink(
                server.identifier,
                locale,
                target.kind === 'file' ? target.name : undefined,
            );
            if (result.status !== 'ok') throw new Error('Could not create the map link');
            if (tab) {
                tab.opener = null;
                tab.location.href = result.url;
            } else {
                window.location.href = result.url;
            }
        } catch {
            tab?.close();
            toast({
                title: t('openFailedTitle'),
                description: t('openFailedDescription'),
                variant: 'destructive',
            });
        } finally {
            setOpening(null);
        }
    };

    const savedAt = (save: PteroFileEntry) =>
        t('savedAt', {
            time: format.relativeTime(new Date(save.modifiedAt), now),
            size: formatBytes(save.size),
        });

    const saves = state.status === 'ready' ? state.saves : [];
    const latest = saves[0];

    return (
        <Card>
            <CardHeader className="flex flex-row items-start justify-between gap-3 space-y-0">
                <div className="space-y-1.5">
                    <CardTitle className="flex items-center gap-2 text-base">
                        <MapIcon className="h-4 w-4" />
                        {t('title')}
                    </CardTitle>
                    <CardDescription>{t('description')}</CardDescription>
                </div>
                <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 shrink-0"
                    onClick={() => void handleRefresh()}
                    disabled={state.status === 'loading'}
                    aria-label={t('refresh')}
                    title={t('refresh')}
                >
                    <RefreshCw
                        className={state.status === 'loading' ? 'h-4 w-4 animate-spin' : 'h-4 w-4'}
                    />
                </Button>
            </CardHeader>
            <CardContent className="space-y-4">
                {state.status === 'loading' ? (
                    <div className="space-y-2">
                        <Skeleton className="h-20 w-full" />
                        <Skeleton className="h-10 w-full" />
                    </div>
                ) : state.status === 'error' ? (
                    <p className="rounded-md border border-dashed py-4 text-center text-sm text-muted-foreground">
                        {t('loadFailed')}
                    </p>
                ) : !latest ? (
                    <div className="flex flex-col items-center gap-2 py-4 text-center">
                        <FileQuestion className="h-8 w-8 text-muted-foreground" />
                        <p className="text-sm font-medium">{t('noSaveTitle')}</p>
                        <p className="max-w-sm text-xs text-muted-foreground">
                            {t('noSaveDescription')}
                        </p>
                    </div>
                ) : (
                    <>
                        <div className="flex flex-col gap-3 rounded-md border px-3 py-3 sm:flex-row sm:items-center sm:justify-between">
                            <div className="min-w-0">
                                <p className="text-xs text-muted-foreground">{t('latestSave')}</p>
                                <p className="truncate text-sm font-medium">
                                    {displaySaveName(latest.name)}
                                </p>
                                <p className="text-xs text-muted-foreground">{savedAt(latest)}</p>
                                <p className="mt-1 text-xs text-muted-foreground">
                                    {t('latestHint')}
                                </p>
                            </div>
                            <Button
                                className="shrink-0"
                                onClick={() => void handleOpen({ kind: 'latest' })}
                                disabled={opening !== null}
                            >
                                {opening === 'latest' ? (
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                ) : (
                                    <ExternalLink className="h-4 w-4" />
                                )}
                                {t('openLatest')}
                            </Button>
                        </div>

                        <div className="space-y-1.5">
                            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                                {t('allSaves', { count: saves.length })}
                            </p>
                            <ul className="divide-y rounded-md border">
                                {saves.map((save) => {
                                    const name = displaySaveName(save.name);
                                    return (
                                        <li
                                            key={save.name}
                                            className="flex min-w-0 items-center gap-3 px-3 py-2"
                                        >
                                            <div className="min-w-0 flex-1">
                                                <p className="truncate text-sm font-medium">
                                                    {name}
                                                </p>
                                                <p className="text-xs text-muted-foreground">
                                                    {savedAt(save)}
                                                </p>
                                            </div>
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                className="shrink-0"
                                                onClick={() =>
                                                    void handleOpen({
                                                        kind: 'file',
                                                        name: save.name,
                                                    })
                                                }
                                                disabled={opening !== null}
                                                aria-label={t('openSaveLabel', { name })}
                                                title={t('openSaveLabel', { name })}
                                            >
                                                {opening === save.name ? (
                                                    <Loader2 className="h-4 w-4 animate-spin" />
                                                ) : (
                                                    <ExternalLink className="h-4 w-4" />
                                                )}
                                                {t('openSave')}
                                            </Button>
                                        </li>
                                    );
                                })}
                            </ul>
                        </div>
                    </>
                )}

                <p className="text-xs text-muted-foreground">{t('linkHint')}</p>
            </CardContent>
        </Card>
    );
}

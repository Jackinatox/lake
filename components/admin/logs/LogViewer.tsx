'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { getApplicationLogs, TimeRange } from '@/app/actions/logs/getApplicationLogs';
import LogFilters, { LogFilterState } from './LogFilters';
import LogList from './LogList';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { useDebounce } from '@/hooks/use-debounce';
import { LogLevel, LogType } from '@/app/client/generated/enums';
import { ApplicationLogWithRelations } from '@/models/prisma';
import { RotateCw, X } from 'lucide-react';
import { useTranslations } from 'next-intl';

const PAGE_SIZES = [50, 100, 200];

const EMPTY_FILTERS: LogFilterState = {
    search: '',
    level: 'ALL',
    type: 'ALL',
    timeRange: '1d',
    userId: undefined,
    gameServerId: undefined,
};

function isDefault(filters: LogFilterState) {
    return (
        filters.search === '' &&
        filters.level === 'ALL' &&
        filters.type === 'ALL' &&
        filters.timeRange === EMPTY_FILTERS.timeRange &&
        !filters.userId &&
        !filters.gameServerId
    );
}

export default function LogViewer() {
    const t = useTranslations('adminLogs.list');
    const router = useRouter();
    const pathname = usePathname();
    const searchParams = useSearchParams();

    // The URL seeds the initial filters (so links into the viewer work);
    // afterwards component state is the source of truth and writes back.
    const [filters, setFilters] = useState<LogFilterState>(() => ({
        search: searchParams.get('search') ?? '',
        level: (searchParams.get('level') as LogLevel | 'ALL') ?? 'ALL',
        type: (searchParams.get('type') as LogType | 'ALL') ?? 'ALL',
        timeRange: (searchParams.get('range') as TimeRange) ?? EMPTY_FILTERS.timeRange,
        userId: searchParams.get('userId') ?? undefined,
        gameServerId: searchParams.get('serverId') ?? undefined,
    }));
    const [page, setPage] = useState(() => Number(searchParams.get('page')) || 1);
    const [limit, setLimit] = useState(() => {
        const value = Number(searchParams.get('limit'));
        return PAGE_SIZES.includes(value) ? value : 100;
    });

    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [logs, setLogs] = useState<ApplicationLogWithRelations[]>([]);
    const [total, setTotal] = useState(0);
    const [totalPages, setTotalPages] = useState(0);
    const [reloadToken, setReloadToken] = useState(0);

    const debouncedSearch = useDebounce(filters.search, 400);

    const fetchLogs = useCallback(async () => {
        setIsLoading(true);
        try {
            const result = await getApplicationLogs({
                search: debouncedSearch,
                level: filters.level,
                type: filters.type,
                timeRange: filters.timeRange,
                userId: filters.userId,
                gameServerId: filters.gameServerId,
                page,
                limit,
            });
            setLogs(result.logs);
            setTotal(result.total);
            setTotalPages(result.totalPages);
            setError(null);
        } catch (err) {
            console.error('Failed to fetch logs:', err);
            setError(err instanceof Error ? err.message : 'Failed to fetch logs');
            setLogs([]);
            setTotal(0);
            setTotalPages(0);
        } finally {
            setIsLoading(false);
        }
    }, [
        debouncedSearch,
        filters.level,
        filters.type,
        filters.timeRange,
        filters.userId,
        filters.gameServerId,
        page,
        limit,
    ]);

    useEffect(() => {
        fetchLogs();
    }, [fetchLogs, reloadToken]);

    // Keep the URL in sync so a filtered view can be shared or bookmarked
    useEffect(() => {
        const params = new URLSearchParams();
        if (debouncedSearch) params.set('search', debouncedSearch);
        if (filters.level !== 'ALL') params.set('level', filters.level);
        if (filters.type !== 'ALL') params.set('type', filters.type);
        if (filters.timeRange !== EMPTY_FILTERS.timeRange) params.set('range', filters.timeRange);
        if (filters.userId) params.set('userId', filters.userId);
        if (filters.gameServerId) params.set('serverId', filters.gameServerId);
        if (page > 1) params.set('page', String(page));
        if (limit !== 100) params.set('limit', String(limit));

        const query = params.toString();
        router.replace(query ? `${pathname}?${query}` : pathname, { scroll: false });
    }, [
        debouncedSearch,
        filters.level,
        filters.type,
        filters.timeRange,
        filters.userId,
        filters.gameServerId,
        page,
        limit,
        pathname,
        router,
    ]);

    // Any filter change restarts at page 1 (but not the very first render)
    const isFirstRender = useRef(true);
    useEffect(() => {
        if (isFirstRender.current) {
            isFirstRender.current = false;
            return;
        }
        setPage(1);
    }, [
        debouncedSearch,
        filters.level,
        filters.type,
        filters.timeRange,
        filters.userId,
        filters.gameServerId,
        limit,
    ]);

    const updateFilters = useCallback((patch: Partial<LogFilterState>) => {
        setFilters((current) => ({ ...current, ...patch }));
    }, []);

    const filterByUser = useCallback((userId: string) => {
        setFilters((current) => ({ ...current, userId, gameServerId: undefined }));
    }, []);

    // Filtering by a server also pins its owner, so clearing the server filter
    // falls back to every log of that user instead of everything.
    const filterByServer = useCallback((serverId: string, ownerId: string | null) => {
        setFilters((current) => ({
            ...current,
            userId: ownerId ?? current.userId,
            gameServerId: serverId,
        }));
    }, []);

    return (
        <div className="space-y-3">
            <Card className="p-3">
                <LogFilters filters={filters} onChange={updateFilters} />

                <div className="mt-2 flex flex-wrap items-center justify-end gap-2">
                    {!isDefault(filters) && (
                        <Button
                            variant="ghost"
                            size="sm"
                            className="h-7 text-xs"
                            onClick={() => setFilters(EMPTY_FILTERS)}
                        >
                            <X className="h-3.5 w-3.5" />
                            {t('clearFilters')}
                        </Button>
                    )}
                    <Select
                        value={String(limit)}
                        onValueChange={(value) => setLimit(Number(value))}
                    >
                        <SelectTrigger className="h-7 w-28 text-xs">
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            {PAGE_SIZES.map((size) => (
                                <SelectItem key={size} value={String(size)} className="text-xs">
                                    {t('perPage', { count: size })}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                    <Button
                        variant="outline"
                        size="sm"
                        className="h-7 text-xs"
                        onClick={() => setReloadToken((token) => token + 1)}
                        disabled={isLoading}
                    >
                        <RotateCw
                            className={isLoading ? 'h-3.5 w-3.5 animate-spin' : 'h-3.5 w-3.5'}
                        />
                        {t('refresh')}
                    </Button>
                </div>
            </Card>

            {error && (
                <p className="rounded-md border border-destructive/40 bg-destructive/10 p-3 text-xs text-destructive">
                    {error}
                </p>
            )}

            <LogList
                logs={logs}
                total={total}
                page={page}
                totalPages={totalPages}
                onPageChange={setPage}
                onFilterUser={filterByUser}
                onFilterServer={filterByServer}
                isLoading={isLoading}
            />
        </div>
    );
}

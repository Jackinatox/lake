'use client';

import { useEffect, useState } from 'react';
import { Input } from '@/components/ui/input';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { LogLevel, LogType, WorkerJobType } from '@/app/client/generated/enums';
import { Search, X } from 'lucide-react';
import {
    getLogUserServers,
    type LogServerOption,
    type LogSourceFilter,
    type TimeRange,
} from '@/app/actions/logs/getLogs';
import { LOG_SOURCES, LOG_TIME_RANGES } from '@/lib/validation/adminContent';
import LogUserPicker from '@/components/admin/logs/LogUserPicker';
import { cn } from '@/lib/utils';
import { useTranslations } from 'next-intl';
import { SOURCE_STYLES } from './sourceStyles';

export type LogFilterState = {
    search: string;
    level: LogLevel | 'ALL';
    source: LogSourceFilter;
    type: LogType | 'ALL';
    jobType: WorkerJobType | 'ALL';
    jobRunId?: string;
    timeRange: TimeRange;
    userId?: string;
    gameServerId?: string;
};

type LogFiltersProps = {
    filters: LogFilterState;
    onChange: (patch: Partial<LogFilterState>) => void;
};

const LOG_LEVELS: Array<LogLevel | 'ALL'> = ['ALL', ...Object.values(LogLevel)];
const LOG_TYPES = Object.values(LogType);
const JOB_TYPES = Object.values(WorkerJobType);

export const formatEnum = (value: string) => value.replace(/_/g, ' ').toLowerCase();

function FilterField({ label, children }: { label: string; children: React.ReactNode }) {
    return (
        <div className="space-y-1">
            <span className="block text-[11px] font-medium text-muted-foreground">{label}</span>
            {children}
        </div>
    );
}

export default function LogFilters({ filters, onChange }: LogFiltersProps) {
    const t = useTranslations('adminLogs.filters');
    const [servers, setServers] = useState<LogServerOption[]>([]);

    const { userId, gameServerId } = filters;

    useEffect(() => {
        if (!userId) {
            setServers([]);
            return;
        }
        let cancelled = false;
        getLogUserServers(userId)
            .then((result) => {
                if (!cancelled) setServers(result);
            })
            .catch((error) => console.error('Failed to load servers:', error));
        return () => {
            cancelled = true;
        };
    }, [userId]);

    // A server filter set from a log row may belong to a user that is not
    // selected (or not loaded yet) — keep it selectable either way.
    const serverOptions =
        gameServerId && !servers.some((server) => server.id === gameServerId)
            ? [{ id: gameServerId, name: gameServerId, type: null }, ...servers]
            : servers;

    return (
        <div className="space-y-2">
            <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-8">
                <FilterField label={t('search')}>
                    <div className="relative">
                        <Search className="absolute left-2 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
                        <Input
                            placeholder={t('searchPlaceholder')}
                            value={filters.search}
                            onChange={(e) => onChange({ search: e.target.value })}
                            maxLength={200}
                            className="h-8 pl-7 text-base md:text-xs"
                        />
                    </div>
                </FilterField>

                <FilterField label={t('source')}>
                    <Select
                        value={filters.source}
                        onValueChange={(value) => {
                            const source = value as LogSourceFilter;
                            // App lines never belong to a job run, so drop job filters
                            onChange({
                                source,
                                ...(source === 'APP' && { jobType: 'ALL', jobRunId: undefined }),
                            });
                        }}
                    >
                        <SelectTrigger className="h-8 text-xs">
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            {LOG_SOURCES.map((source) => {
                                const style = source === 'ALL' ? null : SOURCE_STYLES[source];
                                return (
                                    <SelectItem key={source} value={source} className="text-xs">
                                        <span className="flex items-center gap-1.5">
                                            {style && (
                                                <style.icon
                                                    className={cn('h-3 w-3', style.iconColor)}
                                                />
                                            )}
                                            {t(`sources.${source}`)}
                                        </span>
                                    </SelectItem>
                                );
                            })}
                        </SelectContent>
                    </Select>
                </FilterField>

                <FilterField label={t('logLevel')}>
                    <Select
                        value={filters.level}
                        onValueChange={(value) => onChange({ level: value as LogLevel | 'ALL' })}
                    >
                        <SelectTrigger className="h-8 text-xs">
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            {LOG_LEVELS.map((level) => (
                                <SelectItem key={level} value={level} className="text-xs">
                                    {level === 'ALL' ? t('allLevels') : level}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </FilterField>

                <FilterField label={t('category')}>
                    <Select
                        value={filters.type}
                        onValueChange={(value) => onChange({ type: value as LogType | 'ALL' })}
                    >
                        <SelectTrigger className="h-8 text-xs">
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="ALL" className="text-xs">
                                {t('allCategories')}
                            </SelectItem>
                            {LOG_TYPES.map((type) => (
                                <SelectItem key={type} value={type} className="text-xs">
                                    {formatEnum(type)}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </FilterField>

                <FilterField label={t('workerJob')}>
                    <Select
                        value={filters.jobType}
                        onValueChange={(value) =>
                            onChange({ jobType: value as WorkerJobType | 'ALL' })
                        }
                        // App lines never belong to a job run
                        disabled={filters.source === 'APP'}
                    >
                        <SelectTrigger className="h-8 text-xs">
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="ALL" className="text-xs">
                                {t('allJobs')}
                            </SelectItem>
                            {JOB_TYPES.map((jobType) => (
                                <SelectItem
                                    key={jobType}
                                    value={jobType}
                                    className={cn('text-xs', SOURCE_STYLES.WORKER.category)}
                                >
                                    {formatEnum(jobType)}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </FilterField>

                <FilterField label={t('timeRange')}>
                    <Select
                        value={filters.timeRange}
                        onValueChange={(value) => onChange({ timeRange: value as TimeRange })}
                    >
                        <SelectTrigger className="h-8 text-xs">
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            {LOG_TIME_RANGES.map((range) => (
                                <SelectItem key={range} value={range} className="text-xs">
                                    {t(`timeRanges.${range}`)}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </FilterField>

                <FilterField label={t('user')}>
                    <LogUserPicker
                        value={userId}
                        onChange={(value) =>
                            // Dropping the user also drops their server filter
                            onChange({ userId: value, gameServerId: undefined })
                        }
                    />
                </FilterField>

                <FilterField label={t('server')}>
                    <Select
                        value={gameServerId ?? 'ALL'}
                        onValueChange={(value) =>
                            onChange({ gameServerId: value === 'ALL' ? undefined : value })
                        }
                        disabled={serverOptions.length === 0}
                    >
                        <SelectTrigger className="h-8 text-xs">
                            <SelectValue placeholder={t('allServers')} />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="ALL" className="text-xs">
                                {t('allServers')}
                            </SelectItem>
                            {serverOptions.map((server) => (
                                <SelectItem key={server.id} value={server.id} className="text-xs">
                                    <span
                                        className={cn(
                                            'truncate',
                                            server.type === 'FREE' &&
                                                'font-medium text-emerald-600 dark:text-emerald-400',
                                        )}
                                    >
                                        {server.name}
                                    </span>
                                    {server.type === 'FREE' && (
                                        <span className="ml-2 text-[10px] uppercase tracking-wide text-emerald-600 dark:text-emerald-400">
                                            {t('freeServer')}
                                        </span>
                                    )}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </FilterField>
            </div>

            {/* The job-run filter has no control of its own: it is set from a row */}
            {filters.jobRunId && (
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <span>{t('jobRunFilter')}</span>
                    <span className="font-mono text-foreground">{filters.jobRunId}</span>
                    <button
                        type="button"
                        onClick={() => onChange({ jobRunId: undefined })}
                        className="inline-flex items-center gap-0.5 hover:text-foreground"
                        aria-label={t('clearJobRun')}
                        title={t('clearJobRun')}
                    >
                        <X className="h-3 w-3" />
                    </button>
                </div>
            )}
        </div>
    );
}

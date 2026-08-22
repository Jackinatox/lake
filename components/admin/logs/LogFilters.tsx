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
import { LogLevel, LogType } from '@/app/client/generated/enums';
import { Search } from 'lucide-react';
import {
    TimeRange,
    LogServerOption,
    getLogUserServers,
} from '@/app/actions/logs/getApplicationLogs';
import LogUserPicker from './LogUserPicker';
import { cn } from '@/lib/utils';
import { useTranslations } from 'next-intl';

export type LogFilterState = {
    search: string;
    level: LogLevel | 'ALL';
    type: LogType | 'ALL';
    timeRange: TimeRange;
    userId?: string;
    gameServerId?: string;
};

type LogFiltersProps = {
    filters: LogFilterState;
    onChange: (patch: Partial<LogFilterState>) => void;
};

const LOG_LEVELS: Array<LogLevel | 'ALL'> = ['ALL', 'TRACE', 'INFO', 'WARN', 'ERROR', 'FATAL'];
const LOG_TYPES: Array<LogType | 'ALL'> = [
    'ALL',
    'SYSTEM',
    'AUTHENTICATION',
    'PAYMENT',
    'PAYMENT_LOG',
    'GAME_SERVER',
    'EMAIL',
    'SUPPORT_TICKET',
    'FREE_SERVER_EXTEND',
    'TELEGRAM',
];

const TIME_RANGES: TimeRange[] = ['ALL', '1m', '10m', '1h', '1d', '7d', '30d'];

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
        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
            <FilterField label={t('search')}>
                <div className="relative">
                    <Search className="absolute left-2 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
                    <Input
                        placeholder={t('searchPlaceholder')}
                        value={filters.search}
                        onChange={(e) => onChange({ search: e.target.value })}
                        maxLength={200}
                        className="h-8 pl-7 text-xs"
                    />
                </div>
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
                        {LOG_TYPES.map((type) => (
                            <SelectItem key={type} value={type} className="text-xs">
                                {type === 'ALL' ? t('allCategories') : type.replace(/_/g, ' ')}
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
                        {TIME_RANGES.map((range) => (
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
    );
}

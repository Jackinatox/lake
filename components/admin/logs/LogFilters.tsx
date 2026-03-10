'use client';

import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { LogLevel, LogType } from '@/app/client/generated/enums';
import { Search, Clock } from 'lucide-react';
import { TimeRange } from '@/app/actions/logs/getApplicationLogs';
import { useTranslations } from 'next-intl';

type LogFiltersProps = {
    search: string;
    level: LogLevel | 'ALL';
    type: LogType | 'ALL';
    timeRange: TimeRange;
    onSearchChange: (value: string) => void;
    onLevelChange: (value: LogLevel | 'ALL') => void;
    onTypeChange: (value: LogType | 'ALL') => void;
    onTimeRangeChange: (value: TimeRange) => void;
};

const LOG_LEVELS: Array<LogLevel | 'ALL'> = ['ALL', 'INFO', 'WARN', 'ERROR', 'FATAL'];
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

const TIME_RANGES: Array<{ value: TimeRange; labelKey: string }> = [
    { value: 'ALL', labelKey: 'ALL' },
    { value: '1m', labelKey: '1m' },
    { value: '10m', labelKey: '10m' },
    { value: '1h', labelKey: '1h' },
    { value: '1d', labelKey: '1d' },
    { value: '7d', labelKey: '7d' },
    { value: '30d', labelKey: '30d' },
];

export default function LogFilters({
    search,
    level,
    type,
    timeRange,
    onSearchChange,
    onLevelChange,
    onTypeChange,
    onTimeRangeChange,
}: LogFiltersProps) {
    const t = useTranslations('adminLogs.filters');
    return (
        <div className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                {/* Search */}
                <div className="space-y-2">
                    <Label htmlFor="search">{t('search')}</Label>
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                        <Input
                            id="search"
                            placeholder={t('searchPlaceholder')}
                            value={search}
                            onChange={(e) => onSearchChange(e.target.value)}
                            className="pl-9"
                        />
                    </div>
                </div>

                {/* Log Level */}
                <div className="space-y-2">
                    <Label htmlFor="level">{t('logLevel')}</Label>
                    <Select value={level} onValueChange={onLevelChange}>
                        <SelectTrigger id="level">
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            {LOG_LEVELS.map((lvl) => (
                                <SelectItem key={lvl} value={lvl}>
                                    {lvl}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>

                {/* Log Type */}
                <div className="space-y-2">
                    <Label htmlFor="type">{t('category')}</Label>
                    <Select value={type} onValueChange={onTypeChange}>
                        <SelectTrigger id="type">
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            {LOG_TYPES.map((t) => (
                                <SelectItem key={t} value={t}>
                                    {t.replace(/_/g, ' ')}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>

                {/* Time Range */}
                <div className="space-y-2">
                    <Label htmlFor="timeRange">{t('timeRange')}</Label>
                    <Select value={timeRange} onValueChange={onTimeRangeChange}>
                        <SelectTrigger id="timeRange">
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            {TIME_RANGES.map((range) => (
                                <SelectItem key={range.value} value={range.value}>
                                    {t(`timeRanges.${range.labelKey}`)}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
            </div>
        </div>
    );
}

'use client';

import { useState, useEffect, useCallback } from 'react';
import { getApplicationLogs } from '@/app/actions/logs/getApplicationLogs';
import LogFilters from './LogFilters';
import LogList from './LogList';
import { Card } from '@/components/ui/card';
import { useDebounce } from '@/hooks/use-debounce';
import { LogLevel, LogType } from '@/app/client/generated/enums';
import { TimeRange } from '@/app/actions/logs/getApplicationLogs';
import { ApplicationLogWithRelations } from '@/models/prisma';

export default function LogViewer() {
    const [search, setSearch] = useState('');
    const [level, setLevel] = useState<LogLevel | 'ALL'>('ALL');
    const [type, setType] = useState<LogType | 'ALL'>('ALL');
    const [timeRange, setTimeRange] = useState<TimeRange>('1d');
    const [page, setPage] = useState(1);
    const [isLoading, setIsLoading] = useState(false);

    const [logs, setLogs] = useState<ApplicationLogWithRelations[]>([]);
    const [total, setTotal] = useState(0);
    const [totalPages, setTotalPages] = useState(0);

    const debouncedSearch = useDebounce(search, 500);

    const fetchLogs = useCallback(async () => {
        setIsLoading(true);
        try {
            const result = await getApplicationLogs({
                search: debouncedSearch,
                level,
                type,
                timeRange,
                page,
                limit: 50,
            });
            setLogs(result.logs);
            setTotal(result.total);
            setTotalPages(result.totalPages);
        } catch (error) {
            console.error('Failed to fetch logs:', error);
        } finally {
            setIsLoading(false);
        }
    }, [debouncedSearch, level, type, timeRange, page]);

    useEffect(() => {
        fetchLogs();
    }, [fetchLogs]);

    // Reset to page 1 when filters change
    useEffect(() => {
        setPage(1);
    }, [debouncedSearch, level, type, timeRange]);

    return (
        <div className="space-y-4">
            <Card className="p-3 md:p-6">
                <LogFilters
                    search={search}
                    level={level}
                    type={type}
                    timeRange={timeRange}
                    onSearchChange={setSearch}
                    onLevelChange={setLevel}
                    onTypeChange={setType}
                    onTimeRangeChange={setTimeRange}
                />
            </Card>

            <LogList
                logs={logs}
                total={total}
                page={page}
                totalPages={totalPages}
                onPageChange={setPage}
                isLoading={isLoading}
            />
        </div>
    );
}

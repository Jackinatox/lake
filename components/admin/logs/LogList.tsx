'use client';

import LogRow from './LogRow';
import { Button } from '@/components/ui/button';
import { ApplicationLogWithRelations } from '@/models/prisma';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useTranslations } from 'next-intl';

type LogListProps = {
    logs: ApplicationLogWithRelations[];
    total: number;
    page: number;
    totalPages: number;
    onPageChange: (page: number) => void;
    onFilterUser: (userId: string) => void;
    onFilterServer: (serverId: string, ownerId: string | null) => void;
    isLoading?: boolean;
};

export default function LogList({
    logs,
    total,
    page,
    totalPages,
    onPageChange,
    onFilterUser,
    onFilterServer,
    isLoading,
}: LogListProps) {
    const t = useTranslations('adminLogs.list');

    return (
        <div className="space-y-3">
            <div className="overflow-hidden rounded-md border">
                {/* Column header — mirrors the columns of LogRow */}
                <div className="flex h-7 items-center gap-2 border-b border-l-2 border-l-transparent bg-muted/50 px-1.5 text-[11px] font-medium uppercase tracking-wide text-muted-foreground md:gap-3">
                    <span className="w-3 shrink-0" />
                    <span className="w-[110px] shrink-0">{t('columnTime')}</span>
                    <span className="w-10 shrink-0">{t('columnLevel')}</span>
                    <span className="hidden w-32 shrink-0 lg:block">{t('columnType')}</span>
                    <span className="min-w-0 flex-1">{t('columnMessage')}</span>
                    <span className="hidden w-36 shrink-0 md:block">{t('columnUser')}</span>
                    <span className="hidden w-36 shrink-0 md:block">{t('columnServer')}</span>
                </div>

                {isLoading ? (
                    <div className="divide-y">
                        {[...Array(15)].map((_, i) => (
                            <div key={i} className="flex h-7 items-center px-2">
                                <div className="h-2.5 w-full animate-pulse rounded bg-muted" />
                            </div>
                        ))}
                    </div>
                ) : logs.length === 0 ? (
                    <p className="p-8 text-center text-sm text-muted-foreground">{t('noLogs')}</p>
                ) : (
                    logs.map((log) => (
                        <LogRow
                            key={log.id}
                            log={log}
                            onFilterUser={onFilterUser}
                            onFilterServer={onFilterServer}
                        />
                    ))
                )}
            </div>

            <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="text-xs text-muted-foreground">
                    {t('showing', { count: logs.length, total, page, totalPages })}
                </span>

                {totalPages > 1 && (
                    <div className="flex items-center gap-2">
                        <Button
                            variant="outline"
                            size="sm"
                            className="h-7 text-xs"
                            onClick={() => onPageChange(page - 1)}
                            disabled={page <= 1 || isLoading}
                        >
                            <ChevronLeft className="h-3.5 w-3.5" />
                            {t('previous')}
                        </Button>
                        <span className="text-xs text-muted-foreground">
                            {t('pageOf', { page, totalPages })}
                        </span>
                        <Button
                            variant="outline"
                            size="sm"
                            className="h-7 text-xs"
                            onClick={() => onPageChange(page + 1)}
                            disabled={page >= totalPages || isLoading}
                        >
                            {t('next')}
                            <ChevronRight className="h-3.5 w-3.5" />
                        </Button>
                    </div>
                )}
            </div>
        </div>
    );
}

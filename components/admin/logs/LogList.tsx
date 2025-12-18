'use client';

import LogEntry from './LogEntry';
import { Button } from '@/components/ui/button';
import { ApplicationLogWithRelations } from '@/models/prisma';
import { ChevronLeft, ChevronRight } from 'lucide-react';

type LogListProps = {
    logs: ApplicationLogWithRelations[];
    total: number;
    page: number;
    totalPages: number;
    onPageChange: (page: number) => void;
    isLoading?: boolean;
};

export default function LogList({
    logs,
    total,
    page,
    totalPages,
    onPageChange,
    isLoading,
}: LogListProps) {
    if (isLoading) {
        return (
            <div className="space-y-3">
                {[...Array(5)].map((_, i) => (
                    <div key={i} className="h-24 animate-pulse rounded-lg bg-muted" />
                ))}
            </div>
        );
    }

    if (logs.length === 0) {
        return (
            <div className="rounded-lg border border-dashed p-8 text-center">
                <p className="text-muted-foreground">No logs found</p>
            </div>
        );
    }

    return (
        <div className="space-y-4">
            {/* Stats */}
            <div className="text-sm text-muted-foreground">
                Showing {logs.length} of {total} logs (Page {page} of {totalPages})
            </div>

            {/* Log entries */}
            <div className="space-y-3">
                {logs.map((log) => (
                    <LogEntry key={log.id} log={log} />
                ))}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
                <div className="flex items-center justify-center gap-2">
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => onPageChange(page - 1)}
                        disabled={page === 1}
                    >
                        <ChevronLeft className="h-4 w-4" />
                        Previous
                    </Button>
                    <span className="text-sm text-muted-foreground">
                        Page {page} of {totalPages}
                    </span>
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => onPageChange(page + 1)}
                        disabled={page === totalPages}
                    >
                        Next
                        <ChevronRight className="h-4 w-4" />
                    </Button>
                </div>
            )}
        </div>
    );
}

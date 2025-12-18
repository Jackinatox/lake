'use client';

import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { LogLevel, LogType } from '@/app/client/generated/enums';
import { ChevronDown, ChevronRight } from 'lucide-react';
import { useState } from 'react';
import { cn } from '@/lib/utils';

type LogEntryProps = {
    log: {
        id: number;
        level: LogLevel;
        type: LogType;
        message: string;
        details: any;
        method: string | null;
        path: string | null;
        userAgent: string | null;
        ipAddress: string | null;
        createdAt: Date;
        user: { id: string; name: string; email: string } | null;
        gameServer: { id: string; name: string } | null;
    };
};

const getLevelColor = (level: LogLevel) => {
    switch (level) {
        case 'INFO':
            return 'bg-blue-500/10 text-blue-500 border-blue-500/20';
        case 'WARN':
            return 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20';
        case 'ERROR':
            return 'bg-red-500/10 text-red-500 border-red-500/20';
        case 'FATAL':
            return 'bg-red-900/20 text-red-700 border-red-700/30';
        default:
            return 'bg-gray-500/10 text-gray-500 border-gray-500/20';
    }
};

const getTypeColor = (type: LogType) => {
    const colors: Record<LogType, string> = {
        SYSTEM: 'bg-purple-500/10 text-purple-500',
        AUTHENTICATION: 'bg-green-500/10 text-green-500',
        PAYMENT: 'bg-emerald-500/10 text-emerald-500',
        PAYMENT_LOG: 'bg-teal-500/10 text-teal-500',
        GAME_SERVER: 'bg-blue-500/10 text-blue-500',
        EMAIL: 'bg-pink-500/10 text-pink-500',
        SUPPORT_TICKET: 'bg-orange-500/10 text-orange-500',
        FREE_SERVER_EXTEND: 'bg-cyan-500/10 text-cyan-500',
        TELEGRAM: 'bg-sky-500/10 text-sky-500',
    };
    return colors[type] || 'bg-gray-500/10 text-gray-500';
};

export default function LogEntry({ log }: LogEntryProps) {
    const [expanded, setExpanded] = useState(false);

    return (
        <Card className={cn('transition-all hover:shadow-md')}>
            <CardContent className="p-3 md:p-4">
                <div className="space-y-2">
                    {/* Header */}
                    <div className="flex flex-wrap items-start justify-between gap-2">
                        <div className="flex flex-wrap items-center gap-2">
                            <Badge
                                variant="outline"
                                className={cn('text-xs font-medium', getLevelColor(log.level))}
                            >
                                {log.level}
                            </Badge>
                            <Badge
                                variant="outline"
                                className={cn('text-xs', getTypeColor(log.type))}
                            >
                                {log.type.replace(/_/g, ' ')}
                            </Badge>
                        </div>
                        <span className="text-xs text-muted-foreground">
                            {new Date(log.createdAt).toLocaleString()}
                        </span>
                    </div>

                    {/* Message */}
                    <p className="text-sm font-medium">{log.message}</p>

                    {/* Metadata */}
                    <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
                        {log.method && log.path && (
                            <span>
                                <span className="font-medium">{log.method}</span> {log.path}
                            </span>
                        )}
                        {log.user && <span>User: {log.user.name}</span>}
                        {log.gameServer && <span>Server: {log.gameServer.name}</span>}
                    </div>

                    {/* Expandable Details */}
                    {(log.details || log.ipAddress || log.userAgent) && (
                        <div>
                            <button
                                onClick={() => setExpanded(!expanded)}
                                className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
                            >
                                {expanded ? (
                                    <ChevronDown className="h-3 w-3" />
                                ) : (
                                    <ChevronRight className="h-3 w-3" />
                                )}
                                {expanded ? 'Hide' : 'Show'} details
                            </button>

                            {expanded && (
                                <div className="mt-2 space-y-2 rounded-md bg-muted p-3">
                                    {log.ipAddress && (
                                        <div className="text-xs">
                                            <span className="font-medium">IP:</span> {log.ipAddress}
                                        </div>
                                    )}
                                    {log.userAgent && (
                                        <div className="text-xs">
                                            <span className="font-medium">User Agent:</span>{' '}
                                            {log.userAgent}
                                        </div>
                                    )}
                                    {log.details && (
                                        <div className="text-xs">
                                            <span className="font-medium">Details:</span>
                                            <pre className="mt-1 overflow-x-auto whitespace-pre-wrap rounded bg-background p-2">
                                                {JSON.stringify(log.details, null, 2)}
                                            </pre>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </CardContent>
        </Card>
    );
}

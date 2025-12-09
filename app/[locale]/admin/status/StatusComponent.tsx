'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Loader2, RefreshCw, Check, X } from 'lucide-react';
import { Button } from '@/components/ui/button';

const StatusPage = () => {
    const [status, setStatus] = useState<any | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchStatus = async () => {
        setLoading(true);
        setError(null);
        try {
            const response = await fetch('/api/status');
            if (!response.ok) throw new Error('Failed to fetch status');
            const data = await response.json();
            setStatus(data);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Unknown error');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchStatus();
    }, []);

    if (loading) {
        return (
            <div className="flex min-h-[60vh] items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    if (error || !status) {
        return (
            <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4">
                <div className="flex items-center gap-2 text-destructive">
                    <X className="h-6 w-6" />
                    <span className="text-lg font-medium">Error: {error || 'No data'}</span>
                </div>
                <Button onClick={fetchStatus} variant="outline">
                    <RefreshCw className="mr-2 h-4 w-4" />
                    Retry
                </Button>
            </div>
        );
    }

    return (
        <div className="w-full space-y-6 py-8 sm:mx-auto sm:max-w-6xl sm:px-4">
            <div className="flex items-center justify-between">
                <h1 className="text-2xl font-semibold text-foreground md:text-3xl">
                    System Status
                </h1>
                <Button onClick={fetchStatus} variant="outline" size="sm">
                    <RefreshCw className="mr-2 h-4 w-4" />
                    Refresh
                </Button>
            </div>

            {/* Overview */}
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium">Status</CardTitle>
                        {status.status === 'ok' ? (
                            <Check className="h-4 w-4 text-green-600" />
                        ) : (
                            <X className="h-4 w-4 text-destructive" />
                        )}
                    </CardHeader>
                    <CardContent>
                        <Badge
                            variant={status.status === 'ok' ? 'default' : 'destructive'}
                            className="text-sm"
                        >
                            {status.status.toUpperCase()}
                        </Badge>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium">Response Time</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{status.responseTime}</div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium">Database</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="flex items-center gap-2">
                            <Badge variant={status.database.connected ? 'default' : 'destructive'}>
                                {status.database.connected ? 'Connected' : 'Disconnected'}
                            </Badge>
                            <span className="text-sm text-muted-foreground">
                                {status.database.latency}
                            </span>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium">Environment</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <Badge variant="outline" className="text-sm">
                            {status.system.environment.nodeEnv}
                        </Badge>
                    </CardContent>
                </Card>
            </div>

            {/* Database Stats */}
            <Card>
                <CardHeader>
                    <CardTitle>Database Statistics</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                        <div className="space-y-1">
                            <div className="text-sm text-muted-foreground">Users</div>
                            <div className="text-2xl font-bold">
                                {status.database.stats.users.total}
                            </div>
                        </div>
                        <div className="space-y-1">
                            <div className="text-sm text-muted-foreground">Game Servers</div>
                            <div className="text-2xl font-bold">
                                {status.database.stats.gameServers.total}
                            </div>
                            <div className="text-xs text-muted-foreground">
                                {status.database.stats.gameServers.active} active ·{' '}
                                {status.database.stats.gameServers.expired} expired
                            </div>
                        </div>
                        <div className="space-y-1">
                            <div className="text-sm text-muted-foreground">Orders</div>
                            <div className="text-2xl font-bold">
                                {status.database.stats.orders.total}
                            </div>
                            <div className="text-xs text-muted-foreground">
                                {status.database.stats.orders.pending} pending ·{' '}
                                {status.database.stats.orders.paid} paid
                            </div>
                        </div>
                        <div className="space-y-1">
                            <div className="text-sm text-muted-foreground">Game Data</div>
                            <div className="text-2xl font-bold">
                                {status.database.stats.gameData.total}
                            </div>
                        </div>
                        <div className="space-y-1">
                            <div className="text-sm text-muted-foreground">Locations</div>
                            <div className="text-2xl font-bold">
                                {status.database.stats.locations.total}
                            </div>
                        </div>
                        <div className="space-y-1">
                            <div className="text-sm text-muted-foreground">Support Tickets</div>
                            <div className="text-2xl font-bold">
                                {status.database.stats.supportTickets.total}
                            </div>
                            <div className="text-xs text-muted-foreground">
                                {status.database.stats.supportTickets.open} open
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* System Info */}
            <div className="grid gap-4 lg:grid-cols-2">
                <Card>
                    <CardHeader>
                        <CardTitle>Process Information</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                        <div className="grid grid-cols-2 gap-3 text-sm">
                            <div>
                                <div className="text-muted-foreground">PID</div>
                                <div className="font-medium">{status.system.process.pid}</div>
                            </div>
                            <div>
                                <div className="text-muted-foreground">Uptime</div>
                                <div className="font-medium">
                                    {status.system.process.uptime.formatted}
                                </div>
                            </div>
                            <div>
                                <div className="text-muted-foreground">Node Version</div>
                                <div className="font-medium">
                                    {status.system.process.nodeVersion}
                                </div>
                            </div>
                            <div>
                                <div className="text-muted-foreground">Platform</div>
                                <div className="font-medium">
                                    {status.system.process.platform} ({status.system.process.arch})
                                </div>
                            </div>
                        </div>
                        <div>
                            <div className="mb-2 text-sm font-medium">Memory Usage</div>
                            <div className="grid grid-cols-2 gap-2 text-sm">
                                <div>
                                    <span className="text-muted-foreground">Heap: </span>
                                    <span className="font-medium">
                                        {status.system.process.memory.heapUsed} /{' '}
                                        {status.system.process.memory.heapTotal}
                                    </span>
                                </div>
                                <div>
                                    <span className="text-muted-foreground">RSS: </span>
                                    <span className="font-medium">
                                        {status.system.process.memory.rss}
                                    </span>
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>System Information</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                        <div className="grid grid-cols-2 gap-3 text-sm">
                            <div>
                                <div className="text-muted-foreground">Hostname</div>
                                <div className="font-medium">{status.system.system.hostname}</div>
                            </div>
                            <div>
                                <div className="text-muted-foreground">CPUs</div>
                                <div className="font-medium">{status.system.system.cpus}</div>
                            </div>
                            <div className="col-span-2">
                                <div className="text-muted-foreground">CPU Model</div>
                                <div className="font-medium">{status.system.system.cpuModel}</div>
                            </div>
                            <div>
                                <div className="text-muted-foreground">Total Memory</div>
                                <div className="font-medium">
                                    {status.system.system.totalMemory}
                                </div>
                            </div>
                            <div>
                                <div className="text-muted-foreground">Free Memory</div>
                                <div className="font-medium">{status.system.system.freeMemory}</div>
                            </div>
                            <div>
                                <div className="text-muted-foreground">System Uptime</div>
                                <div className="font-medium">
                                    {status.system.system.uptime.formatted}
                                </div>
                            </div>
                            <div>
                                <div className="text-muted-foreground">Load Average</div>
                                <div className="font-medium">
                                    {status.system.system.loadAverage
                                        .map((l: any) => l.toFixed(2))
                                        .join(' · ')}
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Footer Info */}
            <div className="text-center text-xs text-muted-foreground">
                Last updated: {new Date(status.timestamp).toLocaleString()} · Client IP:{' '}
                {status.clientIP}
            </div>
        </div>
    );
};

export default StatusPage;

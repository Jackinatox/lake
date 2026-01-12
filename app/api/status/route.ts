import { NextRequest, NextResponse } from 'next/server';
import { logger } from '@/lib/logger';
import prisma from '@/lib/prisma';
import os from 'os';
import { authClient } from '@/lib/auth-client';
import { auth } from '@/auth';
import { headers } from 'next/headers';

// Local IP ranges for access control
const LOCAL_IP_RANGES = [
    '127.0.0.1',
    '::1',
    'localhost',
    '10.',
    '172.16.',
    '172.17.',
    '172.18.',
    '172.19.',
    '172.20.',
    '172.21.',
    '172.22.',
    '172.23.',
    '172.24.',
    '172.25.',
    '172.26.',
    '172.27.',
    '172.28.',
    '172.29.',
    '172.30.',
    '172.31.',
    '192.168.',
];

export function isLocalIP(ip: string | null): boolean {
    if (!ip) return false;
    return LOCAL_IP_RANGES.some((range) => ip.startsWith(range) || ip === range);
}

export function getClientIP(req: NextRequest): string | null {
    // Check various headers for the real IP
    const xForwardedFor = req.headers.get('x-forwarded-for');
    if (xForwardedFor) {
        // x-forwarded-for can contain multiple IPs, take the first one
        return xForwardedFor.split(',')[0].trim();
    }

    const xRealIP = req.headers.get('x-real-ip');
    if (xRealIP) {
        return xRealIP.trim();
    }

    // Fallback to connection info if available
    const cfConnectingIP = req.headers.get('cf-connecting-ip');
    if (cfConnectingIP) {
        return cfConnectingIP.trim();
    }

    // For local development, assume localhost
    return '127.0.0.1';
}

async function getDatabaseStats() {
    const [
        userCount,
        gameServerCount,
        activeServerCount,
        expiredServerCount,
        orderCount,
        pendingOrderCount,
        paidOrderCount,
        gameDataCount,
        locationCount,
        supportTicketCount,
        openTicketCount,
    ] = await Promise.all([
        prisma.user.count(),
        prisma.gameServer.count(),
        prisma.gameServer.count({ where: { status: 'ACTIVE' } }),
        prisma.gameServer.count({ where: { status: 'EXPIRED' } }),
        prisma.gameServerOrder.count(),
        prisma.gameServerOrder.count({ where: { status: 'PENDING' } }),
        prisma.gameServerOrder.count({ where: { status: 'PAID' } }),
        prisma.gameData.count(),
        prisma.location.count(),
        prisma.supportTicket.count(),
        prisma.supportTicket.count({ where: { status: 'OPEN' } }),
    ]);

    return {
        users: {
            total: userCount,
        },
        gameServers: {
            total: gameServerCount,
            active: activeServerCount,
            expired: expiredServerCount,
        },
        orders: {
            total: orderCount,
            pending: pendingOrderCount,
            paid: paidOrderCount,
        },
        gameData: {
            total: gameDataCount,
        },
        locations: {
            total: locationCount,
        },
        supportTickets: {
            total: supportTicketCount,
            open: openTicketCount,
        },
    };
}

function getSystemInfo() {
    const uptime = process.uptime();
    const memoryUsage = process.memoryUsage();

    return {
        process: {
            pid: process.pid,
            uptime: {
                seconds: Math.floor(uptime),
                formatted: formatUptime(uptime),
            },
            memory: {
                heapUsed: formatBytes(memoryUsage.heapUsed),
                heapTotal: formatBytes(memoryUsage.heapTotal),
                external: formatBytes(memoryUsage.external),
                rss: formatBytes(memoryUsage.rss),
                raw: memoryUsage,
            },
            nodeVersion: process.version,
            platform: process.platform,
            arch: process.arch,
        },
        system: {
            hostname: os.hostname(),
            cpus: os.cpus().length,
            cpuModel: os.cpus()[0]?.model || 'Unknown',
            totalMemory: formatBytes(os.totalmem()),
            freeMemory: formatBytes(os.freemem()),
            loadAverage: os.loadavg(),
            uptime: {
                seconds: Math.floor(os.uptime()),
                formatted: formatUptime(os.uptime()),
            },
        },
        environment: {
            nodeEnv: process.env.NODE_ENV || 'development',
            nextRuntime: process.env.NEXT_RUNTIME || 'nodejs',
        },
    };
}

function formatUptime(seconds: number): string {
    const days = Math.floor(seconds / 86400);
    const hours = Math.floor((seconds % 86400) / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);

    const parts = [];
    if (days > 0) parts.push(`${days}d`);
    if (hours > 0) parts.push(`${hours}h`);
    if (minutes > 0) parts.push(`${minutes}m`);
    parts.push(`${secs}s`);

    return parts.join(' ');
}

function formatBytes(bytes: number): string {
    const units = ['B', 'KB', 'MB', 'GB', 'TB'];
    let unitIndex = 0;
    let size = bytes;

    while (size >= 1024 && unitIndex < units.length - 1) {
        size /= 1024;
        unitIndex++;
    }

    return `${size.toFixed(2)} ${units[unitIndex]}`;
}

export async function GET(req: NextRequest) {
    const clientIP = getClientIP(req);
    const session = await auth.api.getSession({
        headers: await headers(),
    });

    if (!(isLocalIP(clientIP) || session?.user.role?.includes('admin'))) {
        console.log(clientIP);
        logger
            .logError({}, 'SYSTEM', {
                method: 'GET',
                path: '/api/status',
                ipAddress: clientIP ?? undefined,
            })
            .catch(() => {
                /* swallow logging errors */
            });
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    try {
        const startTime = Date.now();

        // Test database connectivity
        let dbConnected = false;
        let dbLatency = 0;
        try {
            const dbStart = Date.now();
            await prisma.$queryRaw`SELECT 1`;
            dbLatency = Date.now() - dbStart;
            dbConnected = true;
        } catch {
            dbConnected = false;
        }

        const [databaseStats, systemInfo] = await Promise.all([
            dbConnected ? getDatabaseStats() : null,
            getSystemInfo(),
        ]);

        const responseTime = Date.now() - startTime;

        return NextResponse.json(
            {
                status: 'ok',
                timestamp: new Date().toISOString(),
                responseTime: `${responseTime}ms`,
                clientIP,
                database: {
                    connected: dbConnected,
                    latency: `${dbLatency}ms`,
                    stats: databaseStats,
                },
                system: systemInfo,
            },
            { status: 200 },
        );
    } catch (error) {
        logger
            .logError(error as Error, 'SYSTEM', {
                method: 'GET',
                path: '/api/status',
            })
            .catch(() => {
                /* swallow logging errors */
            });
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

export async function POST(req: NextRequest) {
    // Redirect POST to GET for backwards compatibility
    return GET(req);
}

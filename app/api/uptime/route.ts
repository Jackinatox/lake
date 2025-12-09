import { auth } from '@/auth';
import { logger } from '@/lib/logger';
import prisma from '@/lib/prisma';
import { headers } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';

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


export async function GET(req: NextRequest) {
    const clientIP = getClientIP(req);
    const session = await auth.api.getSession({
        headers: await headers()
    });

    const gameServerCount = await prisma.gameServer.count();
    const uptime = process.uptime();

    if (!(isLocalIP(clientIP) || session?.user.role?.includes('admin'))) {
        console.log(clientIP)
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
        return NextResponse.json(
            {
                timestamp: new Date().toISOString(),
                clientIP,
                uptime: { seconds: Math.round(uptime), formatted: formatUptime(uptime) },
                gameServerCount,
            },
            { status: 200 }
        );
    } catch (error) {
        logger
            .logError(error as Error, 'SYSTEM', {
                method: 'GET',
                path: '/api/uptime',
            })
            .catch(() => {
                /* swallow logging errors */
            });
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}



function isLocalIP(ip: string | null): boolean {
    if (!ip) return false;
    return LOCAL_IP_RANGES.some((range) => ip.startsWith(range) || ip === range);
}

function getClientIP(req: NextRequest): string | null {
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

    return '127.0.0.1';
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
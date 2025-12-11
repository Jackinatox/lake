import { auth } from '@/auth';
import { logger } from '@/lib/logger';
import prisma from '@/lib/prisma';
import { headers } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';
import { getClientIP, isLocalIP } from '../status/route';


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
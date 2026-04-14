import { logger } from '@/lib/logger';
import prisma from '@/lib/prisma';
import { NextRequest, NextResponse } from 'next/server';
import { ApiKeyPermission } from '@/lib/apiKeyPermissions';
import { requireApiKeyOrAdmin } from '@/lib/apiRouteAuth';

export async function GET(req: NextRequest) {
    const denied = await requireApiKeyOrAdmin(req, ApiKeyPermission.READ_STATUS_UPTIME);
    if (denied) return denied;

    try {
        const gameServerCount = await prisma.gameServer.count();
        const uptime = process.uptime();

        return NextResponse.json(
            {
                timestamp: new Date().toISOString(),
                uptime: { seconds: Math.round(uptime), formatted: formatUptime(uptime) },
                gameServerCount,
            },
            { status: 200 },
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

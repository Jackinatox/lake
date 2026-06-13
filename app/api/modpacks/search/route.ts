import { logger } from '@/lib/logger';
import { getModpackProvider } from '@/lib/modpacks/provider';
import prisma from '@/lib/prisma';
import type { ModpackSummary } from '@/types/modpacks';
import { modpackPlatformSchema } from '@/lib/validation/order';
import { NextResponse } from 'next/server';

const CACHE_TTL_MS = 24 * 60 * 60 * 1000;

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);

    const parsedPlatform = modpackPlatformSchema.safeParse(
        searchParams.get('platform') ?? 'modrinth',
    );
    if (!parsedPlatform.success) {
        return NextResponse.json({ error: 'Invalid platform' }, { status: 400 });
    }

    const platform = parsedPlatform.data;
    const query = (searchParams.get('query') ?? '').trim();
    if (query.length > 100) {
        return NextResponse.json({ error: 'Query is too long' }, { status: 400 });
    }

    const cached = await prisma.modpackCache.findFirst({
        where: {
            searchString: query,
            provider: platform,
            createdAt: { gt: new Date(Date.now() - CACHE_TTL_MS) },
        },
        orderBy: { createdAt: 'desc' },
    });
    if (cached) {
        return NextResponse.json({ modpacks: cached.result as unknown as ModpackSummary[] });
    }

    try {
        const modpacks = await getModpackProvider(platform).search(query);

        await prisma.modpackCache.create({
            data: {
                searchString: query,
                provider: platform,
                result: modpacks as unknown as object,
            },
        });

        return NextResponse.json({ modpacks });
    } catch (error) {
        await logger.error('Modpack search failed', 'SYSTEM', {
            details: {
                platform,
                query,
                error: error instanceof Error ? error.message : String(error),
            },
        });
        return NextResponse.json({ error: 'Failed to fetch modpacks' }, { status: 502 });
    }
}

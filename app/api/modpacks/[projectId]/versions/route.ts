import { logger } from '@/lib/logger';
import { getModpackProvider } from '@/lib/modpacks/provider';
import prisma from '@/lib/prisma';
import type { ModpackVersion } from '@/types/modpacks';
import { z } from '@/lib/validation/common';
import { modpackPlatformSchema } from '@/lib/validation/order';
import { NextResponse } from 'next/server';

const CACHE_TTL_MS = 2 * 60 * 60 * 1000;

const projectIdSchema = z
    .string()
    .trim()
    .min(1)
    .max(64)
    .regex(/^[\w-]+$/);

export async function GET(
    request: Request,
    { params }: { params: Promise<{ projectId: string }> },
) {
    const { searchParams } = new URL(request.url);

    const parsedPlatform = modpackPlatformSchema.safeParse(
        searchParams.get('platform') ?? 'modrinth',
    );
    if (!parsedPlatform.success) {
        return NextResponse.json({ error: 'Invalid platform' }, { status: 400 });
    }

    const { projectId } = await params;
    const parsedProjectId = projectIdSchema.safeParse(projectId);
    if (!parsedProjectId.success) {
        return NextResponse.json({ error: 'Invalid project ID' }, { status: 400 });
    }

    const platform = parsedPlatform.data;
    const id = parsedProjectId.data;

    const cached = await prisma.modpackVersionCache.findFirst({
        where: {
            projectId: id,
            provider: platform,
            createdAt: { gt: new Date(Date.now() - CACHE_TTL_MS) },
        },
        orderBy: { createdAt: 'desc' },
    });
    if (cached) {
        return NextResponse.json({ versions: cached.result as unknown as ModpackVersion[] });
    }

    try {
        const versions = await getModpackProvider(platform).getVersions(id);

        await prisma.modpackVersionCache.create({
            data: {
                projectId: id,
                provider: platform,
                result: versions as unknown as object,
            },
        });

        return NextResponse.json({ versions });
    } catch (error) {
        await logger.error('Modpack version fetch failed', 'SYSTEM', {
            details: {
                platform,
                projectId: id,
                error: error instanceof Error ? error.message : String(error),
            },
        });
        return NextResponse.json({ error: 'Failed to fetch modpacks' }, { status: 502 });
    }
}

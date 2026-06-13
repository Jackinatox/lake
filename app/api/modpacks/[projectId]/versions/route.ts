import { logger } from '@/lib/logger';
import { getModpackProvider } from '@/lib/modpacks/provider';
import { z } from '@/lib/validation/common';
import { modpackPlatformSchema } from '@/lib/validation/order';
import { NextResponse } from 'next/server';

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

    try {
        const versions = await getModpackProvider(parsedPlatform.data).getVersions(
            parsedProjectId.data,
        );
        return NextResponse.json({ versions });
    } catch (error) {
        await logger.error('Modpack version fetch failed', 'SYSTEM', {
            details: {
                platform: parsedPlatform.data,
                projectId: parsedProjectId.data,
                error: error instanceof Error ? error.message : String(error),
            },
        });
        return NextResponse.json({ error: 'Failed to fetch modpacks' }, { status: 502 });
    }
}

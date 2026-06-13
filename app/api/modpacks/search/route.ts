import { logger } from '@/lib/logger';
import { getModpackProvider } from '@/lib/modpacks/provider';
import { modpackPlatformSchema } from '@/lib/validation/order';
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);

    const parsedPlatform = modpackPlatformSchema.safeParse(
        searchParams.get('platform') ?? 'modrinth',
    );
    if (!parsedPlatform.success) {
        return NextResponse.json({ error: 'Invalid platform' }, { status: 400 });
    }

    const query = (searchParams.get('query') ?? '').trim();
    if (query.length > 100) {
        return NextResponse.json({ error: 'Query is too long' }, { status: 400 });
    }

    try {
        const modpacks = await getModpackProvider(parsedPlatform.data).search(query);
        return NextResponse.json({ modpacks });
    } catch (error) {
        await logger.error('Modpack search failed', 'SYSTEM', {
            details: {
                platform: parsedPlatform.data,
                query,
                error: error instanceof Error ? error.message : String(error),
            },
        });
        return NextResponse.json({ error: 'Failed to fetch modpacks' }, { status: 502 });
    }
}

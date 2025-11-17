'use server';

import { getFreeTierConfigCached } from '@/lib/free-tier/config';
import { prisma } from '@/prisma';
import { getTranslations } from 'next-intl/server';
import FreeGameSelect from './FreeGameSelect';
import { getKeyValueNumber } from '@/lib/keyValue';
import { FREE_TIER_MAX_SERVERS } from '@/app/GlobalConstants';
import { auth } from '@/auth';
import { headers } from 'next/headers';

async function FreeGameServerPage() {
    const t = await getTranslations('freeServer');

    const session = await auth.api.getSession({
        headers: await headers(),
    });

    if (!session?.user) {
        throw new Error('User not authenticated');
    }

    const [data, freeTierConfig, userFreeServers] = await Promise.all([
        prisma.gameData.findMany({
            select: { id: true, name: true },
        }),
        getFreeTierConfigCached(),
        prisma.gameServer.count({
            where: {
                userId: session.user.id,
                freeServer: true,
            },
        }),
    ]);

    const games = data.map((game) => {
        const imgName = `${game.name.toLowerCase()}.webp`;

        return {
            ...game,
            images: {
                dark: `/images/dark/games/icons/${imgName}`,
                light: `/images/light/games/icons/${imgName}`,
            },
        };
    });

    return (
        <div className="md:px-6 py-4">
            <div className="text-center mb-4">
                <h1 className="text-2xl md:text-4xl font-bold mb-1 flex items-center justify-center gap-2">
                    <span className="text-2xl">🎁</span>
                    {t('buttonText')}
                </h1>
                <p className="text-sm md:text-base text-muted-foreground max-w-2xl mx-auto">
                    {t('buttonDescription')}
                </p>
            </div>
            <FreeGameSelect
                games={games}
                freeTierConfig={freeTierConfig}
                userFreeServers={userFreeServers}
            />
        </div>
    );
}

export default FreeGameServerPage;

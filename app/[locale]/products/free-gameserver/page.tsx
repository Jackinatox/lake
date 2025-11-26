'use server';

import { auth } from '@/auth';
import { getFreeTierConfigCached } from '@/lib/free-tier/config';
import { getTranslations } from 'next-intl/server';
import { headers } from 'next/headers';
import FreeGameSelect from './FreeGameSelect';
import prisma from '@/lib/prisma';

async function FreeGameServerPage() {
    const t = await getTranslations('freeServer');

    const session = await auth.api.getSession({
        headers: await headers(),
    });

    const promise = session?.user
        ? prisma.gameServer.count({
              where: {
                  userId: session.user.id,
                  freeServer: true,
                  status: {
                      notIn: ['CREATION_FAILED', 'DELETED'],
                  },
              },
          })
        : Promise.resolve(null);

    const [data, freeTierConfig, userFreeServers] = await Promise.all([
        prisma.gameData.findMany({
            select: { id: true, name: true },
        }),
        getFreeTierConfigCached(),
        promise,
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
                userFreeServers={userFreeServers ?? undefined}
            />
        </div>
    );
}

export default FreeGameServerPage;

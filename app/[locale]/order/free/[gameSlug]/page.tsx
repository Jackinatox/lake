import { auth } from '@/auth';
import GameNotFound from '@/components/booking2/GameNotFound';
import { FREE_TIER_MAX_SERVERS } from '@/app/GlobalConstants';
import { fetchGameBySlug } from '@/lib/actions';
import { createPublicMetadata, getMetadataCopy } from '@/lib/metadata';
import { getKeyValueNumber } from '@/lib/keyValue';
import prisma from '@/lib/prisma';
import type { Metadata } from 'next';
import { headers } from 'next/headers';
import { cache } from 'react';
import FreeGameServerBooking, { FreeServerStats } from './FreeGameBookingSlug';

const getFreeGamePageGame = cache(async (gameSlug: string) => fetchGameBySlug(gameSlug));

export async function generateMetadata({
    params,
}: {
    params: Promise<{ locale: string; gameSlug: string }>;
}): Promise<Metadata> {
    const { locale, gameSlug } = await params;
    const copy = getMetadataCopy(locale);
    const game = await getFreeGamePageGame(gameSlug);

    if (!game) {
        return createPublicMetadata({
            locale,
            path: '/order/free',
            title: copy.freeOrderIndexTitle,
            description: copy.freeOrderIndexDescription,
        });
    }

    return createPublicMetadata({
        locale,
        path: `/order/free/${gameSlug}`,
        title: copy.freeGameTitle(game.name),
        description: copy.freeGameDescription(game.name),
        keywords: [
            `free ${game.name} server`,
            `${game.name} free hosting`,
            `${game.name} gameserver`,
        ],
    });
}

export default async function FreeGameServerBySlugPage({
    params,
}: {
    params: Promise<{ locale: string; gameSlug: string }>;
}) {
    const { gameSlug } = await params;

    const [session, game, maxFreeServers] = await Promise.all([
        auth.api.getSession({ headers: await headers() }),
        getFreeGamePageGame(gameSlug),
        getKeyValueNumber(FREE_TIER_MAX_SERVERS),
    ]);

    if (!game) {
        return <GameNotFound linkBackTo="/order" />;
    }

    const currentFreeServers = session?.user
        ? await prisma.gameServer.count({
              where: {
                  userId: session.user.id,
                  type: 'FREE',
                  status: {
                      notIn: ['CREATION_FAILED', 'DELETED'],
                  },
              },
          })
        : 0;

    const stats: FreeServerStats = {
        currentFreeServers,
        maxFreeServers,
        creationNotAllowedReason: session?.user
            ? currentFreeServers >= maxFreeServers
                ? 'TOO_MANY_SERVERS'
                : null
            : 'NOT_LOGGED_IN',
    };

    return (
        <div className="w-full max-w-5xl mx-auto">
            <FreeGameServerBooking game={game} stats={stats} gameSlug={gameSlug} />
        </div>
    );
}

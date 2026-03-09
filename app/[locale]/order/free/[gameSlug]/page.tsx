import { auth } from '@/auth';
import GameNotFound from '@/components/booking2/GameNotFound';
import { FREE_TIER_MAX_SERVERS } from '@/app/GlobalConstants';
import { fetchGameBySlug } from '@/lib/actions';
import { getKeyValueNumber } from '@/lib/keyValue';
import prisma from '@/lib/prisma';
import { headers } from 'next/headers';
import FreeGameServerBooking, { FreeServerStats } from './FreeGameBookingSlug';

export default async function FreeGameServerBySlugPage({
    params,
}: {
    params: Promise<{ gameSlug: string }>;
}) {
    const { gameSlug } = await params;

    const [session, game, maxFreeServers] = await Promise.all([
        auth.api.getSession({ headers: await headers() }),
        fetchGameBySlug(gameSlug),
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
        <div className="w-full min-h-screen">
            <div className="w-full max-w-5xl mx-auto px-0 md:px-6">
                <FreeGameServerBooking game={game} stats={stats} gameSlug={gameSlug} />
            </div>
        </div>
    );
}

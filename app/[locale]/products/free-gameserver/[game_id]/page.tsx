import { fetchGames } from '@/lib/actions';
import { getTranslations } from 'next-intl/server';
import FreeGameServerBooking, { FreeServerStats } from './FreeGameBooking';
import GameNotFound from '@/components/booking2/GameNotFound';
import { auth } from '@/auth';
import { headers } from 'next/headers';
import { getKeyValueNumber } from '@/lib/keyValue';
import { FREE_TIER_MAX_SERVERS } from '@/app/GlobalConstants';
import prisma from '@/lib/prisma';


export default async function FreeGameServerPage(
    props: PageProps<'/[locale]/products/free-gameserver/[game_id]'>,
) {
    const t = await getTranslations('freeServer');
    const params = await props.params;
    const gameId = Number.parseInt(params.game_id, 10);

    // Fetch session and run all independent queries in parallel
    const [session, game, maxFreeServers] = await Promise.all([
        auth.api.getSession({ headers: await headers() }),
        fetchGames(gameId),
        getKeyValueNumber(FREE_TIER_MAX_SERVERS),
    ]);

    if (!game) {
        return <GameNotFound linkBackTo="/products/free-gameserver" />;
    }

    // Only query free server count if user is logged in
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
                <FreeGameServerBooking game={game} stats={stats} />
            </div>
        </div>
    );
}

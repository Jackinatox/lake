import { fetchGames } from '@/lib/actions';
import { getTranslations } from 'next-intl/server';
import FreeGameServerBooking from './FreeGameBooking';
import GameNotFound from '@/components/booking2/GameNotFound';

export default async function FreeGameServerPage(
    props: PageProps<'/[locale]/products/free-gameserver/[game_id]'>,
) {
    const t = await getTranslations('freeServer');

    const params = await props.params;
    const gameId = Number.parseInt(params.game_id, 10);

    const game = await fetchGames(gameId);

    if (!game) {
        return <GameNotFound linkBackTo="/products/free-gameserver" />;
    }

    return (
        <>
            <FreeGameServerBooking game={game} />
        </>
    );
}

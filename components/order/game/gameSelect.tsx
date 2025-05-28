import React from 'react';
import GameCard from './gameCard';
import { createClient } from '@/utils/supabase/server';


async function GameSelect() {
    const supabase = await createClient();

    const { data, error } = await supabase.from('GameData').select("*");

    const games = data.map(game => {
        const imgName = `${game.name.toLowerCase()}.jpg`;
        const { data: imgUrl } = supabase.storage.from('images').getPublicUrl(imgName);

        return {
            ...game,
            imageUrl: imgUrl.publicUrl
        }
    })

    return (
        <>
            <div className='flex justify-center'>
                <h2 className="text-3xl font-bold">Games</h2>
            </div>
            <div className="flex flex-wrap gap-4 justify-center">
                {games.map((game) => {
                    return (
                        <GameCard key={game.id} card={game} imgPath={game.imageUrl} />
                    );
                })}
            </div>
        </>
    );
}

export default GameSelect;

"use server"

import React from 'react';
import GameCard from './gameCard';
import { prisma } from '@/prisma';


async function GameSelect() {
    const data = await prisma.gameData.findMany();

    const games = data.map(game => {
        const imgName = `${game.name.toLowerCase()}.webp`;

        return {
            ...game,
            images: {
                dark: `/images/dark/games/icons/${imgName}`,
                light: `/images/light/games/icons/${imgName}`
            },
            // ToDo: Add Images 
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
                        <GameCard key={game.id} card={{
                            id: game.id.toString(),
                            name: game.name ?? ''
                        }} images={game.images} />
                    );
                })}
            </div>
        </>
    );
}

export default GameSelect;

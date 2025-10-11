"use server"

import GameCard from '@/components/order/game/gameCard';
import { prisma } from '@/prisma'
import React from 'react'

interface ChangeGameSelectProps {
    serverId: string
}

async function ChangeGameSelect({ serverId }: ChangeGameSelectProps) {
    const data = await prisma.gameData.findMany({
        select: {
            id: true,
            name: true,
        }
    });

    const games = data.map(game => {
        const imgName = `${game.name.toLowerCase()}.webp`;

        return {
            ...game,
            images: {
                dark: `/images/dark/games/icons/${imgName}`,
                light: `/images/light/games/icons/${imgName}`
            },
        }
    })

    return (
        <>
            <div className='flex justify-center'>
                <h2 className="text-3xl font-bold">Choose a Game to Install</h2>
            </div>
            <div className="flex flex-wrap gap-4 justify-center">
                {games.map((game) => {
                    return (
                        <GameCard key={game.id} card={{
                            link: `/gameserver/${serverId}/changeGame/${game.id.toString()}`,
                            name: game.name ?? ''
                        }} images={game.images} />
                    );
                })}
            </div>
        </>
    );
}

export default ChangeGameSelect
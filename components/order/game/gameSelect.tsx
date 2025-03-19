import React from 'react';
import GameCard from './gameCard';
import { Card } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';

const game = [
    {
        id: '1',
        name: 'minecraft',
        fullName: 'Minecraft',
        img: '',
        desc: 'Minecraft is a sandbox video game developed and published by Mojang Studios. It is a survival game set in a vast open world filled with creatures, natural landscapes,',
    },
    {
        id: 2,
        name: 'satisfactory',
        fullName: 'Satisfactory',
        img: '',
        desc: 'Satisfactory is a survival game developed and published by Paradox Studios. It is a first-person survival game set in a sandbox environment,',
    },
];

function GameSelect() {
    return (
        <>
            <div className='flex justify-center'>
                <h2 className="text-3xl font-bold">Games</h2>
            </div>
            <div className="flex flex-wrap gap-4 justify-center">
                {game.map((card) => {
                    const imgPath = "/images/games/" + card.name + ".jpg";
                    return (
                        <GameCard key={card.id} card={card} imgPath={imgPath} />
                    );
                })}
            </div>
        </>
    );
}

export default GameSelect;

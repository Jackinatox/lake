import React from 'react';
import GameCard from './gameCard';
import { Card } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';

const game = [
    {
        id: '1',
        name: 'minecraft',
        fullName: 'Minecraft',
        img: '/images/games/minecraft.jpg',
        link: '',
    },
    {
        id: 2,
        name: 'satisfactory',
        fullName: 'Satisfactory',
        img: '/images/games/satisfactory.jpg',
        link: '',
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
                    return (
                        <GameCard key={card.id} card={card} imgPath={card.img} />
                    );
                })}
            </div>
        </>
    );
}

export default GameSelect;

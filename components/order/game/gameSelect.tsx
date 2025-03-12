import React from 'react';
import { Box } from '@mui/material';
import GameCard from './gameCard';

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
        <Box display="flex" flexWrap="wrap" gap={3}>
            {game.map((card) => {
                const imgPath = "/images/games/" + card.name + ".jpg";
                return (
                    <GameCard key={card.id} card={card} imgPath={imgPath} />
                );
            })}
        </Box>
    );
}

export default GameSelect;

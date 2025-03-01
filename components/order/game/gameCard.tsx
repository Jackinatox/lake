"use client"

import React from 'react';
import { Box, Typography, Link } from '@mui/material';
import { styled } from '@mui/system';

const Container = styled(Box)({
    overflow: 'hidden',
    transition: 'transform 0.3s ease',
    '&:hover': {
        transform: 'scale(1.075)',
    },
});

const Image = styled('img')({
    display: 'block',
    width: '100%',
});

const Text = styled(Typography)({
    marginTop: '1rem',
});

function GameCard({ card, imgPath }) {
    return (
        <Box key={card.id} width={300}>
            <Link href={`gameserver/${card.name}`} underline="none" color="">

                <Container>
                    <Image src={imgPath} alt={card.name} />
                    <Text variant="h5" gutterBottom>
                        {card.fullName}
                    </Text>
                </Container>
            </Link>
            {"/images/games/" + card.name + ".jpg"}
        </Box>
    )
}

export default GameCard;
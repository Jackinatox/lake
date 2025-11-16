'use server';

import React from 'react';
import { prisma } from '@/prisma';
import { getTranslations } from 'next-intl/server';
import FreeGameSelect from './FreeGameSelect';
import { getFreeTierConfig } from '@/lib/free-tier/config';

async function FreeGameServerPage() {
    const t = await getTranslations('freeServer');
    
    const [data, freeTierConfig] = await Promise.all([
        prisma.gameData.findMany({
            select: {id: true, name: true},
        }),
        getFreeTierConfig(),
    ]);

    const games = data.map((game) => {
        const imgName = `${game.name.toLowerCase()}.webp`;

        return {
            ...game,
            images: {
                dark: `/images/dark/games/icons/${imgName}`,
                light: `/images/light/games/icons/${imgName}`,
            },
        };
    });

    return (
        <div className="container mx-auto px-4 py-8">
            <div className="text-center mb-8">
                <div className="inline-flex items-center justify-center p-2 bg-gradient-to-r from-green-500 to-emerald-600 rounded-full mb-4">
                    <span className="text-4xl">🎁</span>
                </div>
                <h1 className="text-4xl md:text-5xl font-bold mb-4">
                    {t('buttonText')}
                </h1>
                <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                    {t('buttonDescription')}
                </p>
            </div>
            <FreeGameSelect games={games} freeTierConfig={freeTierConfig} />
        </div>
    );
}

export default FreeGameServerPage;

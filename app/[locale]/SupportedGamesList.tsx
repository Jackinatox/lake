import Image from 'next/image';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ChevronRight } from 'lucide-react';
import React from 'react';
import { getTranslations } from 'next-intl/server';

export type Game = {
    id: string;
    name: string;
    images: {
        light: string;
        dark: string;
    };
};
type SupportedGamesListProps = {
    supportedGames: Array<Game>;
};

export async function SupportedGamesList({ supportedGames }: SupportedGamesListProps) {
    const t = await getTranslations('landingpage');

    return (
        <div className="bg-background/80 backdrop-blur-sm rounded-xl p-4 md:p-6 border w-full">
            <h2 className="text-2xl font-bold mb-4 md:mb-6">{t('supportedGames')}</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 gap-3">
                {supportedGames.map((game) => (
                    <Link href={`/booking2/${game.id}`} key={game.id} className="block">
                        <div className="flex items-center gap-3 md:gap-4 p-3 md:p-4 rounded-lg hover:bg-muted transition-all hover:scale-[1.02] border border-transparent hover:border-primary/20">
                            <div className="relative h-14 w-14 md:h-12 md:w-12 rounded-md overflow-hidden border shrink-0">
                                <Image
                                    src={game.images.light}
                                    alt={`${game.name} Icon`}
                                    fill
                                    className="object-cover block dark:hidden"
                                />
                                <Image
                                    src={game.images.dark}
                                    alt={`${game.name} Icon`}
                                    fill
                                    className="object-cover hidden dark:block"
                                />
                            </div>
                            <span className="font-medium text-base md:text-sm flex-1">
                                {game.name}
                            </span>
                            <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />
                        </div>
                    </Link>
                ))}
            </div>
            <Link href="/products/gameserver" className="block mt-4 md:mt-6">
                <Button variant="link" className="flex items-center gap-1 p-0 h-auto">
                    {t('showAllGames')}
                    <ChevronRight className="h-4 w-4" />
                </Button>
            </Link>
        </div>
    );
}

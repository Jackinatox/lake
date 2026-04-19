'use client';

import { Card, CardContent } from '@/components/ui/card';
import { ThemeImage } from '@/components/ui/theme-image';
import Link from 'next/link';

interface GameCardProps {
    card: {
        link: string;
        name: string;
    };
    imageSrc: string;
}

export default function GameCard({ card, imageSrc }: GameCardProps) {
    return (
        <Link href={card.link} className="block w-full md:w-[280px]">
            <Card className="overflow-hidden transition-transform duration-300 hover:scale-[1.075] shadow-lg md:hover:scale-100 hover:bg-gradient-to-r hover:from-primary/5 hover:to-transparent">
                {/* Mobile: horizontal layout with image on left */}
                <div className="md:hidden flex h-20 bg-gradient-to-r from-background via-background to-primary/5">
                    <div className="relative w-20 flex-shrink-0">
                        <ThemeImage
                            src={imageSrc || '/placeholder.svg'}
                            alt={card.name}
                            fill
                            className="object-cover"
                        />
                    </div>
                    <CardContent className="flex items-center justify-start px-4 py-2">
                        <h3 className="text-lg font-semibold line-clamp-2 text-primary/90">
                            {card.name}
                        </h3>
                    </CardContent>
                </div>

                {/* Desktop: vertical layout */}
                <div className="hidden md:block">
                    <div className="relative w-full aspect-square">
                        <ThemeImage
                            src={imageSrc || '/placeholder.svg'}
                            alt={card.name}
                            fill
                            className="object-cover rounded-t-lg"
                        />
                    </div>
                    <CardContent className="pt-4">
                        <h3 className="text-xl font-semibold">{card.name}</h3>
                    </CardContent>
                </div>
            </Card>
        </Link>
    );
}

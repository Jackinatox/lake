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
        <Link href={card.link} className="block w-full">
            <Card className="overflow-hidden transition-transform duration-300 hover:scale-[1.075] shadow-lg md:hover:scale-100 hover:bg-gradient-to-r hover:from-primary/5 hover:to-transparent">
                {/* Vertical layout for all sizes */}
                <div className="block">
                    <div className="relative w-full aspect-square">
                        <ThemeImage
                            src={imageSrc || '/placeholder.svg'}
                            alt={card.name}
                            fill
                            className="object-cover rounded-t-lg"
                        />
                    </div>
                    <CardContent className="pt-4">
                        <h3 className="text-sm md:text-base font-semibold">{card.name}</h3>
                    </CardContent>
                </div>
            </Card>
        </Link>
    );
}

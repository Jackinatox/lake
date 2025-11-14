'use client';

import Link from 'next/link';
import Image from 'next/image';
import { Card, CardContent } from '@/components/ui/card';

interface GameCardProps {
    card: {
        link: string;
        name: string;
    };
    images: {
        light: string;
        dark: string;
    };
}

export default function GameCard({ card, images }: GameCardProps) {
    return (
        <Link href={card.link} className="block w-[280px]">
            <Card className="overflow-hidden transition-transform duration-300 hover:scale-[1.075] shadow-lg">
                <div className="relative w-full aspect-square">
                    <Image
                        src={images.light || '/placeholder.svg'}
                        alt={card.name}
                        fill
                        className="object-cover rounded-t-lg block dark:hidden"
                    />
                    <Image
                        src={images.dark || '/placeholder.svg'}
                        alt={card.name}
                        fill
                        className="object-cover rounded-t-lg hidden dark:block"
                    />
                </div>
                <CardContent className="pt-4">
                    <h3 className="text-xl font-semibold">{card.name}</h3>
                </CardContent>
            </Card>
        </Link>
    );
}

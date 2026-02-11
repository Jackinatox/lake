import prisma from '@/lib/prisma';
import { notFound } from 'next/navigation';
import { Suspense } from 'react';
import PackageBookingClient from './PackageBookingClient';
import type { Game } from '@/models/config';

export default async function PackageOrderPage({
    params,
}: {
    params: Promise<{ gameSlug: string; packageId: string }>;
}) {
    const { gameSlug, packageId: packageIdStr } = await params;
    const packageId = Number.parseInt(packageIdStr, 10);

    if (Number.isNaN(packageId)) {
        notFound();
    }

    const [game, packageDb] = await Promise.all([
        prisma.gameData.findUnique({
            where: { slug: gameSlug, enabled: true },
            select: { id: true, name: true, data: true, slug: true },
        }),
        prisma.package.findUnique({
            where: { id: packageId, enabled: true },
            include: {
                location: {
                    include: { cpu: true, ram: true },
                },
            },
        }),
    ]);

    if (!game || !packageDb) {
        notFound();
    }

    const gameData: Game = {
        id: game.id,
        name: game.name,
        data: game.data,
    };

    const pricing = {
        cpuPricePerCore: packageDb.location.cpu.pricePerCore,
        ramPricePerGb: packageDb.location.ram.pricePerGb,
    };

    return (
        <Suspense>
            <PackageBookingClient
                packageData={packageDb}
                game={gameData}
                gameSlug={gameSlug}
                pricing={pricing}
            />
        </Suspense>
    );
}

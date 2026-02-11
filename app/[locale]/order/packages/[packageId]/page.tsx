import prisma from '@/lib/prisma';
import { calculateNew } from '@/lib/GlobalFunctions/paymentLogic';
import { notFound } from 'next/navigation';
import { Suspense } from 'react';
import PackageGamesClient from './PackageGamesClient';

const PACKAGE_DISPLAY_DAYS = 30;

export default async function PackageGamesPage({
    params,
}: {
    params: Promise<{ packageId: string }>;
}) {
    const { packageId: packageIdStr } = await params;
    const packageId = Number.parseInt(packageIdStr, 10);

    if (Number.isNaN(packageId)) {
        notFound();
    }

    const [packageDb, games] = await Promise.all([
        prisma.package.findUnique({
            where: { id: packageId, enabled: true },
            include: {
                location: {
                    include: { cpu: true, ram: true },
                },
            },
        }),
        prisma.gameData.findMany({
            select: { id: true, name: true, slug: true },
            where: { enabled: true },
            orderBy: { sorting: 'asc' },
        }),
    ]);

    if (!packageDb) {
        notFound();
    }

    const price = calculateNew(
        packageDb.location,
        packageDb.cpuPercent,
        packageDb.ramMB,
        PACKAGE_DISPLAY_DAYS,
    );

    const packageSummary = {
        id: packageDb.id,
        name: packageDb.name,
        cpuPercent: packageDb.cpuPercent,
        ramMB: packageDb.ramMB,
        diskMB: packageDb.diskMB,
        backups: packageDb.backups,
        locationName: packageDb.location.name,
        priceCents: price.totalCents,
    };

    const gameCards = games.map((game) => {
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
        <Suspense>
            <PackageGamesClient
                packageSummary={packageSummary}
                games={gameCards}
            />
        </Suspense>
    );
}

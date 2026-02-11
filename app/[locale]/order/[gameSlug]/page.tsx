import prisma from '@/lib/prisma';
import { notFound } from 'next/navigation';
import GameLandingClient from './GameLandingClient';
import { calculateNew } from '@/lib/GlobalFunctions/paymentLogic';

const PACKAGE_DISPLAY_DAYS = 30;

export default async function GameLandingPage({
    params,
}: {
    params: Promise<{ gameSlug: string }>;
}) {
    const { gameSlug } = await params;

    const [game, packages, freeLocations] = await Promise.all([
        prisma.gameData.findUnique({
            where: { slug: gameSlug, enabled: true },
            include: {
                hardwareRecommendations: {
                    orderBy: { sorting: 'asc' },
                },
            },
        }),
        prisma.package.findMany({
            where: { enabled: true },
            include: {
                location: {
                    include: { cpu: true, ram: true },
                },
            },
            orderBy: { sorting: 'asc' },
        }),
        prisma.location.findMany({
            where: { freeServer: true, enabled: true },
            select: { id: true },
        }),
    ]);

    if (!game) {
        notFound();
    }

    const hasFreeServers = freeLocations.length > 0;
    const recommendation = game.hardwareRecommendations[0] ?? null;

    // Precompute package prices for display
    const packagesWithPrices = packages.map((pkg) => {
        const price = calculateNew(pkg.location, pkg.cpuPercent, pkg.ramMB, PACKAGE_DISPLAY_DAYS);
        return {
            id: pkg.id,
            name: pkg.name,
            description: pkg.description,
            imageName: pkg.imageName,
            diskMB: pkg.diskMB,
            ramMB: pkg.ramMB,
            cpuPercent: pkg.cpuPercent,
            backups: pkg.backups,
            locationName: pkg.location.name,
            priceCents: price.totalCents,
            preselected: recommendation?.preselectedPackageId === pkg.id,
        };
    });

    return (
        <GameLandingClient
            game={{
                id: game.id,
                name: game.name,
                slug: game.slug,
            }}
            packages={packagesWithPrices}
            hasFreeServers={hasFreeServers}
            recommendation={
                recommendation
                    ? {
                          recCpuPercent: recommendation.recCpuPercent,
                          recRamMb: recommendation.recRamMb,
                      }
                    : null
            }
        />
    );
}

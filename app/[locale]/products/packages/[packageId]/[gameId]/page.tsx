import PackageBooking from '@/components/packages/PackageBooking';
import { calculateNew } from '@/lib/GlobalFunctions/paymentLogic';
import prisma from '@/lib/prisma';
import { Game } from '@/models/config';
import { notFound } from 'next/navigation';

const PACKAGE_DURATION_DAYS = 30;

async function page(params: PageProps<'/[locale]/products/packages/[packageId]/[gameId]'>) {
    const awaitedParams = await params.params;
    const packageId = Number.parseInt(awaitedParams.packageId, 10);
    const gameId = Number.parseInt(awaitedParams.gameId, 10);

    if (Number.isNaN(packageId) || Number.isNaN(gameId)) {
        notFound();
    }

    const [packageDb, gameData] = await Promise.all([
        prisma.package.findUnique({
            where: { id: packageId, enabled: true },
            include: { 
                location: {
                    include: { cpu: true, ram: true }
                }
            },
        }),
        prisma.gameData.findUnique({
            where: { id: gameId, enabled: true },
        }),
    ]);

    if (!packageDb || !gameData) {
        notFound();
    }

    // Calculate price
    const price = calculateNew(
        packageDb.location,
        packageDb.cpuPercent,
        packageDb.ramMB,
        PACKAGE_DURATION_DAYS
    );

    // Transform gameData to Game type expected by components
    const game: Game = {
        id: gameData.id,
        name: gameData.name,
        data: gameData.data,
    };

    return (
        <PackageBooking 
            packageData={packageDb} 
            game={game}
            priceCents={price.totalCents}
        />
    );
}

export default page;

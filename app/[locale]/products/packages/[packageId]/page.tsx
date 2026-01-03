import PackageGameSelectorWrapper from '@/components/packages/PackageGameSelectorWrapper';
import { calculateNew } from '@/lib/GlobalFunctions/paymentLogic';
import prisma from '@/lib/prisma';
import { notFound } from 'next/navigation';

const PACKAGE_DURATION_DAYS = 30;

async function page(params: PageProps<'/[locale]/products/packages/[packageId]'>) {
    const packageId = (await params.params).packageId;
    const id = Number.parseInt(packageId, 10);

    if (Number.isNaN(id)) {
        notFound();
    }

    const [packageDb, games] = await Promise.all([
        prisma.package.findUnique({
            where: { id: id, enabled: true },
            include: {
                location: {
                    include: { cpu: true, ram: true },
                },
            },
        }),
        prisma.gameData.findMany({
            select: { id: true, name: true },
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
        PACKAGE_DURATION_DAYS,
    );

    return (
        <PackageGameSelectorWrapper
            packageData={packageDb}
            games={games}
            packageId={id}
            priceCents={price.totalCents}
        />
    );
}

export default page;

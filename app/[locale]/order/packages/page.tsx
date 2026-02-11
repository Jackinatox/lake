import prisma from '@/lib/prisma';
import { calculateNew } from '@/lib/GlobalFunctions/paymentLogic';
import PackagesListClient from './PackagesListClient';

const PACKAGE_DISPLAY_DAYS = 30;

export default async function PackagesPage() {
    const packages = await prisma.package.findMany({
        where: { enabled: true },
        include: {
            location: {
                include: { cpu: true, ram: true },
            },
        },
        orderBy: { sorting: 'asc' },
    });

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
        };
    });

    return <PackagesListClient packages={packagesWithPrices} />;
}

import prisma from '@/lib/prisma';
import { notFound } from 'next/navigation';

async function page(params: PageProps<'/[locale]/products/packages/[packageId]'>) {
    const packageId = (await params.params).packageId;
    const id = Number.parseInt(packageId, 10);

    if (Number.isNaN(id)) {
        notFound();
    }

    const [packageDb, games] = await Promise.all([
        prisma.package.findUnique({
            where: { id: id, enabled: true },
        }),
        prisma.gameData.findMany({
            select: { id: true, name: true },
            where: { enabled: true },
        }),
    ]);

    if (!packageDb) {
        notFound();
    }

    return <div>{JSON.stringify(packageDb, null, 2)}</div>;
}

export default page;

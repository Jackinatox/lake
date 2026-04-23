import { Suspense } from 'react';
import { fetchPerformanceGroups } from '@/lib/actions';
import prisma from '@/lib/prisma';
import ConfigureHardwareClient from './ConfigureHardwareClient';

export default async function ConfigureHardwarePage() {
    const [performanceGroups, resourceTiers] = await Promise.all([
        fetchPerformanceGroups(),
        prisma.resourceTier.findMany({
            where: { enabled: true },
            orderBy: { sorting: 'asc' },
            select: {
                id: true,
                name: true,
                diskMB: true,
                backups: true,
                ports: true,
                priceCents: true,
                enabled: true,
            },
        }),
    ]);

    if (!performanceGroups || performanceGroups.length === 0) {
        return (
            <div className="p-8 text-center text-muted-foreground">
                No hardware options available.
            </div>
        );
    }

    return (
        <Suspense>
            <ConfigureHardwareClient
                performanceGroups={performanceGroups}
                resourceTiers={resourceTiers}
            />
        </Suspense>
    );
}

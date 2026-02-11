import { Suspense } from 'react';
import { fetchPerformanceGroups } from '@/lib/actions';
import HardwareFirstClient from './HardwareFirstClient';

export default async function HardwareFirstPage() {
    const performanceGroups = await fetchPerformanceGroups();

    if (!performanceGroups || performanceGroups.length === 0) {
        return <div className="p-8 text-center text-muted-foreground">No hardware options available.</div>;
    }

    return (
        <Suspense>
            <HardwareFirstClient performanceGroups={performanceGroups} />
        </Suspense>
    );
}

'use client';

import PackageGameSelector from './PackageGameSelector';

interface PackageData {
    id: number;
    name: string;
    description: string | null;
    imageName: string;
    diskMB: number;
    ramMB: number;
    cpuPercent: number;
    backups: number;
    allocations: number;
    location: {
        id: number;
        name: string;
    };
}

interface GameOption {
    id: number;
    name: string;
}

interface PackageGameSelectorWrapperProps {
    packageData: PackageData;
    games: GameOption[];
    packageId: number;
    priceCents: number;
}

export default function PackageGameSelectorWrapper({
    packageData,
    games,
    packageId,
    priceCents,
}: PackageGameSelectorWrapperProps) {
    return (
        <PackageGameSelector
            packageData={packageData}
            games={games}
            packageId={packageId}
            priceCents={priceCents}
        />
    );
}

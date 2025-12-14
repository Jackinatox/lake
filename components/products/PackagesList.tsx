import { PackageWithCPURAM } from '@/models/prisma';
import { Database } from 'lucide-react';
import PackageCard from './PackageCard';

interface PackagesListProps {
    packages: PackageWithCPURAM[];
    columns?: 1 | 2 | 3 | 4;
}

export default function PackagesList({ packages, columns = 3 }: PackagesListProps) {
    const gridColsClass = {
        1: 'md:grid-cols-1',
        2: 'md:grid-cols-2',
        3: 'md:grid-cols-3',
        4: 'md:grid-cols-4',
    }[columns];

    return (
        <>
            {packages.length === 0 ? (
                <div className="text-center py-20">
                    <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-muted mb-6">
                        <Database className="h-10 w-10 text-muted-foreground" />
                    </div>
                    <h2 className="text-2xl font-semibold mb-2">No Packages Yet</h2>
                    <p className="text-muted-foreground">
                        Check back soon for pre-configured packages
                    </p>
                </div>
            ) : (
                <div className="flex justify-center">
                    <div className={`grid grid-cols-1 ${gridColsClass} gap-6`}>
                        {packages.map((pkg) => {
                            return <PackageCard key={pkg.id} pkg={pkg} />;
                        })}
                    </div>
                </div>
            )}
        </>
    );
}

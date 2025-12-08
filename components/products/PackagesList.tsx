import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { calculateNew } from '@/lib/GlobalFunctions/paymentLogic';
import { ArrowRight, Cpu, Database, HardDrive, MapPin, MemoryStick } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';

const PACKAGE_DURATION_DAYS = 30;

export default function PackagesList({ packages }: { packages: any[] }) {
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
                <div className="flex flex-wrap justify-center items-center gap-6">
                    {packages.map((pkg) => {
                        const imageBase = pkg.imageName.toLowerCase();
                        const price = calculateNew(
                            pkg.location,
                            pkg.cpuPercent,
                            pkg.ramMB,
                            PACKAGE_DURATION_DAYS,
                        );

                        return (
                            <Link
                                key={pkg.id}
                                href={`/products/packages/${pkg.id}`}
                                className="group block w-full max-w-md"
                            >
                                <div className="relative h-full rounded-2xl border bg-card shadow-sm transition-all duration-300 hover:shadow-xl hover:border-muted-foreground/20 overflow-hidden">
                                    <div className="relative h-36 md:h-44">
                                        <Image
                                            src={`/images/light/games/icons/${imageBase}`}
                                            alt={pkg.imageName}
                                            fill
                                            className="object-cover dark:hidden"
                                        />
                                        <Image
                                            src={`/images/dark/games/icons/${imageBase}`}
                                            alt={pkg.imageName}
                                            fill
                                            className="object-cover hidden dark:block"
                                        />
                                        <div className="absolute inset-0 bg-linear-to-t from-card via-card/60 to-transparent" />
                                        <Badge
                                            variant="secondary"
                                            className="absolute top-4 right-4 shadow-sm"
                                        >
                                            {pkg.imageName}
                                        </Badge>
                                    </div>

                                    <div className="p-5 md:p-6 space-y-4">
                                        <div>
                                            <h3 className="text-xl md:text-2xl font-bold mb-1 group-hover:text-primary transition-colors">
                                                {pkg.name}
                                            </h3>
                                            {pkg.description && (
                                                <p className="text-sm text-muted-foreground line-clamp-2">
                                                    {pkg.description}
                                                </p>
                                            )}
                                        </div>

                                        <div className="grid grid-cols-2 gap-3">
                                            <div className="flex items-center gap-2.5 p-2.5 rounded-lg bg-blue-500/10">
                                                <Cpu className="h-5 w-5 text-blue-500" />
                                                <div>
                                                    <div className="text-sm font-semibold">
                                                        {(pkg.cpuPercent / 100).toFixed(1)}
                                                    </div>
                                                    <div className="text-xs text-muted-foreground">
                                                        vCPU
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-2.5 p-2.5 rounded-lg bg-purple-500/10">
                                                <MemoryStick className="h-5 w-5 text-purple-500" />
                                                <div>
                                                    <div className="text-sm font-semibold">
                                                        {(pkg.ramMB / 1024).toFixed(1)} GB
                                                    </div>
                                                    <div className="text-xs text-muted-foreground">
                                                        RAM
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-2.5 p-2.5 rounded-lg bg-green-500/10">
                                                <HardDrive className="h-5 w-5 text-green-500" />
                                                <div>
                                                    <div className="text-sm font-semibold">
                                                        {(pkg.diskMB / 1024).toFixed(0)} GB
                                                    </div>
                                                    <div className="text-xs text-muted-foreground">
                                                        Storage
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-2.5 p-2.5 rounded-lg bg-orange-500/10">
                                                <Database className="h-5 w-5 text-orange-500" />
                                                <div>
                                                    <div className="text-sm font-semibold">
                                                        {pkg.backups}
                                                    </div>
                                                    <div className="text-xs text-muted-foreground">
                                                        Backups
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="flex items-center justify-between pt-3 border-t">
                                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                                <MapPin className="h-4 w-4" />
                                                <span>{pkg.location.name}</span>
                                            </div>
                                            <div className="flex items-center gap-3">
                                                <div className="text-right">
                                                    <div className="text-lg font-bold text-primary">
                                                        €{(price.totalCents / 100).toFixed(2)}
                                                    </div>
                                                    <div className="text-xs text-muted-foreground">
                                                        /month
                                                    </div>
                                                </div>
                                                <Button
                                                    size="sm"
                                                    variant="ghost"
                                                    className="group-hover:bg-primary group-hover:text-primary-foreground transition-colors"
                                                >
                                                    Select
                                                    <ArrowRight className="ml-1 h-4 w-4 group-hover:translate-x-0.5 transition-transform" />
                                                </Button>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </Link>
                        );
                    })}
                </div>
            )}
        </>
    );
}

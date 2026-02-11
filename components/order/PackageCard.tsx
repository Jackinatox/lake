'use client';

import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArrowRight, Cpu, Database, HardDrive, MapPin, MemoryStick, Star } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { formatMBToGiB } from '@/lib/GlobalFunctions/ptResourceLogic';
import { formatVCoresFromPercent } from '@/lib/GlobalFunctions/formatVCores';

export interface PackageDisplay {
    id: number;
    name: string;
    description: string | null;
    imageName: string;
    diskMB: number;
    ramMB: number;
    cpuPercent: number;
    backups: number;
    locationName: string;
    priceCents: number;
    preselected?: boolean;
}

interface PackageCardProps {
    pkg: PackageDisplay;
    /** The href to navigate to when clicking the card */
    href: string;
}

export default function PackageCard({ pkg, href }: PackageCardProps) {
    return (
        <Link href={href} className="group block">
            <div className="relative h-full rounded-2xl border bg-card shadow-sm transition-all duration-300 hover:shadow-xl hover:border-muted-foreground/20 overflow-hidden">
                {/* Background Image */}
                <div className="absolute inset-0 z-0">
                    <Image
                        src={`/images/light/packages/${pkg.imageName}`}
                        alt={pkg.name}
                        fill
                        className="object-cover dark:hidden blur-[1.5px]"
                    />
                    <Image
                        src={`/images/dark/packages/${pkg.imageName}`}
                        alt={pkg.name}
                        fill
                        className="object-cover hidden dark:block blur-[1.5px]"
                    />
                    <div className="absolute inset-0 bg-background/40" />
                </div>

                {/* Content */}
                <div className="relative z-10 p-5 md:p-6 space-y-4 h-full flex flex-col">
                    <div>
                        <div className="flex items-center gap-2">
                            <h3 className="text-xl md:text-2xl font-bold group-hover:text-primary transition-colors">
                                {pkg.name}
                            </h3>
                            {pkg.preselected && (
                                <Badge
                                    variant="secondary"
                                    className="bg-amber-500/20 text-amber-600 border-amber-500/30"
                                >
                                    <Star className="h-3 w-3 mr-1" />
                                    Recommended
                                </Badge>
                            )}
                        </div>
                        {pkg.description && (
                            <p className="text-sm text-muted-foreground line-clamp-2 mt-1">
                                {pkg.description}
                            </p>
                        )}
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                        <div className="flex items-center gap-2.5 p-2.5 rounded-lg backdrop-blur-sm border bg-blue-500/10 border-blue-500/30">
                            <Cpu className="h-5 w-5 text-blue-500" />
                            <div>
                                <div className="text-sm font-semibold">
                                    {formatVCoresFromPercent(pkg.cpuPercent)}
                                </div>
                            </div>
                        </div>
                        <div className="flex items-center gap-2.5 p-2.5 rounded-lg backdrop-blur-sm border bg-purple-500/10 border-purple-500/30">
                            <MemoryStick className="h-5 w-5 text-purple-500" />
                            <div>
                                <div className="text-sm font-semibold">
                                    {formatMBToGiB(pkg.ramMB)}
                                </div>
                                <div className="text-xs text-muted-foreground">RAM</div>
                            </div>
                        </div>
                        <div className="flex items-center gap-2.5 p-2.5 rounded-lg backdrop-blur-sm border bg-green-500/10 border-green-500/30">
                            <HardDrive className="h-5 w-5 text-green-500" />
                            <div>
                                <div className="text-sm font-semibold">
                                    {formatMBToGiB(pkg.diskMB)}
                                </div>
                                <div className="text-xs text-muted-foreground">Storage</div>
                            </div>
                        </div>
                        <div className="flex items-center gap-2.5 p-2.5 rounded-lg backdrop-blur-sm border bg-orange-500/10 border-orange-500/30">
                            <Database className="h-5 w-5 text-orange-500" />
                            <div>
                                <div className="text-sm font-semibold">{pkg.backups}</div>
                                <div className="text-xs text-muted-foreground">Backups</div>
                            </div>
                        </div>
                    </div>

                    <div className="flex items-center justify-between pt-3 border-t mt-auto">
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <MapPin className="h-4 w-4" />
                            <span>{pkg.locationName}</span>
                        </div>
                        <div className="flex items-center gap-3">
                            <div className="text-right">
                                <div className="text-lg font-bold text-primary">
                                    €{(pkg.priceCents / 100).toFixed(2)}
                                </div>
                                <div className="text-xs text-muted-foreground">/month</div>
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
}

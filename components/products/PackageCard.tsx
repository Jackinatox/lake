import Link from 'next/link';
import React from 'react';
import { Button } from '../ui/button';
import { ArrowRight, Cpu, Database, HardDrive, MapPin, MemoryStick } from 'lucide-react';
import Image from 'next/image';
import { PackageWithCPURAM } from '@/models/prisma';
import { calculateNew } from '@/lib/GlobalFunctions/paymentLogic';

interface PackageCardProps {
    pkg: PackageWithCPURAM;
}

interface HardwareStatProps {
    icon: React.ReactNode;
    value: string | number;
    label: string;
    bgColor: string;
    borderColor: string;
    iconColor: string;
}

function HardwareStat({ icon, value, label, bgColor, borderColor, iconColor }: HardwareStatProps) {
    return (
        <div
            className={`flex items-center gap-2.5 p-2.5 rounded-lg backdrop-blur-sm border ${bgColor} ${borderColor}`}
        >
            <div className={iconColor}>{icon}</div>
            <div>
                <div className="text-sm font-semibold">{value}</div>
                <div className="text-xs text-muted-foreground">{label}</div>
            </div>
        </div>
    );
}

const PACKAGE_DURATION_DAYS = 30;

function PackageCard({ pkg }: PackageCardProps) {
    const imageBase = pkg.imageName;

    const price = calculateNew(pkg.location, pkg.cpuPercent, pkg.ramMB, PACKAGE_DURATION_DAYS);

    return (
        <Link
            key={pkg.id}
            href={`/products/packages/${pkg.id}`}
            className="group block w-full max-w-md"
        >
            <div className="relative h-full rounded-2xl border bg-card shadow-sm transition-all duration-300 hover:shadow-xl hover:border-muted-foreground/20 overflow-hidden">
                {/* Background Image with Blur */}
                <div className="absolute inset-0 z-0">
                    <Image
                        src={`/images/light/packages/${imageBase}`}
                        alt={pkg.imageName}
                        fill
                        className="object-cover dark:hidden blur-[1.5px]"
                    />
                    <Image
                        src={`/images/dark/packages/${imageBase}`}
                        alt={pkg.imageName}
                        fill
                        className="object-cover hidden dark:block blur-[1.5px]"
                    />
                    {/* Overlay for better text readability */}
                    <div className="absolute inset-0 bg-background/40" />
                </div>

                {/* Content */}
                <div className="relative z-10 p-5 md:p-6 space-y-4 h-full flex flex-col">
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
                        <HardwareStat
                            icon={<Cpu className="h-5 w-5" />}
                            value={(pkg.cpuPercent / 100).toFixed(1)}
                            label="vCPU"
                            bgColor="bg-blue-500/10"
                            borderColor="border-blue-500/30"
                            iconColor="text-blue-500"
                        />
                        <HardwareStat
                            icon={<MemoryStick className="h-5 w-5" />}
                            value={`${(pkg.ramMB / 1024).toFixed(1)} GB`}
                            label="RAM"
                            bgColor="bg-purple-500/10"
                            borderColor="border-purple-500/30"
                            iconColor="text-purple-500"
                        />
                        <HardwareStat
                            icon={<HardDrive className="h-5 w-5" />}
                            value={`${(pkg.diskMB / 1024).toFixed(0)} GB`}
                            label="Storage"
                            bgColor="bg-green-500/10"
                            borderColor="border-green-500/30 border-2"
                            iconColor="text-green-500"
                        />
                        <HardwareStat
                            icon={<Database className="h-5 w-5" />}
                            value={pkg.backups}
                            label="Backups"
                            bgColor="bg-orange-500/10"
                            borderColor="border-orange-500/30"
                            iconColor="text-orange-500"
                        />
                    </div>

                    <div className="flex items-center justify-between pt-3 border-t mt-auto">
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <MapPin className="h-4 w-4" />
                            <span>{pkg.location.name}</span>
                        </div>
                        <div className="flex items-center gap-3">
                            <div className="text-right">
                                <div className="text-lg font-bold text-primary">
                                    €{(price.totalCents / 100).toFixed(2)}
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

export default PackageCard;

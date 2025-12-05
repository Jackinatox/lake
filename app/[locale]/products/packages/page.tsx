import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import prisma from '@/lib/prisma';
import { ArrowRight, Cpu, Database, HardDrive, MapPin, MemoryStick, Package } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';

export default async function PackagesPage() {
    const packages = await prisma.package.findMany({
        where: { enabled: true },
        include: { location: true },
        orderBy: { name: 'asc' },
    });

    return (
        <div className="min-h-screen -mx-4 md:-mx-6 lg:-mx-8 -my-5">
            {/* Hero Section */}
            <section className="relative pt-16 pb-32 md:pt-24 md:pb-44 overflow-hidden">
                {/* Background effects */}
                <div className="absolute inset-0 bg-linear-to-br from-primary/10 via-background to-primary/5" />
                <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-size-[24px_24px]" />
                {/* Bottom fade */}
                <div className="absolute bottom-0 left-0 right-0 h-32 md:h-44 bg-linear-to-t from-background to-transparent" />

                <div className="relative z-10 mx-auto max-w-6xl px-4 md:px-6">
                    <div className="text-center space-y-4">
                        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20">
                            <Package className="h-4 w-4 text-primary" />
                            <span className="text-sm font-medium">
                                Pre-configured & Ready to Go
                            </span>
                        </div>
                        <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight">
                            Server{' '}
                            <span className="text-transparent bg-clip-text bg-linear-to-r from-primary to-primary/60">
                                Packages
                            </span>
                        </h1>
                        <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto">
                            Skip the configuration. Pick a package and start playing in seconds.
                        </p>
                    </div>
                </div>
            </section>

            {/* Packages Grid - pulled up to overlap hero */}
            <section className="relative -mt-20 md:-mt-32 pb-16 md:pb-24 z-10">
                <div className="mx-auto max-w-6xl px-4 md:px-6">
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
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {packages.map((pkg) => {
                                const imageBase = pkg.imageName.toLowerCase();

                                return (
                                    <Link
                                        key={pkg.id}
                                        href={`/products/packages/${pkg.id}`}
                                        className="group block"
                                    >
                                        <div className="relative h-full rounded-2xl border bg-card shadow-sm transition-all duration-300 hover:shadow-xl hover:border-muted-foreground/20 overflow-hidden">
                                            {/* Game Image Header */}
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
                                                {/* Gradient Overlay */}
                                                <div className="absolute inset-0 bg-linear-to-t from-card via-card/60 to-transparent" />

                                                {/* Game Badge */}
                                                <Badge
                                                    variant="secondary"
                                                    className="absolute top-4 right-4 shadow-sm"
                                                >
                                                    {pkg.imageName}
                                                </Badge>
                                            </div>

                                            {/* Content */}
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

                                                {/* Specs Grid */}
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

                                                {/* Footer */}
                                                <div className="flex items-center justify-between pt-3 border-t">
                                                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                                        <MapPin className="h-4 w-4" />
                                                        <span>{pkg.location.name}</span>
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
                                    </Link>
                                );
                            })}
                        </div>
                    )}
                </div>
            </section>
        </div>
    );
}

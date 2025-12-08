import PackagesList from '@/components/products/PackagesList';
import prisma from '@/lib/prisma';
import { Database, Package } from 'lucide-react';

export default async function PackagesPage() {
    const packages = await prisma.package.findMany({
        where: { enabled: true },
        include: {
            location: {
                include: { cpu: true, ram: true },
            },
        },
        orderBy: { name: 'asc' },
    });

    return (
        <div className="min-h-screen -mx-2 -my-2 md:-mx-8 md:-my-4">
            {/* Hero Section */}
            <section className="relative pt-16 pb-32 md:pt-24 md:pb-44 overflow-hidden">
                {/* Background effects */}
                <div className="absolute inset-0 bg-linear-to-br from-primary/10 via-background to-primary/5" />
                <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-size-[24px_24px]" />
                {/* Bottom fade */}
                <div className="absolute bottom-0 left-0 right-0 h-32 md:h-44 bg-linear-to-t from-background to-transparent" />
                <div className="relative z-10 mx-auto max-w-6xl px-2 md:px-6">
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
                    <PackagesList packages={packages} />
                </div>
            </section>
        </div>
    );
}

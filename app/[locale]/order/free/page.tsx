import prisma from '@/lib/prisma';
import { createPublicMetadata, getMetadataCopy } from '@/lib/metadata';
import GameCard from '@/components/order/game/gameCard';
import { getFreeTierConfigCached } from '@/lib/free-tier/config';
import { Gift, CheckCircle2 } from 'lucide-react';
import type { Metadata } from 'next';
import { Card, CardContent } from '@/components/ui/card';
import { FaqSection } from '@/components/faq/FaqSection';
import {
    Accordion,
    AccordionContent,
    AccordionItem,
    AccordionTrigger,
} from '@/components/ui/accordion';
import { formatVCoresFromPercent } from '@/lib/GlobalFunctions/formatVCores';
import { formatMB } from '@/lib/GlobalFunctions/ptResourceLogic';
import { auth } from '@/auth';
import { FREE_TIER_MAX_SERVERS } from '@/app/GlobalConstants';
import { getKeyValueNumber } from '@/lib/keyValue';
import { headers } from 'next/headers';

export async function generateMetadata({
    params,
}: {
    params: Promise<{ locale: string }>;
}): Promise<Metadata> {
    const { locale } = await params;
    const copy = getMetadataCopy(locale);

    return createPublicMetadata({
        locale,
        path: '/order/free',
        title: copy.freeOrderIndexTitle,
        description: copy.freeOrderIndexDescription,
        keywords: ['free game server', 'free gameserver', 'free minecraft server', 'free hosting'],
    });
}

export default async function OrderPage({ params }: { params: Promise<{ locale: string }> }) {
    const { locale } = await params;
    const copy = getMetadataCopy(locale);

    const [session, games, freeTierConfig, maxFreeServers] = await Promise.all([
        auth.api.getSession({ headers: await headers() }),
        prisma.gameData.findMany({
            select: { id: true, name: true, slug: true },
            where: { enabled: true },
            orderBy: { sorting: 'asc' },
        }),
        getFreeTierConfigCached(),
        getKeyValueNumber(FREE_TIER_MAX_SERVERS),
    ]);

    const currentFreeServers = session?.user
        ? await prisma.gameServer.count({
              where: {
                  userId: session.user.id,
                  type: 'FREE',
                  status: { notIn: ['CREATION_FAILED', 'DELETED'] },
              },
          })
        : null;

    const gameCards = games.map((game) => {
        const imgName = `${game.name.toLowerCase()}.webp`;
        return {
            ...game,
            imageSrc: `/images/games/icons/${imgName}`,
        };
    });

    const hardwareSpecs = [
        { label: 'CPU', value: `${formatVCoresFromPercent(freeTierConfig.cpu)}` },
        { label: 'CPU Model', value: 'Xeon E5-2680v4' },
        { label: 'RAM', value: `${formatMB(freeTierConfig.ram)}` },
        { label: 'Disk', value: `${formatMB(freeTierConfig.storage)}` },
        { label: 'Ports', value: `${freeTierConfig.allocations}` },
        { label: 'Backups', value: `${freeTierConfig.backupCount}` },
    ];

    return (
        <div className="-mx-4 -my-2 md:-mx-8 md:-my-4">
            {/* Hero Section */}
            <section className="relative pt-10 pb-6 md:pt-16 md:pb-10 overflow-hidden">
                <div className="absolute inset-0 bg-linear-to-br from-green-500/5 via-background to-primary/5" />
                <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-size-[24px_24px]" />
                <div className="relative z-10 mx-auto max-w-4xl px-4 md:px-6">
                    <div className="text-center space-y-3 md:space-y-4">
                        <Gift className="h-9 w-9 md:h-10 md:w-10 text-green-500 mx-auto" />
                        <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold tracking-tight text-balance">
                            {copy.freePageHeading
                                .split(copy.freePageHeadingHighlight)
                                .map((part, i, arr) =>
                                    i < arr.length - 1 ? (
                                        <span key={i}>
                                            {part}
                                            <span className="text-green-500">
                                                {copy.freePageHeadingHighlight}
                                            </span>
                                        </span>
                                    ) : (
                                        <span key={i}>{part}</span>
                                    ),
                                )}
                        </h1>
                        <p className="flex items-center justify-center gap-1.5 text-sm md:text-base text-muted-foreground">
                            <CheckCircle2 className="h-4 w-4 text-green-500 shrink-0" />
                            <span>{copy.freePageSubheading}</span>
                        </p>
                    </div>
                </div>
            </section>

            {/* Server Specs + FAQ */}
            <section className="relative z-10 mx-auto max-w-6xl px-4 md:px-6 pb-4 md:pb-6">
                <Card>
                    <CardContent className="p-3 md:p-4">
                        {/* Shared specs table */}
                        <div className="md:flex md:gap-6">
                            <div className="md:w-1/2 space-y-2">
                                <h2 className="text-sm font-semibold md:text-xs md:uppercase md:tracking-wide mb-3">
                                    {copy.freePageSpecsLabel}
                                </h2>
                                <div className="grid grid-cols-2 gap-x-4 gap-y-2">
                                    {hardwareSpecs.map((spec) => (
                                        <div key={spec.label} className="flex flex-col text-sm">
                                            <span className="text-muted-foreground">
                                                {spec.label}
                                            </span>
                                            <span className="font-medium text-foreground">
                                                {spec.value}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Divider */}
                            <div className="hidden md:block w-px bg-border shrink-0" />
                            <div className="mt-3 pt-1 border-t border-border md:hidden" />

                            {/* FAQ — collapsible on mobile, always open on desktop */}
                            <div className="md:w-1/2">
                                <div className="md:hidden">
                                    <Accordion type="single" collapsible>
                                        <AccordionItem value="why-free" className="border-none">
                                            <AccordionTrigger className="text-xs text-muted-foreground hover:no-underline py-2">
                                                {copy.freePageWhyFreeQuestion}
                                            </AccordionTrigger>
                                            <AccordionContent className="text-xs text-muted-foreground pb-1">
                                                <p>{copy.freePageWhyFreeAnswerShort}</p>
                                            </AccordionContent>
                                        </AccordionItem>
                                    </Accordion>
                                </div>
                                <div className="hidden md:block space-y-1.5">
                                    <p className="text-sm font-medium text-foreground">
                                        {copy.freePageWhyFreeQuestion}
                                    </p>
                                    <p className="text-sm text-muted-foreground">
                                        {copy.freePageWhyFreeAnswerLong}
                                    </p>
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </section>

            {/* Game Selection */}
            <section className="relative z-10 mx-auto max-w-6xl px-4 md:px-6 pb-6 md:pb-6">
                <div className="flex items-center justify-between mb-3">
                    <h2 className="text-sm font-semibold text-foreground">
                        {copy.freePageSelectGame}
                    </h2>
                    {currentFreeServers !== null &&
                        (currentFreeServers >= maxFreeServers ? (
                            <span className="text-sm font-medium text-yellow-600 dark:text-yellow-400">
                                {currentFreeServers}/{maxFreeServers} servers used
                            </span>
                        ) : (
                            <span className="text-xs text-muted-foreground">
                                {currentFreeServers}/{maxFreeServers} servers used
                            </span>
                        ))}
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 md:gap-4">
                    {gameCards.map((game) => (
                        <GameCard
                            key={game.id}
                            card={{
                                link: `/order/free/${game.slug}`,
                                name: game.name,
                            }}
                            imageSrc={game.imageSrc}
                        />
                    ))}
                </div>
            </section>

            {/* FAQ */}
            <section className="relative z-10 mx-auto max-w-4xl px-4 md:px-6 pb-10 md:pb-14">
                <FaqSection categories={['free_servers']} heading={copy.freePageFaqHeading} />
            </section>
        </div>
    );
}

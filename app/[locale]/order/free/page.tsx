import prisma from '@/lib/prisma';
import { createPublicMetadata, getMetadataCopy } from '@/lib/metadata';
import GameCard from '@/components/order/game/gameCard';
import { getFreeTierConfigCached } from '@/lib/free-tier/config';
import { Archive, CheckCircle2, Cpu, Gift, HardDrive, MemoryStick, Network } from 'lucide-react';
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
import {
    CONFIG_KEY_DELETE_GAMESERVER_AFTER_DAYS,
    FREE_SERVER_CREATION_ENABLED,
    FREE_TIER_MAX_SERVERS,
} from '@/app/GlobalConstants';
import { getKeyValueBoolean, getKeyValueNumber } from '@/lib/keyValue';
import FreeCreationDisabledBanner from '@/components/order/free/FreeCreationDisabledBanner';
import { headers } from 'next/headers';

export async function generateMetadata({
    params,
}: {
    params: Promise<{ locale: string }>;
}): Promise<Metadata> {
    const { locale } = await params;
    const copy = getMetadataCopy(locale);
    const games = await prisma.gameData.findMany({
        select: { name: true },
        where: { enabled: true },
        orderBy: { sorting: 'asc' },
    });
    const gameNames = games.map((game) => game.name);

    return createPublicMetadata({
        locale,
        path: '/order/free',
        title: copy.freeOrderIndexTitle(gameNames),
        description: copy.freeOrderIndexDescription(gameNames),
        keywords: ['free game server', 'free gameserver', 'free minecraft server', 'free hosting'],
    });
}

export default async function OrderPage({ params }: { params: Promise<{ locale: string }> }) {
    const { locale } = await params;
    const copy = getMetadataCopy(locale);

    const [session, games, freeTierConfig, creationEnabled, deleteAfterDays] = await Promise.all([
        auth.api.getSession({ headers: await headers() }),
        prisma.gameData.findMany({
            select: { id: true, name: true, slug: true },
            where: { enabled: true },
            orderBy: { sorting: 'asc' },
        }),
        getFreeTierConfigCached(),
        getKeyValueBoolean(FREE_SERVER_CREATION_ENABLED, true),
        // Same key the worker uses to delete expired servers
        getKeyValueNumber(CONFIG_KEY_DELETE_GAMESERVER_AFTER_DAYS),
    ]);

    const freeTierLocationInfo = await prisma.location.findFirst({
        where: {
            id: freeTierConfig.locationId,
        },
        select: {
            name: true,
            cpu: {
                select: {
                    shortName: true,
                },
            },
        },
    });

    const freeServersUnavailable = !creationEnabled || freeTierConfig.maxServers === 0;

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

    const cpuModel = freeTierLocationInfo?.cpu.shortName;
    const hardwareSpecs = [
        {
            icon: Cpu,
            value: formatVCoresFromPercent(freeTierConfig.cpu),
            label: cpuModel ? copy.freePageSpecCpuOn(cpuModel) : 'CPU',
        },
        { icon: MemoryStick, value: formatMB(freeTierConfig.ram), label: 'RAM' },
        { icon: HardDrive, value: formatMB(freeTierConfig.storage), label: copy.freePageSpecDisk },
        { icon: Network, value: `${freeTierConfig.allocations}`, label: 'Ports' },
        { icon: Archive, value: `${freeTierConfig.backupCount}`, label: 'Backups' },
    ];

    return (
        <div className="-mx-2 -my-2 md:-mx-8 md:-my-4">
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
                    </div>
                </div>
            </section>

            {/* Creation disabled notice */}
            {freeServersUnavailable && (
                <section className="relative z-10 mx-auto max-w-6xl px-4 md:px-6 pb-4">
                    <FreeCreationDisabledBanner />
                </section>
            )}

            {/* Server Specs + FAQ */}
            <section className="relative z-10 mx-auto max-w-6xl px-4 md:px-6 pb-4 md:pb-6">
                <Card>
                    <CardContent className="p-3 md:p-4">
                        {/* Shared specs table */}
                        <div className="md:flex md:gap-6">
                            <div className="md:flex-1 md:min-w-0">
                                <h2 className="text-sm font-semibold text-foreground mb-3">
                                    {copy.freePageSpecsLabel}
                                </h2>
                                <ul className="space-y-2.5">
                                    {hardwareSpecs.map((spec) => (
                                        <li
                                            key={spec.label}
                                            className="flex items-center gap-2.5 text-sm"
                                        >
                                            <spec.icon className="h-4 w-4 text-green-500 shrink-0" />
                                            <span>
                                                <span className="font-semibold text-foreground">
                                                    {spec.value}
                                                </span>{' '}
                                                <span className="text-muted-foreground">
                                                    {spec.label}
                                                </span>
                                            </span>
                                        </li>
                                    ))}
                                </ul>
                            </div>

                            {/* Divider */}
                            <div className="hidden md:block w-px bg-border shrink-0" />
                            <div className="mt-3 pt-3 border-t border-border md:hidden" />

                            {/* No-catch points */}
                            <div className="md:flex-1 md:min-w-0">
                                <h2 className="text-sm font-semibold text-foreground mb-3">
                                    {copy.freePageNoCatchLabel}
                                </h2>
                                <ul className="space-y-2.5">
                                    {[copy.freePageSubheading, ...copy.freePageNoCatchPoints].map(
                                        (point) => (
                                            <li
                                                key={point}
                                                className="flex items-start gap-2.5 text-sm text-muted-foreground"
                                            >
                                                <CheckCircle2 className="h-4 w-4 mt-0.5 text-green-500 shrink-0" />
                                                <span>{point}</span>
                                            </li>
                                        ),
                                    )}
                                </ul>
                            </div>

                            {/* Divider */}
                            <div className="hidden md:block w-px bg-border shrink-0" />
                            <div className="mt-3 pt-1 border-t border-border md:hidden" />

                            {/* FAQ — collapsible on mobile, always open on desktop */}
                            <div className="md:flex-1 md:min-w-0">
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
                                <div className="hidden md:block">
                                    <h2 className="text-sm font-semibold text-foreground mb-3">
                                        {copy.freePageWhyFreeQuestion}
                                    </h2>
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
                        (currentFreeServers >= freeTierConfig.maxServers ? (
                            <span className="text-sm font-medium text-yellow-600 dark:text-yellow-400">
                                {currentFreeServers}/{freeTierConfig.maxServers} servers used
                            </span>
                        ) : (
                            <span className="text-xs text-muted-foreground">
                                {currentFreeServers}/{freeTierConfig.maxServers} servers used
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

            {/* Plain-text explanation: what crawlers and AI answers can quote */}
            <section className="relative z-10 mx-auto max-w-4xl px-4 md:px-6 pb-6 md:pb-8">
                <h2 className="mb-3 text-lg font-semibold tracking-tight text-foreground md:text-xl">
                    {copy.freePageAboutHeading}
                </h2>
                <div className="space-y-3 text-sm text-muted-foreground">
                    {copy
                        .freePageAboutParagraphs({
                            games: games.map((game) => game.name),
                            durationDays: freeTierConfig.duration,
                            maxServers: freeTierConfig.maxServers,
                            deleteAfterDays,
                        })
                        .map((paragraph) => (
                            <p key={paragraph}>{paragraph}</p>
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

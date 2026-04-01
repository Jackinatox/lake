'use server';

import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import prisma from '@/lib/prisma';
import { ChangelogStrip } from '@/components/landing/ChangelogStrip';
import { Clock, Gift, Shield } from 'lucide-react';
import { getTranslations } from 'next-intl/server';
import Image from 'next/image';
import Link from 'next/link';
import { Game, SupportedGamesList } from './SupportedGamesList';

export default async function LandingPage() {
    const t = await getTranslations('landingpage');
    const games = await prisma.gameData.findMany({
        select: { id: true, name: true, slug: true },
        where: { enabled: true, featured: true },
        take: 4,
        orderBy: { sorting: 'asc' },
    });

    const supportedGames: Array<Game> = games.map((game) => {
        const imgName = game.name.toLowerCase() + '.webp';

        return {
            id: String(game.id),
            name: game.name,
            slug: game.slug,
            images: {
                light: `/images/light/games/icons/${imgName}`,
                dark: `/images/dark/games/icons/${imgName}`,
            },
        };
    });

    const tools = [
        {
            title: t('panelTitle'),
            desc: t('panelDesc'),
            darkImg: '/images/dark/home/panel.webp',
            lightImg: '/images/light/home/panel.webp',
            width: 2074,
            height: 1412,
            alt: 'Control panel screenshot',
        },
        {
            title: t('fileManagerTitle'),
            desc: t('fileManagerDesc'),
            darkImg: '/images/dark/home/filemanager.webp',
            lightImg: '/images/light/home/filemanager.webp',
            width: 1812,
            height: 906,
            alt: 'File manager screenshot',
        },
        {
            title: t('backupTitle'),
            desc: t('backupDesc'),
            darkImg: '/images/dark/home/backups.webp',
            lightImg: '/images/light/home/backups.webp',
            width: 1608,
            height: 818,
            alt: 'Backups screenshot',
        },
    ];

    const toolsSection = (
        <div className="px-0 py-2 md:py-8">
            <h2 className="text-3xl md:text-4xl font-bold text-center mb-10 md:mb-16">
                {t('toolsHeader')}
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
                {tools.map((tool) => (
                    <div
                        key={tool.alt}
                        className="group rounded-xl border bg-card overflow-hidden transition-shadow hover:shadow-lg"
                    >
                        <div className="overflow-hidden">
                            <Image
                                src={tool.darkImg}
                                width={tool.width}
                                height={tool.height}
                                alt={tool.alt}
                                className="w-full h-auto hidden dark:block transition-transform group-hover:scale-[1.02]"
                            />
                            <Image
                                src={tool.lightImg}
                                width={tool.width}
                                height={tool.height}
                                alt={tool.alt}
                                className="w-full h-auto block dark:hidden transition-transform group-hover:scale-[1.02]"
                            />
                        </div>
                        <div className="p-4 md:p-5">
                            <h3 className="text-lg font-semibold mb-1.5">{tool.title}</h3>
                            <p className="text-sm text-muted-foreground">{tool.desc}</p>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );

    return (
        <main className="flex flex-col min-h-screen -mx-2 md:-mx-8 -my-5">
            {/* Hero Section */}
            <section className="relative min-h-[90vh] flex items-center justify-center overflow-hidden">
                {/* Animated Background Gradient */}
                <div className="absolute inset-0 bg-linear-to-br from-primary/10 via-background to-primary/5 dark:from-primary/5 dark:via-background dark:to-primary/10" />

                {/* Background Image with Overlay */}
                <div className="absolute inset-0 z-0">
                    <Image
                        src="/images/light/bgs/background-hero.png"
                        alt="Gaming background"
                        fill
                        className="object-cover opacity-20 block dark:hidden"
                        priority
                    />
                    <Image
                        src="/images/dark/bgs/background-hero.png"
                        alt="Gaming background dark"
                        fill
                        className="object-cover opacity-20 hidden dark:block"
                        priority
                    />
                    <div className="absolute inset-0 bg-linear-to-b from-transparent via-background/50 to-background" />
                </div>

                {/* Grid Pattern Overlay */}
                <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-size-[24px_24px]" />

                <div className="mx-auto px-2 md:px-6 relative z-10 py-12 md:py-20">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-16 items-center">
                        {/* Left Content */}
                        <div className="space-y-6 md:space-y-8 text-center lg:text-left">
                            {/* Main Headline */}
                            <div className="space-y-4">
                                <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold tracking-tight leading-tight">
                                    {t('header1')}
                                    <br />
                                    <span className="text-transparent bg-clip-text bg-linear-to-r from-primary to-primary/60">
                                        {t('header2')}
                                    </span>
                                </h1>
                                <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto lg:mx-0">
                                    {t('heroSubtitle')}
                                </p>
                            </div>

                            {/* CTA Buttons */}
                            <div className="pt-4 space-y-3">
                                <div className="grid grid-cols-2 gap-2 sm:flex sm:flex-row sm:gap-2 justify-center lg:justify-start">
                                    <Button
                                        size="lg"
                                        className="w-full sm:w-auto px-8 text-base group"
                                        asChild
                                    >
                                        <Link href="/order" className="w-full sm:w-auto">
                                            {t('buttonStartNow')}
                                            {/* <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" /> */}
                                        </Link>
                                    </Button>
                                    <Button
                                        size="lg"
                                        variant="outline"
                                        className="w-full sm:w-auto px-8 text-base"
                                        asChild
                                    >
                                        <Link href="/order/configure">
                                            {t('buttonComparePlans')}
                                        </Link>
                                    </Button>
                                </div>
                                <div>
                                    <Button
                                        size="lg"
                                        variant="secondary"
                                        className="w-full sm:w-auto px-8 text-base bg-green-600 hover:bg-green-700 text-primary-foreground"
                                        asChild
                                    >
                                        <Link
                                            href="/order/free"
                                            className="flex items-center justify-center gap-2"
                                        >
                                            <Gift className="h-4 w-4" />
                                            {t('getFreeServer')}
                                        </Link>
                                    </Button>
                                </div>
                            </div>

                            {/* Highlights */}
                            <div className="flex flex-wrap items-center gap-x-4 gap-y-2 pt-6 text-sm text-muted-foreground justify-center lg:justify-start">
                                <span className="flex items-center gap-1.5">
                                    <Shield className="h-4 w-4 text-primary" />
                                    {t('highlightUptime')}
                                </span>
                                <span className="hidden sm:inline text-border">|</span>
                                <span className="flex items-center gap-1.5">
                                    <Clock className="h-4 w-4 text-primary" />
                                    {t('highlightSetup')}
                                </span>
                            </div>
                        </div>

                        <SupportedGamesList supportedGames={supportedGames} />
                    </div>
                </div>
            </section>

            <ChangelogStrip />

            {/* Tools Section */}
            <div className="hidden md:block mt-5 w-full px-2 max-w-screen-2xl mx-auto">
                <Card className="py-20">{toolsSection}</Card>
            </div>
            <div className="md:hidden block mt-5 py-10 px-2 max-w-screen-2xl self-center">
                {toolsSection}
            </div>

            {/* CTA Section */}
            <div className="mt-4 mx-auto w-full max-w-screen-2xl px-2 py-8 md:py-0">
                <Card className="bg-primary/10 border border-primary/20 text-center px-2 md:px-6 py-2 md:py-10">
                    <h2 className="text-2xl md:text-3xl font-bold mb-3">{t('ctaHeader')}</h2>
                    <p className="text-muted-foreground mb-6 max-w-2xl mx-auto text-sm md:text-base">
                        {t('ctaDesc')}
                    </p>
                    <div className="flex flex-col sm:flex-row gap-2 justify-center">
                        <Button size="lg" asChild>
                            <Link href="/order">{t('ctaButton')}</Link>
                        </Button>
                        <Button size="lg" variant="outline" asChild>
                            <Link href="/order/configure">{t('buttonComparePlans')}</Link>
                        </Button>
                    </div>
                </Card>
            </div>
        </main>
    );
}

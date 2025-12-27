'use server';

import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import prisma from '@/lib/prisma';
import { ArrowRight, CheckCircle, Gift } from 'lucide-react';
import { getTranslations } from 'next-intl/server';
import Image from 'next/image';
import Link from 'next/link';
import { Game, SupportedGamesList } from './SupportedGamesList';

export default async function LandingPage() {
    const t = await getTranslations('landingpage');
    const data = await prisma.gameData.findMany();

    const supportedGames: Array<Game> = data.map((game) => {
        const imgName = game.name.toLowerCase() + '.webp';

        return {
            id: String(game.id),
            name: game.name,
            images: {
                light: `/images/light/games/icons/${imgName}`,
                dark: `/images/dark/games/icons/${imgName}`,
            },
        };
    });

    const stuff = (
        <div className="p-2 md:p-8">
            <h2 className="text-3xl md:text-4xl font-bold text-center mb-16">{t('toolsHeader')}</h2>

            {/* Control Panel */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center mb-24">
                <div className="order-2 lg:order-1">
                    <h3 className="text-2xl font-bold mb-4">{t('panelTitle')}</h3>
                    <p className="text-muted-foreground mb-6">{t('panelDesc')}</p>
                    <ul className="space-y-2 mb-6">
                        <li className="flex items-center gap-2">
                            <CheckCircle className="h-5 w-5 text-primary" />
                            <span>{t('panelFeature1')}</span>
                        </li>
                        <li className="flex items-center gap-2">
                            <CheckCircle className="h-5 w-5 text-primary" />
                            <span>{t('panelFeature2')}</span>
                        </li>
                        <li className="flex items-center gap-2">
                            <CheckCircle className="h-5 w-5 text-primary" />
                            <span>{t('panelFeature3')}</span>
                        </li>
                    </ul>
                </div>
                <div className="order-1 lg:order-2">
                    <Image
                        src="/images/dark/home/panel.webp"
                        width={2074}
                        height={1412}
                        alt="Control panel screenshot"
                        className="rounded-lg shadow-lg border hidden dark:block"
                    />
                    <Image
                        src="/images/light/home/panel.webp"
                        width={2074}
                        height={1412}
                        alt="Control panel screenshot"
                        className="rounded-lg shadow-lg border block dark:hidden"
                    />
                </div>
            </div>

            {/* File Manager */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center mb-24">
                <div>
                    <Image
                        src="/images/dark/home/filemanager.webp"
                        width={1812}
                        height={906}
                        alt="Filemanager screenshot"
                        className="rounded-lg shadow-lg border hidden dark:block"
                    />
                    <Image
                        src="/images/light/home/filemanager.webp"
                        width={1812}
                        height={906}
                        alt="Filemanager screenshot"
                        className="rounded-lg shadow-lg border block dark:hidden"
                    />
                </div>
                <div>
                    <h3 className="text-2xl font-bold mb-4">{t('fileManagerTitle')}</h3>
                    <p className="text-muted-foreground mb-6">{t('fileManagerDesc')}</p>
                    <ul className="space-y-2 mb-6">
                        <li className="flex items-center gap-2">
                            <CheckCircle className="h-5 w-5 text-primary" />
                            <span>{t('fileManagerFeature1')}</span>
                        </li>
                        <li className="flex items-center gap-2">
                            <CheckCircle className="h-5 w-5 text-primary" />
                            <span>{t('fileManagerFeature2')}</span>
                        </li>
                        <li className="flex items-center gap-2">
                            <CheckCircle className="h-5 w-5 text-primary" />
                            <span>{t('fileManagerFeature3')}</span>
                        </li>
                    </ul>
                </div>
            </div>

            {/* Backup Manager */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
                <div className="order-2 lg:order-1">
                    <h3 className="text-2xl font-bold mb-4">{t('backupTitle')}</h3>
                    <p className="text-muted-foreground mb-6">{t('backupDesc')}</p>
                    <ul className="space-y-2 mb-6">
                        <li className="flex items-center gap-2">
                            <CheckCircle className="h-5 w-5 text-primary" />
                            <span>{t('backupFeature1')}</span>
                        </li>
                        <li className="flex items-center gap-2">
                            <CheckCircle className="h-5 w-5 text-primary" />
                            <span>{t('backupFeature2')}</span>
                        </li>
                        <li className="flex items-center gap-2">
                            <CheckCircle className="h-5 w-5 text-primary" />
                            <span>{t('backupFeature3')}</span>
                        </li>
                    </ul>
                </div>
                <div className="order-1 lg:order-2">
                    <Image
                        src="/images/dark/home/backups.webp"
                        width={1608}
                        height={818}
                        alt="Backups screenshot"
                        className="rounded-lg shadow-lg border hidden dark:block"
                    />
                    <Image
                        src="/images/light/home/backups.webp"
                        width={1608}
                        height={818}
                        alt="Backups screenshot"
                        className="rounded-lg shadow-lg border block dark:hidden"
                    />
                </div>
            </div>
        </div>
    );

    return (
        <main className="flex flex-col min-h-screen -mx-2 md:-mx-8 -my-5">
            {/* Hero Section - Completely Redesigned */}
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
                            {/* Badge */}
                            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20">
                                <ArrowRight className="h-4 w-4 text-primary" />
                                <span className="text-sm font-medium">{t('heroBadge')}</span>
                            </div>

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
                            <div className="flex flex-col sm:flex-row gap-2 justify-center lg:justify-start pt-4">
                                <Button
                                    size="lg"
                                    className="w-full sm:w-auto px-8 text-base group"
                                    asChild
                                >
                                    <Link
                                        href="/products/gameserver"
                                        className="w-full sm:w-auto text-secondary-foreground"
                                    >
                                        {t('buttonStartNow')}
                                        <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
                                    </Link>
                                </Button>
                                <Button
                                    size="lg"
                                    variant="outline"
                                    className="w-full sm:w-auto px-8 text-base"
                                    asChild
                                >
                                    <Link href="/products/packages">{t('buttonComparePlans')}</Link>
                                </Button>
                                <div className="md:hidden">
                                    <Button
                                        size="lg"
                                        className="w-full sm:w-auto px-8 text-base bg-green-600 hover:bg-green-700"
                                        asChild
                                    >
                                        <Link
                                            href="/products/packages"
                                            className="flex items-center justify-center gap-2 text-secondary-foreground"
                                        >
                                            <Gift className="h-4 w-4" />
                                            Todo Translation Free
                                        </Link>
                                    </Button>
                                </div>
                            </div>

                            {/* Stats Row */}
                            <div className="grid grid-cols-3 gap-4 pt-8 border-t border-border/50">
                                <div className="text-center lg:text-left">
                                    <div className="text-2xl md:text-3xl font-bold text-primary">
                                        {t('statUptime')}
                                    </div>
                                    <div className="text-xs md:text-sm text-muted-foreground mt-1">
                                        {t('statUptimeLabel')}
                                    </div>
                                </div>
                                <div className="text-center lg:text-left">
                                    <div className="text-2xl md:text-3xl font-bold text-primary">
                                        {t('statSupport')}
                                    </div>
                                    <div className="text-xs md:text-sm text-muted-foreground mt-1">
                                        {t('statSupportLabel')}
                                    </div>
                                </div>
                                <div className="text-center lg:text-left">
                                    <div className="text-2xl md:text-3xl font-bold text-primary">
                                        {t('statSetup')}
                                    </div>
                                    <div className="text-xs md:text-sm text-muted-foreground mt-1">
                                        {t('statSetupLabel')}
                                    </div>
                                </div>
                            </div>
                        </div>

                        <SupportedGamesList supportedGames={supportedGames} />
                    </div>
                </div>
            </section>

            {/* Tools Section */}
            <Card className="hidden md:block mt-5 py-20 px-2 md:px-6 max-w-screen-2xl self-center">
                {stuff}
            </Card>
            <div className="md:hidden block mt-5 py-20 px-2 md:px-6 max-w-screen-2xl self-center">
                {stuff}
            </div>

            {/* CTA Section */}
            <div className="mt-4 mx-auto w-full max-w-screen-2xl px-2 md:px-0 py-8 md:py-0">
                <Card className="bg-primary/10 border border-primary/20 text-center px-2 md:px-6 py-2 md:py-10">
                    <h2 className="text-2xl md:text-3xl font-bold mb-3">{t('ctaHeader')}</h2>
                    <p className="text-muted-foreground mb-6 max-w-2xl mx-auto text-sm md:text-base">
                        {t('ctaDesc')}
                    </p>
                    <div className="flex flex-col sm:flex-row gap-2 justify-center">
                        <Button size="lg" asChild>
                            <Link href="/products/gameserver">
                                {t('ctaButton')}
                                <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
                            </Link>
                        </Button>
                        <Button size="lg" variant="outline" asChild>
                            <Link href="/products/packages">{t('buttonComparePlans')}</Link>
                        </Button>
                    </div>
                </Card>
            </div>
        </main>
    );
}

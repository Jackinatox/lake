'use server';

import { Button } from '@/components/ui/button';
import prisma from '@/lib/prisma';
import { ChangelogStrip } from '@/components/landing/ChangelogStrip';
import { Gift, ChevronRight } from 'lucide-react';
import { getTranslations } from 'next-intl/server';
import Image from 'next/image';
import Link from 'next/link';

export default async function LandingPage() {
    const t = await getTranslations('landingpage');

    const games = await prisma.gameData.findMany({
        select: { id: true, name: true, slug: true },
        where: { enabled: true, featured: true },
        take: 4,
        orderBy: { sorting: 'asc' },
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

    return (
        <main className="flex flex-col min-h-screen -mx-2 md:-mx-8 -my-5 overflow-x-hidden">
            <style>{`
                @keyframes lp-fade-up {
                    from { opacity: 0; transform: translateY(28px); }
                    to   { opacity: 1; transform: translateY(0); }
                }
                @keyframes lp-fade-in {
                    from { opacity: 0; }
                    to   { opacity: 1; }
                }
                .lp-up   { opacity: 0; animation: lp-fade-up 0.65s ease forwards; }
                .lp-in   { opacity: 0; animation: lp-fade-in 0.8s ease forwards; }
                .d0 { animation-delay: 0ms; }
                .d1 { animation-delay: 80ms; }
                .d2 { animation-delay: 160ms; }
                .d3 { animation-delay: 240ms; }
                .d4 { animation-delay: 320ms; }
                .d5 { animation-delay: 420ms; }
                .d6 { animation-delay: 550ms; }
                .panel-tilt {
                    transform: perspective(1400px) rotateY(-14deg) rotateX(3deg);
                    transform-origin: right center;
                    transition: transform 0.6s cubic-bezier(0.25,0.46,0.45,0.94);
                    will-change: transform;
                }
                .panel-tilt:hover {
                    transform: perspective(1400px) rotateY(-5deg) rotateX(1deg);
                }
            `}</style>

            {/* ── HERO ─────────────────────────────────────────────── */}
            <section className="relative min-h-[94vh] flex items-center overflow-hidden">
                {/* Hero background image */}
                <div className="absolute inset-0 z-0">
                    <Image
                        src="/images/light/bgs/background-hero.png"
                        alt=""
                        fill
                        className="object-cover opacity-40 block dark:hidden"
                        priority
                    />
                    <Image
                        src="/images/dark/bgs/background-hero.png"
                        alt=""
                        fill
                        className="object-cover opacity-30 hidden dark:block"
                        priority
                    />
                    <div className="absolute inset-0 bg-linear-to-r from-background via-background/80 to-background/20" />
                    <div className="absolute inset-0 bg-linear-to-b from-transparent via-transparent to-background" />
                </div>

                {/* Fine grid */}
                <div className="absolute inset-0 bg-[linear-gradient(to_right,hsl(var(--border)/0.6)_1px,transparent_1px),linear-gradient(to_bottom,hsl(var(--border)/0.6)_1px,transparent_1px)] bg-size-[48px_48px] pointer-events-none z-1" />

                {/* Primary glow orb */}
                <div className="absolute top-1/4 left-1/3 w-125 h-125 rounded-full bg-primary/8 blur-[100px] pointer-events-none dark:bg-primary/10 z-1" />

                {/* Bottom fade into content */}
                <div className="absolute bottom-0 left-0 right-0 h-40 bg-linear-to-b from-transparent to-background pointer-events-none z-1" />

                <div className="relative z-10 w-full max-w-screen-2xl mx-auto px-4 md:px-8" style={{zIndex: 10}}>
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-0 items-center min-h-[80vh] py-16">

                        {/* ── Left: copy & CTAs ─────────── */}
                        <div className="space-y-7 lg:py-20">
                            <p className="lp-up d0 text-[0.65rem] font-mono tracking-[0.3em] uppercase text-muted-foreground">
                                {t('highlightUptime')}&nbsp;&nbsp;·&nbsp;&nbsp;{t('highlightSetup')}
                            </p>

                            <div className="lp-up d1 leading-none">
                                <h1 className="text-[clamp(3rem,8.5vw,6.5rem)] font-black tracking-tight uppercase leading-[0.88]">
                                    {t('header1')}
                                </h1>
                                <h1 className="text-[clamp(3rem,8.5vw,6.5rem)] font-black tracking-tight uppercase leading-[0.88] text-primary">
                                    {t('header2')}
                                </h1>
                            </div>

                            <p className="lp-up d2 text-base md:text-lg text-muted-foreground max-w-sm leading-relaxed">
                                {t('heroSubtitle')}
                            </p>

                            <div className="lp-up d3 flex flex-wrap gap-2">
                                <Button size="lg" className="text-base" asChild>
                                    <Link href="/order">{t('buttonStartNow')}</Link>
                                </Button>
                                <Button size="lg" variant="outline" className="text-base" asChild>
                                    <Link href="/order/configure">{t('buttonComparePlans')}</Link>
                                </Button>
                            </div>

                            <div className="lp-up d4">
                                <Button
                                    size="default"
                                    className="bg-green-600 hover:bg-green-700 text-white"
                                    asChild
                                >
                                    <Link href="/order/free" className="flex items-center gap-2">
                                        <Gift className="h-4 w-4" />
                                        {t('getFreeServer')}
                                    </Link>
                                </Button>
                            </div>
                        </div>

                        {/* ── Right: panel screenshot ───── */}
                        <div className="hidden lg:block relative h-130">
                            <div className="lp-in d6 absolute inset-y-0 left-0 right-[-12vw] flex items-center">
                                <div className="panel-tilt w-full rounded-xl border overflow-hidden shadow-[0_32px_80px_rgba(0,0,0,0.35)]">
                                    <Image
                                        src="/images/dark/home/panel.webp"
                                        alt="Control panel"
                                        width={2074}
                                        height={1412}
                                        className="w-full h-auto hidden dark:block"
                                        priority
                                    />
                                    <Image
                                        src="/images/light/home/panel.webp"
                                        alt="Control panel"
                                        width={2074}
                                        height={1412}
                                        className="w-full h-auto block dark:hidden"
                                        priority
                                    />
                                </div>
                            </div>
                            {/* Fade the right bleed */}
                            <div className="absolute top-0 bottom-0 right-[-12vw] w-[15vw] bg-linear-to-l from-background to-transparent pointer-events-none z-10" />
                        </div>
                    </div>
                </div>
            </section>

            <ChangelogStrip />

            {/* ── SUPPORTED GAMES ─────────────────────────────────── */}
            <section className="mt-10 w-full max-w-screen-2xl mx-auto px-4 md:px-8">
                <div className="flex items-center justify-between mb-5">
                    <h2 className="text-lg font-semibold">{t('supportedGames')}</h2>
                    <Link
                        href="/order"
                        className="flex items-center gap-1 text-sm text-muted-foreground hover:text-primary transition-colors"
                    >
                        {t('showAllGames')}
                        <ChevronRight className="h-3.5 w-3.5" />
                    </Link>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    {games.map((game) => {
                        const bannerName = game.name.toLowerCase() + '.jpg';
                        return (
                            <Link key={game.id} href={`/order/${game.slug}`} className="group">
                                <div className="relative aspect-video rounded-xl overflow-hidden border border-border hover:border-primary/50 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-lg hover:shadow-primary/10">
                                    <Image
                                        src={`/images/games/banners/${bannerName}`}
                                        alt={game.name}
                                        fill
                                        className="object-cover group-hover:scale-[1.06] transition-transform duration-500"
                                    />
                                    <div className="absolute inset-0 bg-linear-to-t from-black/70 via-black/15 to-transparent" />
                                    <div className="absolute bottom-0 left-0 right-0 p-2.5">
                                        <p className="text-white text-sm font-semibold drop-shadow">
                                            {game.name}
                                        </p>
                                    </div>
                                </div>
                            </Link>
                        );
                    })}
                </div>
            </section>

            {/* ── PLATFORM FEATURES ───────────────────────────────── */}
            <section className="mt-20 md:mt-28 w-full max-w-screen-2xl mx-auto px-4 md:px-8">
                <div className="mb-10 md:mb-14">
                    <p className="text-[0.65rem] font-mono tracking-[0.28em] uppercase text-primary/70 mb-2">
                        Platform
                    </p>
                    <h2 className="text-3xl md:text-4xl font-bold">{t('toolsHeader')}</h2>
                    <div className="mt-3 h-px w-12 bg-primary/50" />
                </div>

                {/* Main feature card — file manager (wide screenshot fits better here) */}
                <div className="group rounded-2xl border overflow-hidden grid grid-cols-1 md:grid-cols-[2fr_3fr] mb-5">
                    <div className="p-6 md:p-10 flex flex-col justify-center order-2 md:order-1">
                        <h3 className="text-2xl font-bold mb-3">{tools[0].title}</h3>
                        <p className="text-muted-foreground leading-relaxed">{tools[0].desc}</p>
                    </div>
                    <div className="overflow-hidden order-1 md:order-2 min-h-45">
                        <Image
                            src={tools[0].darkImg}
                            width={tools[0].width}
                            height={tools[0].height}
                            alt={tools[0].alt}
                            className="w-full h-full object-cover hidden dark:block group-hover:scale-[1.025] transition-transform duration-500"
                        />
                        <Image
                            src={tools[0].lightImg}
                            width={tools[0].width}
                            height={tools[0].height}
                            alt={tools[0].alt}
                            className="w-full h-full object-cover block dark:hidden group-hover:scale-[1.025] transition-transform duration-500"
                        />
                    </div>
                </div>

                {/* Secondary feature cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    {tools.slice(1).map((tool) => (
                        <div key={tool.alt} className="group rounded-2xl border overflow-hidden">
                            <div className="overflow-hidden">
                                <Image
                                    src={tool.darkImg}
                                    width={tool.width}
                                    height={tool.height}
                                    alt={tool.alt}
                                    className="w-full h-auto hidden dark:block group-hover:scale-[1.025] transition-transform duration-500"
                                />
                                <Image
                                    src={tool.lightImg}
                                    width={tool.width}
                                    height={tool.height}
                                    alt={tool.alt}
                                    className="w-full h-auto block dark:hidden group-hover:scale-[1.025] transition-transform duration-500"
                                />
                            </div>
                            <div className="p-5 border-t">
                                <h3 className="text-lg font-semibold mb-1">{tool.title}</h3>
                                <p className="text-sm text-muted-foreground">{tool.desc}</p>
                            </div>
                        </div>
                    ))}
                </div>
            </section>

            {/* ── CTA ─────────────────────────────────────────────── */}
            <div className="mt-14 mb-10 mx-auto w-full max-w-screen-2xl px-4 md:px-8">
                <div className="relative overflow-hidden rounded-2xl border border-primary/25">
                    <div className="absolute inset-0 bg-[linear-gradient(to_right,hsl(var(--primary)/0.06)_1px,transparent_1px),linear-gradient(to_bottom,hsl(var(--primary)/0.06)_1px,transparent_1px)] bg-size-[32px_32px]" />
                    <div className="absolute inset-0 bg-linear-to-br from-primary/6 via-transparent to-transparent" />
                    <div className="relative z-10 px-6 py-14 md:py-20 text-center">
                        <h2 className="text-2xl md:text-4xl font-bold mb-3">{t('ctaHeader')}</h2>
                        <p className="text-muted-foreground mb-8 max-w-lg mx-auto text-sm md:text-base">
                            {t('ctaDesc')}
                        </p>
                        <div className="flex flex-col sm:flex-row gap-3 justify-center">
                            <Button size="lg" asChild>
                                <Link href="/order">{t('ctaButton')}</Link>
                            </Button>
                            <Button size="lg" variant="outline" asChild>
                                <Link href="/order/configure">{t('buttonComparePlans')}</Link>
                            </Button>
                            <Button
                                size="lg"
                                className="bg-green-600 hover:bg-green-700 text-white"
                                asChild
                            >
                                <Link href="/order/free" className="flex items-center gap-2">
                                    <Gift className="h-4 w-4" />
                                    {t('getFreeServer')}
                                </Link>
                            </Button>
                        </div>
                    </div>
                </div>
            </div>
        </main>
    );
}

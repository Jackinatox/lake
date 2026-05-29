import prisma from '@/lib/prisma';
import { createPublicMetadata, getMetadataCopy } from '@/lib/metadata';
import GameCard from '@/components/order/game/gameCard';
import { getFreeTierConfigCached } from '@/lib/free-tier/config';
import { Gift, Cpu, HardDrive, MemoryStick, CheckCircle2, Clock, Server } from 'lucide-react';
import type { Metadata } from 'next';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
    Accordion,
    AccordionContent,
    AccordionItem,
    AccordionTrigger,
} from '@/components/ui/accordion';

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

export default async function OrderPage() {
    const [games, freeTierConfig] = await Promise.all([
        prisma.gameData.findMany({
            select: { id: true, name: true, slug: true },
            where: { enabled: true },
            orderBy: { sorting: 'asc' },
        }),
        getFreeTierConfigCached(),
    ]);

    const gameCards = games.map((game) => {
        const imgName = `${game.name.toLowerCase()}.webp`;
        return {
            ...game,
            imageSrc: `/images/games/icons/${imgName}`,
        };
    });

    const hardwareSpecs = [
        {
            icon: Cpu,
            label: 'CPU',
            value: `${freeTierConfig.cpu}%`,
            description: 'Dedicated CPU power',
        },
        {
            icon: MemoryStick,
            label: 'RAM',
            value: `${(freeTierConfig.ram / 1024).toFixed(1)} GB`,
            description: 'Memory allocation',
        },
        {
            icon: HardDrive,
            label: 'Storage',
            value: `${(freeTierConfig.storage / 1024).toFixed(0)} GB`,
            description: 'SSD storage space',
        },
        {
            icon: Clock,
            label: 'Duration',
            value: `${freeTierConfig.duration} days`,
            description: 'Free trial period',
        },
    ];

    return (
        <div className="-mx-2 -my-2 md:-mx-8 md:-my-4">
            {/* Hero Section */}
            <section className="relative pt-12 pb-8 md:pt-20 md:pb-12 overflow-hidden">
                <div className="absolute inset-0 bg-linear-to-br from-green-500/5 via-background to-primary/5" />
                <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-size-[24px_24px]" />
                <div className="relative z-10 mx-auto max-w-6xl px-4 md:px-6">
                    <div className="text-center space-y-4 md:space-y-6">
                        <div className="flex justify-center">
                            <div className="relative">
                                <div className="absolute inset-0 bg-green-500/20 rounded-full blur-xl" />
                                <Gift className="relative h-12 w-12 md:h-14 md:w-14 text-green-500" />
                            </div>
                        </div>
                        <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight text-balance">
                            Get Your{' '}
                            <span className="text-transparent bg-clip-text bg-linear-to-r from-green-500 to-green-600">
                                Free
                            </span>{' '}
                            Game Server
                        </h1>
                        <p className="text-base sm:text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto text-pretty">
                            Start playing with your friends today. No credit card required, no hidden fees.
                        </p>
                    </div>
                </div>
            </section>

            {/* No Payment Required Banner */}
            <section className="relative z-10 mx-auto max-w-6xl px-4 md:px-6 pb-6 md:pb-8">
                <Card className="border-green-500/30 bg-green-500/5">
                    <CardContent className="p-4 md:p-6">
                        <div className="flex flex-col sm:flex-row items-center gap-3 sm:gap-4">
                            <div className="flex items-center justify-center w-12 h-12 rounded-full bg-green-500/10 shrink-0">
                                <CheckCircle2 className="h-6 w-6 text-green-500" />
                            </div>
                            <div className="text-center sm:text-left flex-1">
                                <h2 className="text-lg md:text-xl font-semibold text-foreground">
                                    No Payment Required
                                </h2>
                                <p className="text-sm md:text-base text-muted-foreground">
                                    Your server comes with all the hardware included at no cost. Simply choose a game and start playing.
                                </p>
                            </div>
                            <Badge className="bg-green-500 text-white hover:bg-green-600 shrink-0">
                                100% Free
                            </Badge>
                        </div>
                    </CardContent>
                </Card>
            </section>

            {/* Hardware Included Section */}
            <section className="relative z-10 mx-auto max-w-6xl px-4 md:px-6 pb-6 md:pb-8">
                <Card>
                    <CardHeader className="pb-2 md:pb-4">
                        <div className="flex items-center gap-2">
                            <Server className="h-5 w-5 text-primary" />
                            <CardTitle className="text-lg md:text-xl">Hardware Included</CardTitle>
                        </div>
                        <p className="text-sm text-muted-foreground">
                            Every free server comes with these resources at no charge
                        </p>
                    </CardHeader>
                    <CardContent className="pt-0">
                        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
                            {hardwareSpecs.map((spec) => (
                                <div
                                    key={spec.label}
                                    className="flex flex-col items-center p-3 md:p-4 rounded-lg bg-muted/50 text-center"
                                >
                                    <spec.icon className="h-6 w-6 md:h-8 md:w-8 text-primary mb-2" />
                                    <span className="text-xs text-muted-foreground uppercase tracking-wide">
                                        {spec.label}
                                    </span>
                                    <span className="text-lg md:text-xl font-bold text-foreground">
                                        {spec.value}
                                    </span>
                                    <span className="text-xs text-muted-foreground hidden md:block">
                                        {spec.description}
                                    </span>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            </section>

            {/* Game Selection Section */}
            <section className="relative z-10 mx-auto max-w-6xl px-4 md:px-6 pb-6 md:pb-8">
                <div className="mb-4 md:mb-6">
                    <h2 className="text-xl md:text-2xl font-bold text-center">
                        Select Your Game
                    </h2>
                    <p className="text-sm md:text-base text-muted-foreground text-center mt-1">
                        Choose a game below to set up your free server
                    </p>
                </div>
                <div className="flex flex-wrap gap-3 md:gap-4 justify-center">
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

            {/* FAQ Accordion Section */}
            <section className="relative z-10 mx-auto max-w-6xl px-4 md:px-6 pb-8 md:pb-12">
                <Card>
                    <CardContent className="p-4 md:p-6">
                        <Accordion type="single" collapsible className="w-full">
                            <AccordionItem value="why-free" className="border-b-0">
                                <AccordionTrigger className="text-base md:text-lg font-medium hover:no-underline py-3">
                                    Why are the servers free?
                                </AccordionTrigger>
                                <AccordionContent className="text-sm md:text-base text-muted-foreground pb-4">
                                    <div className="space-y-3">
                                        <p>
                                            We believe everyone should have the opportunity to experience game server hosting without financial barriers. Our free tier is designed to let you try out our platform, play with friends, and see if it meets your needs before committing to a paid plan.
                                        </p>
                                        <p>
                                            The free servers are supported by our community of paid users and our commitment to making gaming accessible. While free servers have some resource limits compared to our premium offerings, they provide a genuine, fully-functional gaming experience.
                                        </p>
                                        <p>
                                            If you find yourself needing more resources, additional features, or longer server uptime, you can easily upgrade to one of our affordable paid plans at any time.
                                        </p>
                                    </div>
                                </AccordionContent>
                            </AccordionItem>
                        </Accordion>
                    </CardContent>
                </Card>
            </section>
        </div>
    );
}

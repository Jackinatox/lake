'use client';

import { extendFreeServer } from '@/app/actions/gameservers/extendFreeServer';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
    Card,
    CardContent,
    CardDescription,
    CardFooter,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import { toast } from '@/hooks/use-toast';
import { formatDate } from '@/lib/formatDate';
import { FreeTierConfig } from '@/lib/free-tier/config';
import { HardwareConfig } from '@/models/config';
import { ClientServer, PerformanceGroup } from '@/models/prisma';
import { ArrowRight, Calendar, Check, Clock, Sparkles, TrendingUp, Zap } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useState } from 'react';
import { formatMBToGiB } from '@/lib/GlobalFunctions/ptResourceLogic';

interface FreeServerUpgradeClientProps {
    server: ClientServer;
    performanceOptions: PerformanceGroup[];
    minOptions: HardwareConfig;
    freeConfig: FreeTierConfig;
}

export default function FreeServerUpgradeClient({
    server,
    performanceOptions,
    minOptions,
    freeConfig,
}: FreeServerUpgradeClientProps) {
    const t = useTranslations('freeServerUpgrade');
    const [mode, setMode] = useState<'choose' | 'extend'>('choose');
    const [extending, setExtending] = useState(false);
    const router = useRouter();

    const handleExtendFree = async () => {
        try {
            setExtending(true);
            const result = await extendFreeServer(server.ptServerId!);

            if (result.success) {
                toast({
                    title: t('extend.success.title'),
                    description: t('extend.success.description'),
                });
                router.refresh();
            } else {
                toast({
                    title: t('extend.error.title'),
                    description: result.error || t('extend.error.description'),
                    variant: 'destructive',
                });
            }
        } catch (error) {
            toast({
                title: t('extend.error.title'),
                description: t('extend.error.description'),
                variant: 'destructive',
            });
        } finally {
            setExtending(false);
        }
    };

    const daysRemaining = Math.max(
        0,
        Math.ceil(
            (new Date(server.expires).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24),
        ),
    );

    return (
        <div className="space-y-6">
            {/* Header Section */}
            <div className="space-y-2">
                <div className="flex items-center gap-2">
                    <Badge variant="secondary" className="text-xs">
                        {t('badge.freeServer')}
                    </Badge>
                    <Badge variant="outline" className="text-xs">
                        {server.gameData.name}
                    </Badge>
                </div>
                <h1 className="text-2xl sm:text-3xl font-bold">{t('title')}</h1>
                <p className="text-muted-foreground text-sm sm:text-base">{t('description')}</p>
            </div>

            {/* Server Info Card */}
            <Card className="border-primary/20">
                <CardHeader className="pb-3">
                    <CardTitle className="text-base sm:text-lg flex items-center gap-2">
                        <Clock className="w-5 h-5 text-primary" />
                        {t('serverInfo.title')}
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                    <div className="grid grid-cols-2 gap-3 text-sm">
                        <div>
                            <p className="text-muted-foreground">{t('serverInfo.expires')}</p>
                            <p className="font-semibold">
                                {formatDate(new Date(server.expires), true)}
                            </p>
                        </div>
                        <div>
                            <p className="text-muted-foreground">{t('serverInfo.daysLeft')}</p>
                            <p className="font-semibold">
                                {daysRemaining} {t('serverInfo.days')}
                            </p>
                        </div>
                        <div>
                            <p className="text-muted-foreground">{t('serverInfo.cpu')}</p>
                            <p className="font-semibold">
                                {server.cpuPercent / 100} {t('serverInfo.cores')}
                            </p>
                        </div>
                        <div>
                            <p className="text-muted-foreground">{t('serverInfo.ram')}</p>
                            <p className="font-semibold">{formatMBToGiB(server.ramMB)}</p>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Options Grid */}
            <div className="grid md:grid-cols-2 gap-4 sm:gap-6">
                {/* Extend Free Option */}
                <Card className="relative overflow-hidden transition-all border-green-500/50 shadow-lg flex flex-col h-full">
                    <CardHeader>
                        <div className="flex items-center gap-3 mb-2">
                            <div className="p-2 rounded-lg bg-green-500/10">
                                <Calendar className="w-6 h-6 text-green-600" />
                            </div>
                            <CardTitle className="text-lg sm:text-xl">
                                {t('extend.title')}
                            </CardTitle>
                        </div>
                        <CardDescription className="text-sm">
                            {t('extend.description')}
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4 flex-1">
                        <div className="space-y-2">
                            <div className="flex items-start gap-2 text-sm">
                                <Check className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                                <span>{t('extend.feature1')}</span>
                            </div>
                            <div className="flex items-start gap-2 text-sm">
                                <Check className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                                <span>{t('extend.feature2', { days: freeConfig.duration })}</span>
                            </div>
                            <div className="flex items-start gap-2 text-sm">
                                <Check className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                                <span>{t('extend.feature3')}</span>
                            </div>
                        </div>

                        <div className="p-3 rounded-lg bg-green-500/5 border border-green-500/20">
                            <p className="text-sm font-medium text-green-700 dark:text-green-400">
                                {t('extend.willExtendTo', {
                                    date: formatDate(
                                        new Date(
                                            Math.max(
                                                new Date(server.expires).getTime(),
                                                new Date().getTime(),
                                            ) +
                                                freeConfig.duration * 24 * 60 * 60 * 1000,
                                        ),
                                        true,
                                    ),
                                })}
                            </p>
                        </div>
                    </CardContent>
                    <CardFooter>
                        <Button
                            className="w-full "
                            size="lg"
                            disabled={extending}
                            onClick={handleExtendFree}
                        >
                            {extending ? t('extend.extending') : t('extend.button')}
                            {!extending && <ArrowRight className="w-4 h-4 ml-2" />}
                        </Button>
                    </CardFooter>
                </Card>

                {/* Upgrade to Paid Option */}
                {/* TODO: implement Server Upgrade from free */}
                <Card className="relative overflow-hidden border-muted shadow-lg flex flex-col h-full opacity-60">
                    <div className="absolute inset-0 bg-background/80 backdrop-blur-[1px] z-10 flex items-center justify-center">
                        <div className="text-center p-4">
                            <p className="text-sm font-semibold text-muted-foreground">
                                Available later
                            </p>
                        </div>
                    </div>
                    <div className="absolute top-0 right-0 bg-gradient-to-l from-primary to-primary/80 text-primary-foreground text-xs font-bold px-3 py-1 rounded-bl-lg flex items-center gap-1">
                        <Sparkles className="w-3 h-3" />
                        {t('upgrade.badge')}
                    </div>
                    <CardHeader>
                        <div className="flex items-center gap-3 mb-2">
                            <div className="p-2 rounded-lg bg-primary/10">
                                <Zap className="w-6 h-6 text-primary" />
                            </div>
                            <CardTitle className="text-lg sm:text-xl">
                                {t('upgrade.title')}
                            </CardTitle>
                        </div>
                        <CardDescription className="text-sm">
                            {t('upgrade.description')}
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4 flex-1">
                        <div className="space-y-2">
                            <div className="flex items-start gap-2 text-sm">
                                <Check className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
                                <span>{t('upgrade.feature1')}</span>
                            </div>
                            <div className="flex items-start gap-2 text-sm">
                                <Check className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
                                <span>{t('upgrade.feature2')}</span>
                            </div>
                            <div className="flex items-start gap-2 text-sm">
                                <Check className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
                                <span>{t('upgrade.feature3')}</span>
                            </div>
                            <div className="flex items-start gap-2 text-sm">
                                <Check className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
                                <span>{t('upgrade.feature4')}</span>
                            </div>
                        </div>

                        <div className="p-3 rounded-lg bg-primary/5 border border-primary/20">
                            <div className="flex items-center gap-2 mb-1">
                                <TrendingUp className="w-4 h-4 text-primary" />
                                <p className="text-sm font-semibold">
                                    {t('upgrade.pricing.title')}
                                </p>
                            </div>
                            <p className="text-xs text-muted-foreground">
                                {t('upgrade.pricing.description')}
                            </p>
                        </div>
                    </CardContent>
                    <CardFooter>
                        <Button className="w-full" size="lg" disabled>
                            {t('upgrade.button')}
                            <ArrowRight className="w-4 h-4 ml-2" />
                        </Button>
                    </CardFooter>
                </Card>
            </div>

            {/* Help Text */}
            <Card className="bg-muted/50">
                <CardContent className="p-4">
                    <p className="text-sm text-muted-foreground text-center">
                        {t('helpText.pre')}{' '}
                        <Link href="/support" className="font-medium underline">
                            {t('helpText.link')}
                        </Link>{' '}
                        {t('helpText.post')}
                    </p>
                </CardContent>
            </Card>
        </div>
    );
}

'use client';

import { checkoutAction, CheckoutParams } from '@/app/actions/checkout/checkout';
import { GameConfigComponent } from '@/components/booking2/game-config';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { useLakeLocale } from '@/hooks/useLakeLocale';
import { authClient } from '@/lib/auth-client';
import { cn } from '@/lib/utils';
import type { Game, GameConfig } from '@/models/config';
import {
    Cpu,
    Database,
    HardDrive,
    MapPin,
    MemoryStick,
    ArrowLeft,
    Info,
    Clock,
    Check,
    ArrowRight,
} from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useRef, useState, useMemo, useEffect } from 'react';
import { fetchOrderForRestore, calculateOrderDuration } from '@/lib/orderUtils';

const DURATION_OPTIONS: { days: number; label: string; shortLabel: string; discount?: number }[] = [
    { days: 7, label: '1 Week', shortLabel: '1W' },
    { days: 30, label: '1 Month', shortLabel: '1M' },
    { days: 90, label: '3 Months', shortLabel: '3M', discount: 10 },
    { days: 180, label: '6 Months', shortLabel: '6M', discount: 15 },
];

interface PackageData {
    id: number;
    name: string;
    description: string | null;
    imageName: string;
    diskMB: number;
    ramMB: number;
    cpuPercent: number;
    backups: number;
    allocations: number;
    location: {
        id: number;
        name: string;
    };
}

interface PricingInfo {
    cpuPricePerCore: number;
    ramPricePerGb: number;
}

interface PackageBookingClientProps {
    packageData: PackageData;
    game: Game;
    gameSlug: string;
    pricing: PricingInfo;
}

function calculatePrice(
    cpuPercent: number,
    ramMB: number,
    durationDays: number,
    cpuPricePerCore: number,
    ramPricePerGb: number,
): { totalCents: number; discountPercent: number } {
    const cpuPrice = Math.round(((cpuPricePerCore * cpuPercent) / 100 / 30) * durationDays);
    const ramPrice = Math.round(((ramPricePerGb * ramMB) / 1024 / 30) * durationDays);
    const baseTotal = cpuPrice + ramPrice;

    let discountPercent = 0;
    if (durationDays >= 180) discountPercent = 15;
    else if (durationDays >= 90) discountPercent = 10;

    const discountAmount = Math.round(baseTotal * (discountPercent / 100));
    return { totalCents: baseTotal - discountAmount, discountPercent };
}

export default function PackageBookingClient({
    packageData,
    game,
    gameSlug,
    pricing,
}: PackageBookingClientProps) {
    const { toast } = useToast();
    const router = useRouter();
    const searchParams = useSearchParams();
    const session = authClient.useSession();
    const gameConfigRef = useRef<{ submit: () => void }>(null);
    const locale = useLakeLocale();

    const [loading, setLoading] = useState(false);

    // Order restoration state
    const orderIdParam = searchParams.get('orderId');
    const [initialGameConfig, setInitialGameConfig] = useState<GameConfig | null>(null);

    // Persist duration in URL
    const initialDays = searchParams.get('days') ? Number(searchParams.get('days')) : 30;
    const [selectedDuration, setSelectedDuration] = useState(initialDays);

    // Sync duration to URL
    useEffect(() => {
        const currentDays = searchParams.get('days');
        if (currentDays !== String(selectedDuration)) {
            const params = new URLSearchParams(searchParams.toString());
            params.set('days', String(selectedDuration));
            window.history.replaceState(null, '', `?${params.toString()}`);
        }
    }, [selectedDuration, searchParams]);

    // Fetch order data for restoration when coming back from checkout
    useEffect(() => {
        if (!orderIdParam) return;

        async function restoreOrder() {
            const orderData = await fetchOrderForRestore(orderIdParam!);
            if (orderData?.gameConfig) {
                setInitialGameConfig(orderData.gameConfig);
                const duration = calculateOrderDuration(orderData.expiresAt, orderData.createdAt);
                setSelectedDuration(duration);
            }
        }

        restoreOrder();
    }, [orderIdParam]);

    const isLoggedIn = Boolean(session.data?.user);

    const { totalCents, discountPercent } = useMemo(() => {
        return calculatePrice(
            packageData.cpuPercent,
            packageData.ramMB,
            selectedDuration,
            pricing.cpuPricePerCore,
            pricing.ramPricePerGb,
        );
    }, [packageData.cpuPercent, packageData.ramMB, selectedDuration, pricing]);

    const handleGameConfigSubmit = async (gameConfig: GameConfig) => {
        if (!isLoggedIn) {
            toast({
                title: 'Login Required',
                description: 'Please log in to continue with the purchase.',
                variant: 'destructive',
            });
            return;
        }

        setLoading(true);
        try {
            const checkoutParams: CheckoutParams = {
                type: 'PACKAGE',
                locale,
                packageId: packageData.id,
                gameConfig,
                durationDays: selectedDuration,
            };

            const result = await checkoutAction(checkoutParams);
            if (!result?.client_secret) {
                throw new Error('No client secret returned from checkout');
            }

            router.push(`/order/checkout?type=package&orderId=${result.orderId}`);
        } catch (error) {
            console.error('Error during checkout:', error);
            toast({
                title: 'Error',
                description: error instanceof Error ? error.message : 'Failed to start checkout',
                variant: 'destructive',
            });
        } finally {
            setLoading(false);
        }
    };

    const handleContinue = () => {
        gameConfigRef.current?.submit();
    };

    const imgName = `${game.name.toLowerCase()}.webp`;

    return (
        <div className="md:-my-4">
            {/* Header */}
            <div className="sticky top-0 z-10 bg-background/80 backdrop-blur-md border-b py-4">
                <div className="w-full px-1 max-w-7xl mx-auto">
                    <div className="flex items-center justify-between gap-4">
                        <div className="flex items-center gap-4">
                            <Button variant="ghost" size="icon" asChild>
                                <Link href={`/order/${gameSlug}`}>
                                    <ArrowLeft className="h-4 w-4" />
                                </Link>
                            </Button>
                            <div className="relative w-10 h-10 shrink-0">
                                <Image
                                    src={`/images/light/games/icons/${imgName}`}
                                    alt={game.name}
                                    fill
                                    className="object-cover rounded-lg block dark:hidden"
                                />
                                <Image
                                    src={`/images/dark/games/icons/${imgName}`}
                                    alt={game.name}
                                    fill
                                    className="object-cover rounded-lg hidden dark:block"
                                />
                            </div>
                            <div>
                                <h1 className="text-xl sm:text-2xl font-bold">
                                    {packageData.name}
                                </h1>
                                <p className="text-sm text-muted-foreground">{game.name}</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-primary/10 border border-primary/20">
                            <span className="text-sm text-muted-foreground hidden sm:inline">
                                Total:
                            </span>
                            <span className="text-lg font-bold text-primary">
                                €{(totalCents / 100).toFixed(2)}
                            </span>
                            {discountPercent > 0 && (
                                <Badge
                                    variant="secondary"
                                    className="text-xs bg-green-500/20 text-green-600"
                                >
                                    -{discountPercent}%
                                </Badge>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Main content */}
            <div className="w-full pt-4 pb-28 max-w-7xl mx-auto">
                <div className="space-y-4">
                    {/* Package Summary */}
                    <Card className="p-3 md:p-4">
                        <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-6">
                            <div className="flex items-center gap-3">
                                <div>
                                    <div className="flex items-center gap-2">
                                        <span className="font-semibold text-lg">
                                            {packageData.name}
                                        </span>
                                        <Badge variant="secondary" className="text-xs">
                                            Package
                                        </Badge>
                                    </div>
                                    {packageData.description && (
                                        <p className="text-sm text-muted-foreground mt-0.5">
                                            {packageData.description}
                                        </p>
                                    )}
                                </div>
                            </div>
                            <div className="hidden sm:block h-8 w-px bg-border" />
                            <div className="flex flex-wrap items-center gap-3 sm:gap-4 text-sm">
                                <div className="flex items-center gap-1.5 px-2 py-1 rounded-md bg-blue-500/10">
                                    <Cpu className="h-4 w-4 text-blue-500" />
                                    <span className="font-medium">
                                        {(packageData.cpuPercent / 100).toFixed(0)} vCPU
                                    </span>
                                </div>
                                <div className="flex items-center gap-1.5 px-2 py-1 rounded-md bg-purple-500/10">
                                    <MemoryStick className="h-4 w-4 text-purple-500" />
                                    <span className="font-medium">
                                        {(packageData.ramMB / 1024).toFixed(0)} GB RAM
                                    </span>
                                </div>
                                <div className="flex items-center gap-1.5 px-2 py-1 rounded-md bg-green-500/10">
                                    <HardDrive className="h-4 w-4 text-green-500" />
                                    <span className="font-medium">
                                        {(packageData.diskMB / 1024).toFixed(0)} GB
                                    </span>
                                </div>
                                <div className="flex items-center gap-1.5 px-2 py-1 rounded-md bg-orange-500/10">
                                    <Database className="h-4 w-4 text-orange-500" />
                                    <span className="font-medium">
                                        {packageData.backups} Backups
                                    </span>
                                </div>
                                <div className="flex items-center gap-1.5 text-muted-foreground">
                                    <MapPin className="h-4 w-4" />
                                    <span>{packageData.location.name}</span>
                                </div>
                            </div>
                        </div>
                    </Card>

                    {/* Duration Selection */}
                    <Card className="p-3 md:p-4">
                        <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4">
                            <div className="flex items-center gap-2 shrink-0">
                                <Clock className="h-4 w-4 text-primary" />
                                <span className="font-semibold">Duration</span>
                            </div>
                            <div className="grid grid-cols-4 gap-2 flex-1">
                                {DURATION_OPTIONS.map((option) => {
                                    const isSelected = selectedDuration === option.days;
                                    const optionPrice = calculatePrice(
                                        packageData.cpuPercent,
                                        packageData.ramMB,
                                        option.days,
                                        pricing.cpuPricePerCore,
                                        pricing.ramPricePerGb,
                                    );

                                    return (
                                        <button
                                            key={option.days}
                                            onClick={() => setSelectedDuration(option.days)}
                                            className={cn(
                                                'relative flex items-center justify-center gap-1.5 px-2 py-1.5 rounded-lg border transition-all text-sm',
                                                isSelected
                                                    ? 'border-primary bg-primary/10 text-primary'
                                                    : 'border-border hover:border-primary/50 hover:bg-muted/50',
                                            )}
                                        >
                                            {option.discount && (
                                                <Badge
                                                    variant="secondary"
                                                    className="absolute -top-2 -right-1 text-[10px] px-1 py-0 bg-green-500/20 text-green-600 border-green-500/30"
                                                >
                                                    -{option.discount}%
                                                </Badge>
                                            )}
                                            <span className="font-medium whitespace-nowrap">
                                                {option.shortLabel}
                                            </span>
                                            <span className="text-muted-foreground text-xs hidden md:inline">
                                                €{(optionPrice.totalCents / 100).toFixed(0)}
                                            </span>
                                            {isSelected && <Check className="h-3 w-3 shrink-0" />}
                                        </button>
                                    );
                                })}
                            </div>
                        </div>
                    </Card>

                    {/* Game Configuration */}
                    <Card className="p-2 md:p-6">
                        <h2 className="text-xl font-semibold mb-4">Game Configuration</h2>
                        <GameConfigComponent
                            ref={gameConfigRef}
                            game={game}
                            onSubmit={handleGameConfigSubmit}
                            initialConfig={initialGameConfig}
                        />
                    </Card>
                </div>
            </div>

            {/* Sticky bottom navigation */}
            <div className="sticky bottom-0 z-10 bg-background/95 backdrop-blur-md border-t p-4">
                <div className="w-full max-w-7xl mx-auto">
                    <div className="flex flex-col-reverse sm:flex-row justify-between items-center gap-4">
                        <Button variant="outline" asChild className="w-full sm:w-auto">
                            <Link href={`/order/${gameSlug}`}>
                                <ArrowLeft className="mr-2 h-4 w-4" />
                                Back
                            </Link>
                        </Button>
                        <div className="flex items-center gap-4 w-full sm:w-auto">
                            {!isLoggedIn && (
                                <div className="flex items-center gap-2">
                                    <Info className="shrink-0 h-4 w-4" />
                                    <span className="text-sm text-muted-foreground">
                                        Log in to continue
                                    </span>
                                </div>
                            )}
                            <Button
                                onClick={handleContinue}
                                disabled={loading || !isLoggedIn}
                                className="w-full sm:w-auto sm:ml-auto"
                            >
                                {loading ? 'Processing...' : 'Continue to Payment'}
                                <ArrowRight className="ml-2 h-4 w-4" />
                            </Button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

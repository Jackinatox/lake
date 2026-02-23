'use client';

import { checkoutAction, CheckoutParams } from '@/app/actions/checkout/checkout';
import { GameConfigComponent } from '@/components/booking2/game-config';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { useLakeLocale } from '@/hooks/useLakeLocale';
import { authClient } from '@/lib/auth-client';
import { cn } from '@/lib/utils';
import { formatVCoresFromPercent } from '@/lib/GlobalFunctions/formatVCores';
import type { Game, GameConfig } from '@/models/config';
import {
    Cpu,
    Database,
    HardDrive,
    MapPin,
    MemoryStick,
    ArrowLeft,
    Info,
    ArrowRight,
} from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useRef, useState, useMemo, useEffect } from 'react';
import { fetchOrderForRestore, calculateOrderDuration } from '@/lib/orderUtils';
import { formatMBToGiB } from '@/lib/GlobalFunctions/ptResourceLogic';

const DURATION_OPTIONS: { days: number; label: string; sublabel: string; discount?: number }[] = [
    { days: 7, label: '1 Week', sublabel: '7 days' },
    { days: 30, label: '1 Month', sublabel: '30 days' },
    { days: 90, label: '3 Months', sublabel: '90 days', discount: 10 },
    { days: 180, label: '6 Months', sublabel: '180 days', discount: 15 },
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

    const selectedOption = DURATION_OPTIONS.find((o) => o.days === selectedDuration)!;

    return (
        <div className="md:-my-4">
            {/* Sticky header */}
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
                                <span className="text-xs font-semibold px-1.5 py-0.5 rounded-full bg-green-500 text-white">
                                    -{discountPercent}%
                                </span>
                            )}
                        </div>
                    </div>
                    {/* Progress indicator */}
                    <div className="mt-4 flex gap-2">
                        <div className="h-1.5 flex-1 rounded-full bg-primary" />
                        <div className="h-1.5 flex-1 rounded-full bg-muted" />
                    </div>
                </div>
            </div>

            {/* Main content */}
            <div className="w-full pt-4 pb-28 max-w-7xl mx-auto space-y-4">
                {/* Package + Duration summary card */}
                <Card className="p-3 md:p-4">
                    <div className="space-y-4">
                        {/* Hardware specs row */}
                        <div>
                            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2">
                                Included Hardware
                            </p>
                            <div className="flex flex-wrap gap-2 text-sm">
                                <div className="flex items-center gap-1.5 px-2 py-1 rounded-md bg-blue-500/10">
                                    <Cpu className="h-3.5 w-3.5 text-blue-500" />
                                    <span className="font-medium">
                                        {formatVCoresFromPercent(packageData.cpuPercent)}
                                    </span>
                                </div>
                                <div className="flex items-center gap-1.5 px-2 py-1 rounded-md bg-purple-500/10">
                                    <MemoryStick className="h-3.5 w-3.5 text-purple-500" />
                                    <span className="font-medium">
                                        {formatMBToGiB(packageData.ramMB)} RAM
                                    </span>
                                </div>
                                <div className="flex items-center gap-1.5 px-2 py-1 rounded-md bg-green-500/10">
                                    <HardDrive className="h-3.5 w-3.5 text-green-500" />
                                    <span className="font-medium">
                                        {formatMBToGiB(packageData.diskMB)}
                                    </span>
                                </div>
                                <div className="flex items-center gap-1.5 px-2 py-1 rounded-md bg-orange-500/10">
                                    <Database className="h-3.5 w-3.5 text-orange-500" />
                                    <span className="font-medium">
                                        {packageData.backups} Backups
                                    </span>
                                </div>
                                <div className="flex items-center gap-1.5 px-2 py-1 rounded-md bg-muted">
                                    <MapPin className="h-3.5 w-3.5 text-muted-foreground" />
                                    <span className="font-medium text-muted-foreground">
                                        {packageData.location.name}
                                    </span>
                                </div>
                            </div>
                        </div>

                        <div className="border-t" />

                        {/* Duration selector */}
                        <div>
                            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2">
                                Rental Duration
                            </p>
                            <div className="flex gap-2 flex-wrap">
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
                                                'relative flex items-center gap-3 px-3 py-2 rounded-lg border text-left transition-all flex-1 min-w-30',
                                                isSelected
                                                    ? 'border-primary bg-primary/10'
                                                    : 'border-border hover:border-primary/40 hover:bg-muted/50',
                                            )}
                                        >
                                            {option.discount && (
                                                <span className="absolute -top-2 -right-1 text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-green-500 text-white leading-none">
                                                    -{option.discount}%
                                                </span>
                                            )}
                                            <div className="flex flex-col">
                                                <span
                                                    className={cn(
                                                        'text-sm font-semibold leading-none',
                                                        isSelected
                                                            ? 'text-primary'
                                                            : 'text-foreground',
                                                    )}
                                                >
                                                    {option.label}
                                                </span>
                                                <span className="text-xs text-muted-foreground mt-0.5 leading-none">
                                                    {option.sublabel}
                                                </span>
                                            </div>
                                            <span
                                                className={cn(
                                                    'ml-auto text-sm font-bold tabular-nums',
                                                    isSelected ? 'text-primary' : 'text-foreground',
                                                )}
                                            >
                                                €{(optionPrice.totalCents / 100).toFixed(2)}
                                            </span>
                                        </button>
                                    );
                                })}
                            </div>
                        </div>
                    </div>
                </Card>

                {/* Game Configuration */}
                <Card className="p-2 md:p-6">
                    <div className="mb-4 md:mb-6 flex items-center gap-4">
                        <div className="relative w-14 h-14 shrink-0">
                            <Image
                                src={`/images/light/games/icons/${imgName}`}
                                alt={game.name}
                                fill
                                className="object-cover rounded-lg block dark:hidden shadow-md"
                            />
                            <Image
                                src={`/images/dark/games/icons/${imgName}`}
                                alt={game.name}
                                fill
                                className="object-cover rounded-lg hidden dark:block shadow-md"
                            />
                        </div>
                        <div>
                            <h2 className="text-xl font-semibold">{game.name} Configuration</h2>
                        </div>
                    </div>
                    <GameConfigComponent
                        ref={gameConfigRef}
                        game={game}
                        onSubmit={handleGameConfigSubmit}
                        initialConfig={initialGameConfig}
                    />
                </Card>
            </div>

            {/* Sticky bottom bar */}
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
                                <div className="flex items-center gap-2 text-muted-foreground">
                                    <Info className="shrink-0 h-4 w-4" />
                                    <span className="text-sm">Log in to continue</span>
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

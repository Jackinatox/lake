'use client';

import { checkoutAction, CheckoutParams } from '@/app/actions/checkout/checkout';
import { GameConfigComponent } from '@/components/booking2/game-config';
import HardwareChipBar from '@/components/order/HardwareChipBar';
import { configuredHardwareFromParams } from '@/components/order/PerformanceConfigurator';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { ThemeImage } from '@/components/ui/theme-image';
import { useToast } from '@/hooks/use-toast';
import { useLakeLocale } from '@/hooks/useLakeLocale';
import { authClient } from '@/lib/auth-client';
import { calculateNew } from '@/lib/GlobalFunctions/paymentLogic';
import { fetchOrderForRestore } from '@/lib/orderUtils';
import { getValidationMessage } from '@/lib/validation/common';
import { checkoutConfiguredParamsSchema, gameConfigSchema } from '@/lib/validation/order';
import type { Game, GameConfig } from '@/models/config';
import { PerformanceGroup, ResourceTierDisplay } from '@/models/prisma';
import { ArrowLeft, ArrowRight, Info, Pencil } from 'lucide-react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useMemo, useRef, useState } from 'react';

interface SetupPageClientProps {
    game: Game;
    gameSlug: string;
    performanceGroups: PerformanceGroup[];
    resourceTiers: ResourceTierDisplay[];
}

export default function SetupPageClient({
    game,
    gameSlug,
    performanceGroups,
    resourceTiers,
}: SetupPageClientProps) {
    const searchParams = useSearchParams();
    const router = useRouter();
    const { toast } = useToast();
    const locale = useLakeLocale();
    const session = authClient.useSession();
    const gameConfigRef = useRef<{ submit: () => void }>(null);
    const [loading, setLoading] = useState(false);

    // Order restoration state
    const orderIdParam = searchParams.get('orderId');
    const [initialGameConfig, setInitialGameConfig] = useState<GameConfig | null>(null);

    // Fetch order data for restoration when coming back from checkout
    useEffect(() => {
        if (!orderIdParam) return;

        async function restoreOrder() {
            const orderData = await fetchOrderForRestore(orderIdParam!);
            if (orderData?.gameConfig) {
                setInitialGameConfig(orderData.gameConfig);
            } else {
                toast({
                    title: 'Unable to restore game configuration',
                    description: 'Please configure your game settings.',
                });
            }
        }

        restoreOrder();
    }, [orderIdParam, toast]);

    const isLoggedIn = Boolean(session.data?.user);

    // Read hardware config from URL params
    const configuredResult = configuredHardwareFromParams(searchParams, resourceTiers);
    const hardwareConfig = configuredResult?.hardwareConfig ?? null;

    // Find the matching performance group for price display
    const performanceGroup = performanceGroups.find((pg) => pg.id === hardwareConfig?.pfGroupId);

    // Calculate price
    const price = useMemo(() => {
        console.log({ hardwareConfig, performanceGroup });
        if (!hardwareConfig || !performanceGroup) return null;
        return calculateNew(
            performanceGroup,
            hardwareConfig.cpuPercent,
            hardwareConfig.ramMb,
            hardwareConfig.durationsDays,
            configuredResult?.tierPriceCents ?? 0,
        );
    }, [hardwareConfig, performanceGroup, configuredResult]);

    if (!hardwareConfig) {
        return (
            <div className="p-8 text-center">
                <p className="text-muted-foreground mb-4">
                    No hardware configuration found. Please configure your hardware first.
                </p>
                <Button asChild>
                    <Link href={`/order/${gameSlug}`}>Configure Hardware</Link>
                </Button>
            </div>
        );
    }

    const imgName = `${game.name.toLowerCase()}.webp`;
    const hwParamsStr = searchParams.toString();

    // Preserve orderId in back link
    const backHref = `/order/${gameSlug}?${hwParamsStr}`;

    const handleGameConfigSubmit = async (gameConfig: GameConfig) => {
        if (!isLoggedIn) {
            toast({
                title: 'Login Required',
                description: 'Please log in to continue with the purchase.',
                variant: 'destructive',
            });
            return;
        }

        const parsedGameConfig = gameConfigSchema.safeParse(gameConfig);
        if (!parsedGameConfig.success || !configuredResult) {
            toast({
                title: 'Invalid configuration',
                description: getValidationMessage(
                    parsedGameConfig.success
                        ? new Error('Invalid hardware configuration')
                        : parsedGameConfig.error,
                ),
                variant: 'destructive',
            });
            return;
        }

        setLoading(true);
        try {
            const checkoutParams: CheckoutParams = {
                type: 'CONFIGURED',
                locale,
                creationServerConfig: {
                    gameConfig: parsedGameConfig.data,
                    hardwareConfig,
                },
                resourceTierId: configuredResult!.tierId,
            };

            const parsedCheckoutParams = checkoutConfiguredParamsSchema.safeParse(checkoutParams);
            if (!parsedCheckoutParams.success) {
                throw new Error(getValidationMessage(parsedCheckoutParams.error));
            }

            const result = await checkoutAction(parsedCheckoutParams.data);
            if (!result?.client_secret) {
                throw new Error('No client secret returned');
            }

            // Navigate to the Stripe checkout page with the client secret
            // We store the client_secret in sessionStorage since it's sensitive
            sessionStorage.setItem('checkout_client_secret', result.client_secret);
            router.push(`/order/checkout?type=custom&orderId=${result.orderId}`);
        } catch (error) {
            console.error('Error submitting configuration:', error);
            toast({
                title: 'Error',
                description:
                    error instanceof Error
                        ? error.message
                        : 'There was an error processing your request.',
                variant: 'destructive',
            });
        } finally {
            setLoading(false);
        }
    };

    const handleContinue = () => {
        gameConfigRef.current?.submit();
    };

    return (
        <div className="md:-my-4">
            {/* Header */}
            <div className="sticky top-0 z-10 bg-background/80 backdrop-blur-md border-b py-4">
                <div className="w-full px-1 max-w-7xl mx-auto">
                    <div className="flex items-center justify-between gap-4">
                        <div className="flex items-center gap-4">
                            <Button variant="ghost" size="icon" asChild>
                                <Link href={backHref}>
                                    <ArrowLeft className="h-4 w-4" />
                                </Link>
                            </Button>
                            <div className="relative w-10 h-10 shrink-0">
                                <ThemeImage
                                    src={`/images/games/icons/${imgName}`}
                                    alt={game.name}
                                    fill
                                    className="object-cover rounded-lg"
                                />
                            </div>
                            <div>
                                <h1 className="text-xl sm:text-2xl font-bold">Game Setup</h1>
                                <p className="text-sm text-muted-foreground">{game.name}</p>
                            </div>
                        </div>
                        {price && (
                            <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-primary/10 border border-primary/20">
                                <span className="text-sm text-muted-foreground hidden sm:inline">
                                    Total:
                                </span>
                                <span className="text-lg sm:text-xl font-bold text-primary">
                                    €{(price.totalCents / 100).toFixed(2)}
                                </span>
                            </div>
                        )}
                    </div>

                    {/* Progress: step 2 of 3 (game-first) or 3 of 3 (hw-first) */}
                    <div className="mt-4 flex gap-2">
                        <div className="h-2 flex-1 rounded bg-primary/60" />
                        <div className="h-2 flex-1 rounded bg-primary" />
                        <div className="h-2 flex-1 rounded bg-muted" />
                    </div>
                </div>
            </div>

            {/* Main content */}
            <div className="w-full pt-4 pb-28 max-w-7xl mx-auto">
                {/* Hardware summary card */}
                <Card className="mb-6">
                    <div className="flex items-center gap-2 p-3">
                        <HardwareChipBar
                            cpu={hardwareConfig.cpuPercent / 100}
                            ram={hardwareConfig.ramMb / 1024}
                            days={hardwareConfig.durationsDays}
                            diskGB={hardwareConfig.diskMb / 1024}
                            backups={hardwareConfig.backupCount}
                            ports={hardwareConfig.allocations}
                            totalCents={price?.totalCents ?? 0}
                            className="flex-1"
                        />
                        <Button variant="outline" size="sm" asChild className="shrink-0">
                            <Link href={backHref}>
                                <Pencil className="h-3 w-3 mr-1.5" />
                                Edit
                            </Link>
                        </Button>
                    </div>
                </Card>

                {/* Game-specific configuration */}
                <Card className="p-2 md:p-6">
                    {/* Header with Game Icon */}
                    <div className="mb-4 md:mb-6 flex items-center gap-4">
                        <div className="relative w-14 h-14 md:w-16 md:h-16 shrink-0">
                            <ThemeImage
                                src={`/images/games/icons/${imgName}`}
                                alt={game.name}
                                fill
                                className="object-cover rounded-lg shadow-md"
                            />
                        </div>
                        <div>
                            <h2 className="text-2xl md:text-3xl font-bold text-primary/90">
                                {game.name}
                            </h2>
                            <p className="text-sm text-muted-foreground">
                                Configure your game-specific settings
                            </p>
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

            {/* Sticky bottom navigation */}
            <div className="sticky bottom-0 z-10 bg-background/95 backdrop-blur-md border-t p-4">
                <div className="w-full max-w-7xl mx-auto">
                    {!isLoggedIn && (
                        <div className="flex items-center justify-center gap-2 mb-3 sm:hidden">
                            <Info className="shrink-0 h-4 w-4" />
                            <span className="text-sm text-muted-foreground">
                                Log in to continue
                            </span>
                        </div>
                    )}
                    <div className="flex flex-col-reverse sm:flex-row justify-between items-center gap-4">
                        <Button variant="outline" asChild className="w-full sm:w-auto">
                            <Link href={backHref}>
                                <ArrowLeft className="mr-2 h-4 w-4" />
                                Back
                            </Link>
                        </Button>
                        <div className="flex items-center gap-4 w-full sm:w-auto">
                            {!isLoggedIn && (
                                <div className="hidden sm:flex items-center gap-2">
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

'use client';

import { checkoutAction, CheckoutParams } from '@/app/actions/checkout/checkout';
import { GameConfigComponent } from '@/components/booking2/game-config';
import CustomServerPaymentElements from '@/components/payments/PaymentElements';
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
} from 'lucide-react';
import { useRef, useState, useMemo } from 'react';

// Duration options in days
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

interface PackageBookingProps {
    packageData: PackageData;
    game: Game;
    pricing: PricingInfo;
}

// Calculate price for a given duration (mirrors server-side logic)
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

    // Apply discount based on duration
    let discountPercent = 0;
    if (durationDays >= 180) {
        discountPercent = 15;
    } else if (durationDays >= 90) {
        discountPercent = 10;
    }

    const discountAmount = Math.round(baseTotal * (discountPercent / 100));
    return { totalCents: baseTotal - discountAmount, discountPercent };
}

export default function PackageBooking({ packageData, game, pricing }: PackageBookingProps) {
    const { toast } = useToast();
    const session = authClient.useSession();
    const gameConfigRef = useRef<{ submit: () => void }>(null);
    const locale = useLakeLocale();

    const [step, setStep] = useState<'config' | 'payment'>('config');
    const [clientSecret, setClientSecret] = useState<string>('');
    const [loading, setLoading] = useState(false);
    const [selectedDuration, setSelectedDuration] = useState(30); // Default to 1 month

    const isLoggedIn = Boolean(session.data?.user);

    // Calculate price based on selected duration
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
                locale: locale,
                packageId: packageData.id,
                gameConfig: gameConfig,
                durationDays: selectedDuration,
            };

            const result = await checkoutAction(checkoutParams);
            if (!result?.client_secret) {
                throw new Error('No client secret returned from checkout');
            }

            setClientSecret(result.client_secret);
            setStep('payment');
            window.scrollTo({ top: 0, behavior: 'smooth' });
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

    const selectedOption = DURATION_OPTIONS.find((o) => o.days === selectedDuration);

    return (
        <div className="min-h-screen bg-background md:-my-4">
            {/* Header with progress indicator */}
            <div className="sticky top-0 z-10 bg-background/80 backdrop-blur-md border-b py-4">
                <div className="w-full px-1 max-w-7xl mx-auto">
                    <div className="flex items-center justify-between gap-4">
                        <h1 className="text-xl sm:text-2xl font-bold">Configure Your Server</h1>
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

                    {/* Progress indicator */}
                    <div className="mt-4 flex gap-2">
                        {['config', 'payment'].map((stepName, idx) => (
                            <div
                                key={stepName}
                                className={`h-2 flex-1 rounded ${
                                    stepName === step
                                        ? 'bg-primary'
                                        : idx < (step === 'payment' ? 1 : 0)
                                          ? 'bg-primary/60'
                                          : 'bg-muted'
                                }`}
                            />
                        ))}
                    </div>
                </div>
            </div>

            {/* Main content */}
            <div className="w-full pt-4 pb-28 max-w-7xl mx-auto">
                {step === 'config' && (
                    <div className="space-y-4">
                        {/* Package Summary Card */}
                        <PackageSummaryCard packageData={packageData} />

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
                                                {isSelected && (
                                                    <Check className="h-3 w-3 shrink-0" />
                                                )}
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
                            />
                        </Card>
                    </div>
                )}

                {step === 'payment' && (
                    <div className="max-w-4xl mx-auto">
                        <Card className="p-2 md:p-6">
                            <h2 className="text-2xl font-bold mb-6">Complete Payment</h2>
                            <CustomServerPaymentElements clientSecret={clientSecret} />
                        </Card>
                    </div>
                )}
            </div>

            {/* Sticky bottom navigation */}
            <div className="sticky bottom-0 z-10 bg-background/95 backdrop-blur-md border-t p-4">
                <div className="w-full max-w-7xl mx-auto">
                    <div className="flex flex-col-reverse sm:flex-row justify-between items-center gap-4">
                        {step === 'payment' && (
                            <Button
                                variant="outline"
                                onClick={() => {
                                    window.scrollTo({ top: 0, behavior: 'smooth' });
                                    setStep('config');
                                }}
                                className="w-full sm:w-auto"
                            >
                                <ArrowLeft className="mr-2 h-4 w-4" />
                                Back
                            </Button>
                        )}

                        {step === 'config' && (
                            <>
                                {!isLoggedIn && (
                                    <div className="flex items-center gap-2 w-full sm:w-auto mb-2 sm:mb-0">
                                        <Info className="shrink-0 h-4 w-4" />
                                        <span className="text-sm text-muted-foreground">
                                            Please log in to continue
                                        </span>
                                    </div>
                                )}
                                <Button
                                    onClick={handleContinue}
                                    disabled={loading || !isLoggedIn}
                                    className="w-full sm:w-auto sm:ml-auto"
                                >
                                    {loading ? 'Processing...' : 'Continue to Payment'}
                                </Button>
                            </>
                        )}

                        {step === 'payment' && (
                            <div className="text-sm text-muted-foreground sm:ml-auto">
                                Complete your payment to finish the order
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}

interface PackageSummaryCardProps {
    packageData: PackageData;
}

function PackageSummaryCard({ packageData }: PackageSummaryCardProps) {
    return (
        <Card className="p-3 md:p-4">
            <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-6">
                {/* Package Info */}
                <div className="flex items-center gap-3">
                    <div>
                        <div className="flex items-center gap-2">
                            <span className="font-semibold text-lg">{packageData.name}</span>
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

                {/* Divider - hidden on mobile */}
                <div className="hidden sm:block h-8 w-px bg-border" />

                {/* Compact Specs */}
                <div className="flex flex-wrap items-center gap-3 sm:gap-4 text-sm">
                    <div className="flex items-center gap-1.5 px-2 py-1 rounded-md bg-blue-500/10">
                        <Cpu className="h-4 w-4 text-blue-500" />
                        <span className="font-medium">
                            {(packageData.cpuPercent / 100).toFixed(1)} vCPU
                        </span>
                    </div>
                    <div className="flex items-center gap-1.5 px-2 py-1 rounded-md bg-purple-500/10">
                        <MemoryStick className="h-4 w-4 text-purple-500" />
                        <span className="font-medium">
                            {(packageData.ramMB / 1024).toFixed(1)} GB RAM
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
                        <span className="font-medium">{packageData.backups} Backups</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-muted-foreground">
                        <MapPin className="h-4 w-4" />
                        <span>{packageData.location.name}</span>
                    </div>
                </div>
            </div>
        </Card>
    );
}

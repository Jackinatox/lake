'use client';

import { checkoutAction, CheckoutParams } from '@/app/actions/checkout';
import { GameConfigComponent } from '@/components/booking2/game-config';
import { HardwareConfigComponent } from '@/components/booking2/hardware-config';
import CustomServerPaymentElements from '@/components/payments/PaymentElements';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { authClient } from '@/lib/auth-client';
import { NewPriceDef } from '@/lib/GlobalFunctions/paymentLogic';
import type { Game, GameConfig, HardwareConfig } from '@/models/config';
import { PerformanceGroup } from '@/models/prisma';
import { ArrowLeft, ArrowRight, Info } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useRef, useState } from 'react';

export type ServerConfig = {
    hardwareConfig: HardwareConfig;
    gameConfig: GameConfig;
};

interface GameServerConfigProps {
    performanceGroups: PerformanceGroup[];
    game: Game;
    gameId: number;
}

export default function GameServerConfig({
    performanceGroups,
    game,
    gameId,
}: GameServerConfigProps) {
    const session = authClient.useSession();
    const t = useTranslations('buyGameServer');

    const [clientSecret, setClientSecret] = useState('');
    const [step, setStep] = useState(1);
    const [hardwareConfig, setHardwareConfig] = useState<HardwareConfig | null>(null);
    const [totalPrice, setTotalPrice] = useState<number>(0);
    const { toast } = useToast();
    const hardwareConfigRef = useRef<any>(null);
    const gameConfigRef = useRef<any>(null);

    const handleHardwareConfigNext = (config: HardwareConfig) => {
        setHardwareConfig(config);
        setStep(2);
    };

    const handlePriceChange = (price: NewPriceDef) => {
        setTotalPrice(price.totalCents);
    };

    const handleGameConfigSubmit = async (gameSpecificConfig: GameConfig) => {
        if (!hardwareConfig) return;

        const checkouParams: CheckoutParams = {
            type: 'NEW',
            cpuPercent: hardwareConfig.cpuPercent,
            diskMB: hardwareConfig.diskMb,
            ramMB: hardwareConfig.ramMb,
            duration: hardwareConfig.durationsDays,
            ptServerId: null,
            creationServerConfig: {
                gameConfig: gameSpecificConfig,
                hardwareConfig: hardwareConfig,
            },
        };

        try {
            const clientSecret = (await checkoutAction(checkouParams))?.client_secret;
            if (!clientSecret) throw new Error('No client secret returned');
            setClientSecret(clientSecret);

            setStep(3);
        } catch (error) {
            console.error('Error submitting server configuration:', error);
            toast({
                title: 'Error',
                description: JSON.stringify(error),
                variant: 'destructive',
            });
        }
    };

    const handleNextStep = () => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
        if (step === 1 && hardwareConfigRef.current) {
            hardwareConfigRef.current.submit();
        } else if (step === 2 && gameConfigRef.current) {
            gameConfigRef.current.submit();
        }
    };

    return (
        <div className="min-h-screen bg-background md:-my-4">
            {/* Header with step indicator - STICKY TO TOP */}
            <div className="sticky top-0 z-10 bg-background/80 backdrop-blur-md border-b py-4">
                <div className="w-full px-1 max-w-7xl mx-auto">
                    <div className="flex items-center justify-between gap-4">
                        <h1 className="text-xl sm:text-2xl font-bold">{t('header.title')}</h1>
                        <div className="flex items-center gap-4">
                            <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-primary/10 border border-primary/20">
                                <span className="text-sm text-muted-foreground hidden sm:inline">
                                    Total:
                                </span>
                                <span className="text-lg sm:text-xl font-bold text-primary">
                                    €{(totalPrice / 100).toFixed(2)}
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* Progress indicator */}
                    <div className="mt-4 flex gap-2">
                        {[1, 2, 3].map((stepNumber) => (
                            <div
                                key={stepNumber}
                                className={`h-2 flex-1 rounded ${
                                    stepNumber === step
                                        ? 'bg-primary'
                                        : stepNumber < step
                                          ? 'bg-primary/60'
                                          : 'bg-muted'
                                }`}
                            />
                        ))}
                    </div>
                </div>
            </div>

            {/* Main content with padding for sticky footer */}
            <div className="w-full pt-4 pb-28 max-w-7xl mx-auto">
                {step === 1 && (
                    <div className="bg-card border rounded-lg p-2 md:p-6">
                        <HardwareConfigComponent
                            ref={hardwareConfigRef}
                            performanceOptions={performanceGroups}
                            onNext={handleHardwareConfigNext}
                            onPriceChange={handlePriceChange}
                            initialConfig={hardwareConfig}
                        />
                    </div>
                )}

                {step === 2 && game && (
                    <div className="bg-card border rounded-lg p-2 md:p-6">
                        <GameConfigComponent
                            ref={gameConfigRef}
                            game={game}
                            onSubmit={handleGameConfigSubmit}
                        />
                    </div>
                )}

                {step === 3 && (
                    <div className="max-w-4xl mx-auto">
                        <div className="bg-card border rounded-lg p-2 md:p-6">
                            <h2 className="text-2xl font-bold mb-6">{t('payment.title')}</h2>
                            <CustomServerPaymentElements clientSecret={clientSecret} />
                        </div>
                    </div>
                )}
            </div>

            {/* Sticky bottom navigation */}
            <div className="sticky bottom-0 z-10 bg-background/95 backdrop-blur-md border-t p-4">
                <div className="w-full max-w-7xl mx-auto">
                    <div className="flex flex-col-reverse sm:flex-row justify-between items-center gap-4">
                        {step > 1 && (
                            <Button
                                variant="outline"
                                onClick={() => {
                                    window.scrollTo({ top: 0, behavior: 'smooth' });
                                    setStep(step - 1);
                                }}
                                className="w-full sm:w-auto"
                            >
                                <ArrowLeft className="mr-2 h-4 w-4" />
                                {t('nav.back')}
                            </Button>
                        )}
                        {step < 3 && (
                            <>
                                <>
                                    {!session?.data?.user && (
                                        <div className="flex items-center gap-2 w-full sm:w-auto mb-2 sm:mb-0">
                                            <Info className="shrink-0" />
                                            <span className="text-sm">
                                                {t('auth.loginRequiredGameConfig')}
                                            </span>
                                        </div>
                                    )}
                                </>
                                <Button
                                    onClick={handleNextStep}
                                    className="w-full sm:w-auto sm:ml-auto"
                                    disabled={(!session?.data?.user && step >= 2)}
                                >
                                    {t('nav.continue')}
                                    <ArrowRight className="ml-2 h-4 w-4" />
                                </Button>
                            </>
                        )}
                        {step === 3 && (
                            <div className="text-sm text-muted-foreground sm:ml-auto">
                                {t('payment.footerHint')}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}

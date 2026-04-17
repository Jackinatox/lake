'use client';

import { checkoutAction, CheckoutParams } from '@/app/actions/checkout/checkout';
import CustomServerPaymentElements from '@/components/payments/PaymentElements';
import { Button } from '@/components/ui/button';
import { toast } from '@/hooks/use-toast';
import { getValidationMessage } from '@/lib/validation/common';
import { checkoutUpgradeParamsSchema } from '@/lib/validation/order';
import { HardwareConfig } from '@/models/config';
import { PerformanceGroup } from '@/models/prisma';
import { ArrowLeft, Lock, ShieldCheck } from 'lucide-react';
import Link from 'next/link';
import React from 'react';
import { UpgradeHardwareConfig } from './UpgradeHardwareConfig';
import { useLakeLocale } from '@/hooks/useLakeLocale';
import { useSearchParams } from 'next/navigation';
import { useTranslations } from 'next-intl';

interface UpgradeGameServerProps {
    serverId: string;
    apiKey: string;
    performanceOptions: PerformanceGroup[];
    minOptions: HardwareConfig;
}

function UpgradeGameServer({ serverId, performanceOptions, minOptions }: UpgradeGameServerProps) {
    const searchParams = useSearchParams();
    const initialDays = searchParams.get('extend') === '30' ? 30 : undefined;
    const [step, setStep] = React.useState<'configure' | 'pay'>('configure');
    const [selectedConfig, setSelectedConfig] = React.useState<HardwareConfig | null>(null);
    const [clientSecret, setClientSecret] = React.useState<string | null>(null);
    const [loading, setLoading] = React.useState(false);
    const locale = useLakeLocale();
    const t = useTranslations('upgradeCheckout');

    const handleBackToConfigure = React.useCallback(() => {
        setSelectedConfig(null);
        setClientSecret(null);
        setStep('configure');
    }, []);

    const handleNext = async (newHardwareConfig: HardwareConfig) => {
        const params: CheckoutParams = {
            type: 'UPGRADE',
            locale: locale,
            ptServerId: serverId,
            upgradeConfig: newHardwareConfig,
        };

        try {
            const parsedParams = checkoutUpgradeParamsSchema.safeParse(params);
            if (!parsedParams.success) {
                throw new Error(getValidationMessage(parsedParams.error));
            }

            setLoading(true);
            setSelectedConfig(newHardwareConfig);
            const secret = await checkoutAction(parsedParams.data);

            setClientSecret((secret as { client_secret: string }).client_secret);
            setStep('pay');
        } catch (error) {
            console.error('Error during checkout:', error);
            toast({
                title: t('errorTitle'),
                description: t('errorDescription'),
                variant: 'destructive',
            });
        } finally {
            setLoading(false);
        }
    };

    if (step === 'pay' && clientSecret) {
        return (
            <div className="md:-my-4 w-full">
                {/* Sticky top bar */}
                <div className="sticky top-0 z-10 bg-background/80 backdrop-blur-md border-b py-3">
                    <div className="w-full px-4 max-w-7xl mx-auto">
                        <div className="flex items-center gap-3">
                            <Button
                                variant="ghost"
                                size="icon"
                                className="shrink-0"
                                onClick={handleBackToConfigure}
                            >
                                <ArrowLeft className="h-4 w-4" />
                            </Button>
                            <div className="flex-1 min-w-0">
                                <h1 className="text-base sm:text-lg font-bold leading-tight">
                                    Payment
                                </h1>
                                <p className="text-xs text-muted-foreground hidden sm:block">
                                    Final step — secure checkout
                                </p>
                            </div>
                            <Lock className="h-4 w-4 text-muted-foreground shrink-0" />
                        </div>

                        {/* Progress: step 2 of 2 */}
                        <div className="mt-2 flex gap-2">
                            <div className="h-1.5 flex-1 rounded bg-primary" />
                            <div className="h-1.5 flex-1 rounded bg-primary" />
                        </div>
                    </div>
                </div>

                {/* Content */}
                <div className="w-full pt-4 pb-28 max-w-2xl mx-auto px-4">
                    <CustomServerPaymentElements clientSecret={clientSecret} />
                </div>

                {/* Sticky bottom bar */}
                <div className="sticky bottom-0 z-10 bg-background/95 backdrop-blur-md border-t p-4">
                    <div className="w-full max-w-7xl mx-auto flex items-center justify-between gap-4">
                        <Button variant="outline" onClick={handleBackToConfigure}>
                            <ArrowLeft className="h-4 w-4 mr-2" />
                            {t('backToConfig')}
                        </Button>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <ShieldCheck className="h-4 w-4 shrink-0" />
                            <span className="hidden sm:inline">
                                256-bit SSL · Secured by Stripe
                            </span>
                            <span className="sm:hidden">Secured by Stripe</span>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-4">
            {step === 'configure' && (
                <>
                    <Button variant="outline" size="sm" asChild>
                        <Link href={`/gameserver/${serverId}`}>{t('goBack')}</Link>
                    </Button>
                    <UpgradeHardwareConfig
                        performanceOptions={performanceOptions}
                        initialConfig={selectedConfig ?? minOptions}
                        onNext={handleNext}
                        initialDays={initialDays}
                    />
                </>
            )}

            {loading && <div className="text-sm text-muted-foreground">{t('preparing')}</div>}
        </div>
    );
}

export default UpgradeGameServer;

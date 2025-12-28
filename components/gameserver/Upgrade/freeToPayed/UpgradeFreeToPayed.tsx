'use client';

import { checkoutAction, CheckoutParams } from '@/app/actions/checkout/checkout';
import CustomServerPaymentElements from '@/components/payments/PaymentElements';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { toast } from '@/hooks/use-toast';
import { useLakeLocale } from '@/hooks/useLakeLocale';
import { HardwareConfig } from '@/models/config';
import { PerformanceGroup } from '@/models/prisma';
import React from 'react';
import { UpgradeHardwareConfigToPayed } from './UpgradeToPayedComponent';

interface UpgradeGameServerProps {
    serverId: string;
    performanceOptions: PerformanceGroup[];
    minOptions: HardwareConfig;
}

function UpgradeGameServerFromFree({
    serverId,
    performanceOptions,
    minOptions,
}: UpgradeGameServerProps) {
    const [step, setStep] = React.useState<'configure' | 'pay'>('configure');
    const [selectedConfig, setSelectedConfig] = React.useState<HardwareConfig | null>(null);
    const [clientSecret, setClientSecret] = React.useState<string | null>(null);
    const [loading, setLoading] = React.useState(false);
    const locale = useLakeLocale();

    const handleBackToConfigure = React.useCallback(() => {
        setSelectedConfig(null);
        setClientSecret(null);
        setStep('configure');
    }, []);

    const handleNext = async (hardwareConfig: HardwareConfig) => {
        const params: CheckoutParams = {
            type: 'TO_PAYED',
            locale: locale,
            hardwareConfig: hardwareConfig,
            ptServerId: serverId,
        };

        try {
            setLoading(true);
            setSelectedConfig(hardwareConfig);
            const secret = await checkoutAction(params);

            setClientSecret((secret as { client_secret: string }).client_secret);
            setStep('pay');
        } catch (error) {
            console.error('Error during checkout:', error);
            toast({
                title: 'Checkout Error',
                description: 'An error occurred during the checkout process.',
                variant: 'destructive',
            });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="space-y-4">
            {step === 'configure' && (
                <>
                    <UpgradeHardwareConfigToPayed
                        performanceOptions={performanceOptions}
                        initialConfig={selectedConfig ?? minOptions}
                        onNext={handleNext}
                    />
                </>
            )}

            {step === 'pay' && clientSecret && (
                <Card className="w-full max-w-4xl mx-auto space-y-6 p-4 md:p-6">
                    <Button variant="outline" onClick={() => handleBackToConfigure()}>
                        ← Back to configuration
                    </Button>
                    <div className="w-full">
                        <CustomServerPaymentElements
                            className="w-full"
                            clientSecret={clientSecret}
                        />
                    </div>
                </Card>
            )}

            {loading && <div className="text-sm text-muted-foreground">Preparing checkout…</div>}
        </div>
    );
}
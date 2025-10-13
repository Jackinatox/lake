"use client"

import { HardwareConfig } from '@/models/config';
import { PerformanceGroup } from '@/models/prisma';
import React from 'react'
import { UpgradeHardwareConfig } from './UpgradeHardwareConfig';
import { checkoutAction, CheckoutParams } from '@/app/actions/checkout';
import { toast } from '@/hooks/use-toast';
import CustomServerPaymentElements from '@/components/payments/PaymentElements';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

interface UpgradeGameServerProps {
    serverId: string;
    apiKey: string;
    performanceOptions: PerformanceGroup[];
    minOptions: HardwareConfig;
}

function UpgradeGameServer({ serverId, performanceOptions, minOptions }: UpgradeGameServerProps) {
    const router = useRouter();
    const [step, setStep] = React.useState<'configure' | 'pay'>('configure');
    const [selectedConfig, setSelectedConfig] = React.useState<HardwareConfig | null>(null);
    const [clientSecret, setClientSecret] = React.useState<string | null>(null);
    const [loading, setLoading] = React.useState(false);

    const handleBackToConfigure = React.useCallback(() => {
        setSelectedConfig(null);
        setClientSecret(null);
        setStep('configure');
    }, []);

    const handleNext = async (newHardwareConfig: HardwareConfig) => {
        const params: CheckoutParams = {
            type: 'UPGRADE',
            ptServerId: serverId,
            cpuPercent: newHardwareConfig.cpuPercent,
            diskMB: newHardwareConfig.diskMb,
            duration: newHardwareConfig.durationsDays,
            ramMB: newHardwareConfig.ramMb
        }

        try {
            setLoading(true);
            setSelectedConfig(newHardwareConfig);
            const secret = await checkoutAction(params);

            setClientSecret((secret as { client_secret: string }).client_secret);
            setStep('pay');


        } catch (error) {
            console.error("Error during checkout:", error);
            toast({
                title: "Checkout Error",
                description: "An error occurred during the checkout process.",
                variant: "destructive"
            });
        } finally {
            setLoading(false);
        }


    }

    return (
        <div className="space-y-4">
            {step === 'configure' && (
                <>
                    <Button variant="outline" size="sm" asChild>
                        <Link href={`/gameserver/${serverId}`}>
                            ← Go back
                        </Link>
                    </Button>
                    <UpgradeHardwareConfig
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
                        <CustomServerPaymentElements className="w-full" clientSecret={clientSecret} />
                    </div>
                </Card>
            )}

            {loading && (
                <div className="text-sm text-muted-foreground">Preparing checkout…</div>
            )}
        </div>
    )
}

export default UpgradeGameServer
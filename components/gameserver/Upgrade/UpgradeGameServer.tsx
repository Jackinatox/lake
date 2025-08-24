"use client"

import { HardwareConfigComponent } from '@/components/booking2/hardware-config';
import { HardwareConfig } from '@/models/config';
import { PerformanceGroup } from '@/models/prisma';
import React from 'react'
import { UpgradeHardwareConfig } from './UpgradeHardwareConfig';
import { checkoutAction, CheckoutParams } from '@/app/actions/checkout';
import { toast } from '@/hooks/use-toast';

interface UpgradeGameServerProps {
    serverId: string;
    apiKey: string;
    performanceOptions: PerformanceGroup[];
    minOptions: HardwareConfig;
}

function UpgradeGameServer({ serverId, apiKey, performanceOptions, minOptions }: UpgradeGameServerProps) {
    const handleNext = async (newHardwareConfig: HardwareConfig) => {
        const params: CheckoutParams = {
            type: 'UPGRADE',
            gameServerId: serverId,
            cpuPercent: newHardwareConfig.cpuPercent,
            diskMB: newHardwareConfig.diskMb,
            duration: newHardwareConfig.durationsDays,
            ramMB: newHardwareConfig.ramMb
        }

        try {

            const clientSecret = await checkoutAction(params);
            toast({
                title: "Checkout Successful",
                description: `client secret: ${clientSecret}`,
                variant: "default"
            });
        } catch (error) {
            console.error("Error during checkout:", error);
            toast({
                title: "Checkout Error",
                description: "An error occurred during the checkout process.",
                variant: "destructive"
            });
        }


    }

    return (
        <>
            <UpgradeHardwareConfig performanceOptions={performanceOptions} initialConfig={minOptions} onNext={handleNext} />
        </>
    )
}

export default UpgradeGameServer
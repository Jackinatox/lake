"use client"

import { HardwareConfigComponent } from '@/components/booking2/hardware-config';
import { HardwareConfig } from '@/models/config';
import { PerformanceGroup } from '@/models/prisma';
import React from 'react'
import { UpgradeHardwareConfig } from './UpgradeHardwareConfig';

interface UpgradeGameServerProps {
    serverId: string;
    apiKey: string;
    performanceOptions: PerformanceGroup[];
    minOptions: HardwareConfig;
}

function UpgradeGameServer({ serverId, apiKey, performanceOptions, minOptions }: UpgradeGameServerProps) {

    try {
        

    } catch (error) {

    }

    const handleNext = () => {

    }

    return (<>
        <div>UpgradeGameServer for {serverId}</div>


        <UpgradeHardwareConfig performanceOptions={performanceOptions} initialConfig={minOptions} onNext={handleNext} />
    </>
    )
}

export default UpgradeGameServer
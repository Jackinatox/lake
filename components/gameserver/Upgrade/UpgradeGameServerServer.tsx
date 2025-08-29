import { fetchPerformanceGroups } from '@/lib/actions';
import UpgradeGameServer from './UpgradeGameServer';
import React from 'react';
import { getGameServerConfig } from '@/app/data-access-layer/gameServer/getGameServerConfig';
import NotAllowedMessage from '@/components/auth/NotAllowedMessage';

interface UpgradeGameServerServerProps {
    serverId: string;
    apiKey: string;
}

// Server component to fetch data and pass to client component
export default async function UpgradeGameServerServer({ serverId, apiKey }: UpgradeGameServerServerProps) {
    const performanceOptions = await fetchPerformanceGroups();
    const minOptions = await getGameServerConfig(serverId);

    if (!minOptions) {
        return <NotAllowedMessage />
    }


    return (
        <div className='w-full max-w-7xl mx-auto'>
            <UpgradeGameServer serverId={serverId} apiKey={apiKey} performanceOptions={performanceOptions} minOptions={minOptions} />
        </div>);
}

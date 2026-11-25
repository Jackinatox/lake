import NotAllowedMessage from '@/components/auth/NotAllowedMessage';
import { loadUpgradeContext } from '@/lib/upgrade/loadUpgradeContext';
import { fetchServerUsage } from '@/lib/upgrade/serverUsage';
import UpgradeGameServer from './UpgradeGameServer';

interface UpgradeGameServerServerProps {
    serverId: string;
    apiKey: string;
    userId: string;
}

export default async function UpgradeGameServerServer({
    serverId,
    apiKey,
    userId,
}: UpgradeGameServerServerProps) {
    const [ctx, usage] = await Promise.all([
        loadUpgradeContext(serverId, userId),
        fetchServerUsage(serverId, apiKey),
    ]);

    if (!ctx) {
        return <NotAllowedMessage />;
    }

    return (
        <div className="w-full max-w-7xl mx-auto">
            <UpgradeGameServer
                serverId={serverId}
                location={ctx.location}
                current={ctx.current}
                currentTier={ctx.currentTier}
                tiers={ctx.tierOptions}
                usage={usage}
                // Taken once on the server so the server and client render the same price;
                // checkoutAction recomputes it at the moment of checkout.
                remainingMs={ctx.server.expires.getTime() - Date.now()}
            />
        </div>
    );
}

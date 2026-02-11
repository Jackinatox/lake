'use server';

import { getUserServer } from '@/app/data-access-layer/clientServers/getUsersServer';
import { auth } from '@/auth';
import NotLoggedIn from '@/components/auth/NoAuthMessage';
import { ServerCard } from '@/components/gameserver/GameServerList/GameServerCard';
import { Button } from '@/components/ui/button';
import { ClientServer } from '@/models/prisma';
import { Settings } from 'lucide-react';
import { headers } from 'next/headers';
import Link from 'next/link';

// Sub-component for the page header
const PageHeader = () => (
    <div className="mb-8">
        <h1 className="text-4xl font-bold text-slate-900 dark:text-slate-100 mb-2">Game Servers</h1>
        <p className="text-slate-600 dark:text-slate-400">All Deine Server</p>
    </div>
);

// Sub-component for the list of servers
const ServerList = ({ servers, apiKey }: { servers: ClientServer[]; apiKey: string }) => (
    <div className="space-y-4">
        {servers.map((server) => (
            <ServerCard key={server.id} server={server} apiKey={apiKey} />
        ))}
    </div>
);

// Sub-component for the message when no servers are found
const NoServersMessage = () => (
    <div className="text-center py-12">
        <div className="w-24 h-24 mx-auto mb-4 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center">
            <Settings className="w-12 h-12 text-slate-400" />
        </div>
        <h3 className="text-xl font-semibold text-slate-900 dark:text-slate-100 mb-2">
            No servers found
        </h3>
        <p className="text-slate-600 dark:text-slate-400 mb-6">
            Get started by creating your first game server
        </p>
    </div>
);

// Main component
export default async function GameServersPage() {
    const session = await auth.api.getSession({
        headers: await headers(),
    });

    if (!session || !session.user || !session.user.ptKey) {
        return <NotLoggedIn />;
    }

    const clientServers = await getUserServer(session.user.id);

    if (!clientServers) {
        return <div>Failed to load servers.</div>;
    }

    return (
        <div className="min-h-screen">
            <div className="container mx-auto px-0 py-8 max-w-4xl">
                <PageHeader />
                {clientServers.length > 0 ? (
                    <ServerList servers={clientServers} apiKey={session?.user?.ptKey} />
                ) : (
                    <NoServersMessage />
                )}
                <div className="mt-8 text-center">
                    <Link href={'/order'}>
                        <Button size="lg" variant="outline">
                            Add New Server
                        </Button>
                    </Link>
                </div>
            </div>
        </div>
    );
}

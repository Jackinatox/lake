'use server';

import { getUserServer } from '@/app/data-access-layer/clientServers/getUsersServer';
import { auth } from '@/auth';
import NotLoggedIn from '@/components/auth/NoAuthMessage';
import { ServerCard } from '@/components/gameserver/GameServerList/GameServerCard';
import { Button } from '@/components/ui/button';
import { ClientServer } from '@/models/prisma';
import { Plus, Server } from 'lucide-react';
import { headers } from 'next/headers';
import Link from 'next/link';

const PageHeader = ({ count }: { count: number }) => (
    <div className="mb-8 flex items-start justify-between gap-4">
        <div>
            <h1 className="text-3xl font-bold tracking-tight mb-1">Gameservers</h1>
            <p className="text-sm text-muted-foreground">
                {count > 1 ? `${count} Server` : 'All Deine Server'}
            </p>
        </div>
        <Link href="/order">
            <Button size="sm" className="shrink-0 gap-1.5">
                <Plus className="w-4 h-4" />
                New Server
            </Button>
        </Link>
    </div>
);

const ServerList = ({ servers, apiKey }: { servers: ClientServer[]; apiKey: string }) => (
    <div className="space-y-3">
        {servers.map((server) => (
            <ServerCard
                key={server.id}
                server={server}
                apiKey={apiKey}
                isFreeServer={server.type === 'FREE'}
            />
        ))}
    </div>
);

const NoServersMessage = () => (
    <div className="text-center py-16 border border-dashed rounded-xl">
        <div className="w-16 h-16 mx-auto mb-4 bg-muted rounded-full flex items-center justify-center">
            <Server className="w-8 h-8 text-muted-foreground" />
        </div>
        <h3 className="text-lg font-semibold mb-1">No servers yet</h3>
        <p className="text-sm text-muted-foreground mb-6">
            Get started by creating your first gameserver
        </p>
        <Link href="/order">
            <Button className="gap-1.5">
                <Plus className="w-4 h-4" />
                Create Server
            </Button>
        </Link>
    </div>
);

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
                <PageHeader count={clientServers.length} />
                {clientServers.length > 0 ? (
                    <>
                        <ServerList servers={clientServers} apiKey={session.user.ptKey} />
                        <div className="mt-6 text-center">
                            <Link href="/order">
                                <Button variant="outline" size="sm" className="gap-1.5">
                                    <Plus className="w-4 h-4" />
                                    Add Another Server
                                </Button>
                            </Link>
                        </div>
                    </>
                ) : (
                    <NoServersMessage />
                )}
            </div>
        </div>
    );
}

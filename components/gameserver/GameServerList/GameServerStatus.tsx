'use client';

import { Badge } from '@/components/ui/badge';
import React, { useEffect, useState } from 'react';
import { Status } from '../Console/status';
import { ClientServer } from '@/models/prisma';
import { getActiveSuspension } from '@/lib/gameserver/suspension';

function GameServerStatus({ server, apiKey }: { server: ClientServer; apiKey: string }) {
    const [loading, setLoading] = useState(true);
    const [status, setStatus] = useState('Loading');
    const suspensionId = getActiveSuspension(server)?.id ?? null;

    useEffect(() => {
        const fetchStatus = async () => {
            // A suspended server rejects the client API, so don't even ask.
            if (suspensionId) {
                setLoading(false);
                setStatus('suspended');
                return;
            }

            // Only fetch data if server  status is not expired
            if (server.status === 'EXPIRED') {
                setLoading(false);
                setStatus('expired');
                return;
            }

            if (server.status === 'CREATION_FAILED') {
                setLoading(false);
                setStatus('Error');
                return;
            }

            const response = await fetch(
                `${process.env.NEXT_PUBLIC_PTERODACTYL_URL}/api/client/servers/${server.ptServerId}/resources`,
                {
                    headers: {
                        Accept: 'application/json',
                        Authorization: `Bearer ${apiKey}`,
                    },
                },
            );
            if (response.ok) {
                const data = await response.json();

                console.log(data);
                setLoading(false);
                setStatus(data.attributes.current_state || 'Loading'); // Handle installing state
            } else if (response.status === 409) {
                setStatus('installing');
            }
        };

        fetchStatus();
        const timer = setTimeout(() => setLoading(false), 5000);
        return () => clearTimeout(timer);
    }, [server.status, server.ptServerId, suspensionId, apiKey]);

    return (
        <>
            <Badge
                variant={status.toLowerCase() === 'online' ? 'default' : 'outline'}
                className="px-3 py-1"
            >
                <Status state={status}></Status>
            </Badge>
        </>
    );
}

export default GameServerStatus;

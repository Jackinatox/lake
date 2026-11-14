'use client';

import { Badge } from '@/components/ui/badge';
import React, { useEffect, useState } from 'react';
import { Status } from '../Console/status';
import { ClientServer } from '@/models/prisma';
import { getActiveSuspension } from '@/lib/gameserver/suspension';

const STATUS_POLL_INTERVAL_MS = 60_000;

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

            let response: Response;
            try {
                response = await fetch(
                    `${process.env.NEXT_PUBLIC_PTERODACTYL_URL}/api/client/servers/${server.ptServerId}/resources`,
                    {
                        headers: {
                            Accept: 'application/json',
                            Authorization: `Bearer ${apiKey}`,
                        },
                    },
                );
            } catch {
                setLoading(false);
                setStatus('Error');
                return;
            }
            setLoading(false);

            if (response.ok) {
                const data = await response.json();
                setStatus(data.attributes.current_state || 'Loading'); // Handle installing state
                return;
            }

            // 409 is PT installing the egg. 403 is PT refusing the client API, which is what a
            // suspension looks like from out here — including one lake no longer counts as
            // active because the worker has not processed it yet. Anything else must still
            // resolve to something, or the badge sits on "Loading" forever.
            if (response.status === 409) setStatus('installing');
            else if (response.status === 403) setStatus('suspended');
            else setStatus('Error');
        };

        fetchStatus();
        // Re-poll so the badge follows the live Pterodactyl state without a page reload.
        const interval = setInterval(() => {
            if (document.visibilityState === 'visible') fetchStatus();
        }, STATUS_POLL_INTERVAL_MS);
        const timer = setTimeout(() => setLoading(false), 5000);
        return () => {
            clearInterval(interval);
            clearTimeout(timer);
        };
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

'use client';

import { Badge } from '@/components/ui/badge';
import React, { useEffect, useState } from 'react';
import { env } from 'next-runtime-env';
import { Status } from '../Console/status';
import { ClientServer } from '@/models/prisma';

function GameServerStatus({ server, apiKey }: { server: ClientServer; apiKey: string }) {
    const [loading, setLoading] = useState(true);
    const [status, setStatus] = useState('Loading');

    useEffect(() => {
        // Only fetch data if server status is not expired
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

        fetch(
            `${env('NEXT_PUBLIC_PTERODACTYL_URL')}/api/client/servers/${server.ptServerId}/resources`,
            {
                headers: {
                    Accept: 'application/json',
                    Authorization: `Bearer ${apiKey}`,
                },
            },
        )
            .then((res) => res.json())
            .then((data) => {
                console.log(data);
                setLoading(false);
                setStatus(
                    data.attributes.current_state ? data.attributes.current_state : 'Loading',
                ); // Handle installing state
            });

        const timer = setTimeout(() => setLoading(false), 5000);
        return () => clearTimeout(timer);
    }, [server.status, server.ptServerId, apiKey]);

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

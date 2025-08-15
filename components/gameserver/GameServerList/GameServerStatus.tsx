"use client"

import { Badge } from '@/components/ui/badge'
import React, { useEffect, useState } from 'react'
import { Status } from '../Console/status';

function GameServerStatus({ server, apiKey }: { server: string, apiKey: string }) {
    const [loading, setLoading] = useState(true);
    const [status, setStatus] = useState("Loading");

    // Simulate loading for demonstration
    useEffect(() => {
        // Add your fetching logic here
        // Example:
        fetch(`${process.env.NEXT_PUBLIC_PTERODACTYL_URL}/api/client/servers/${server}/resources`, {
            headers: {
                Accept: "application/json",
                Authorization: `Bearer ${apiKey}`
            }
        })
            .then(res => res.json())
            .then(data => {
                // handle data
                console.log(data)
                setLoading(false);
                setStatus(data.attributes.current_state);
            });

        const timer = setTimeout(() => setLoading(false), 10000);
        return () => clearTimeout(timer);
    }, []);


    if (loading) {
        return (
            <>
                <Status state={null}></Status>
            </>
        )
    }

    return (
        <>
            <Badge
                variant={status.toLowerCase() === "online" ? "default" : "outline"}
                className="px-3 py-1"
            >
                <Status state={status}></Status>
            </Badge>
        </>
    );
}

export default GameServerStatus
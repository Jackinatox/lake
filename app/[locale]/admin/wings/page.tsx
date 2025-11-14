import React from 'react';
import WingsTable from './WingsTable';
import { Builder } from '@avionrx/pterodactyl-js';
import { env } from 'next-runtime-env';
import { auth } from '@/auth';
import { headers } from 'next/headers';
import NoAdmin from '@/components/admin/NoAdminMessage';

async function Wings() {
    const url = env('NEXT_PUBLIC_PTERODACTYL_URL');
    const apiKey = env('PTERODACTYL_API_KEY');
    const session = await auth.api.getSession({
        headers: await headers(),
    });

    if (session?.user.role !== 'admin') {
        return <NoAdmin />;
    }

    if (!url || !apiKey) {
        throw new Error('PTERODACTYL_URL and PTERODACTYL_API_KEY must be defined');
    }

    const client = new Builder().setURL(url).setAPIKey(apiKey).asAdmin();

    try {
        const wings = await client.getNodes();

        return (
            <>
                <WingsTable wings={wings}></WingsTable>
            </>
        );
    } catch (error: any) {
        return (
            <div>
                <h1>Error</h1>
                <p>{error.message}</p>
            </div>
        );
    }
}

export default Wings;

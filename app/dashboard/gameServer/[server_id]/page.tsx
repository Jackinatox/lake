"use server"

import Console from '@/components/gamegerver/dashboard/console';
import { createPtClient } from '@/lib/Pterodactyl/ptAdminClient';
import { createClient } from '@/utils/supabase/server';
import React from 'react'

async function serverCrap({ params }: { params: Promise<{ server_id: string }> }) {
    const serverId = (await params).server_id;
    const pt = createPtClient();

    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    const ptApiKey = user?.user_metadata.pt_api_Key;

    console.log('api key und server: ', ptApiKey, serverId)

    return (
        <div style={{ width: '1400px' }}>
            <div>{serverId}</div>
            <Console server={serverId} ptApiKey={ptApiKey} ></Console>
        </div>
    )
}

export default serverCrap
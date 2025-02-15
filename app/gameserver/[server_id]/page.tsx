"use server"

import GameDashboard from '@/components/gameserver/dashboard/gameDashboard';
import { createPtClient } from '@/lib/Pterodactyl/ptAdminClient';
import { createClient } from '@/utils/supabase/server';
import React from 'react'

async function serverCrap({ params }: { params: Promise<{ server_id: string }> }) {
    const serverId = (await params).server_id;

    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    const ptApiKey = user?.user_metadata.pt_api_Key;

    console.log('api key und server: ', ptApiKey, serverId)

    return (
        <>
            <GameDashboard server={serverId} ptApiKey={ptApiKey}></GameDashboard>
        </>
    )
}

export default serverCrap
"use server"
import { createPtUserClient } from '@/lib/Pterodactyl/ptUserClient';
import { createClient } from '@/utils/supabase/server';
import React from 'react'
import ServersTable from './serversTable';

async function UserServer() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const apiKey = user?.user_metadata.pt_api_Key;

  console.log('api key: ', apiKey)

  const pt = createPtUserClient(apiKey);

  const servers = await pt.getClientServers();
  
  
  return (
    <ServersTable servers={servers}></ServersTable>
  )
}

export default UserServer
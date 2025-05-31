"use server"
import { createPtUserClient } from '@/lib/Pterodactyl/ptUserClient';
import React from 'react'
import ServersTable from './serversTable';
import { auth } from '@/auth';

async function UserServer() {
  const session = await auth();

  if (!session?.user) {
    return <>Not logged in</>;
  }

  const apiKey = session?.user.ptKey;

  const pt = createPtUserClient(apiKey);

  const servers = await pt.getClientServers();
  
  
  return (
    <ServersTable servers={servers}></ServersTable>
  )
}

export default UserServer
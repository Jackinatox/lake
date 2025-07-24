"use server"
import { createPtUserClient } from '@/lib/Pterodactyl/ptUserClient';
import React from 'react'
import ServersTable from './serversTable';
import { auth } from '@/auth';
import GameServersPage from './ServerTableNew';

const baseUrl = process.env.NEXT_PUBLIC_PTERODACTYL_URL
const apiKey = process.env.PTERODACTYL_API_KEY;

if (!baseUrl || !apiKey) {
    throw new Error('PTERODACTYL_URL and PTERODACTYL_API_KEY must be defined');
}


async function UserServer({ params }: { params: Promise<{ server_id: string }> }) {
  const serverId = (await params).server_id;

  const session = await auth();

  if (!session?.user) {
    return <>Not logged in</>;
  }

  const ptApiKey = session?.user.ptKey;

  const data = await fetch(
    `${baseUrl}/api/client`,
    {
      method: "GET",
      headers: {
        Authorization: `Bearer ${ptApiKey}`,
        // Authorization: `Bearer ptlc_dUhOyxSMfmFeeAbOyOzIZiuyOXs0qX0pLEOt5F76VpP`,
        Accept: "application/json",
        "Content-Type": "application/json",
      },
    },
  )
  
  
  const response = await data.json().then(data => data.data);


  if (data.status === 403 || data.status === 404) {
    console.error('auth error to pt API', data);
    return <>Auth error</>
  }

  if (!data.ok) {
    console.error('error from pt API', data);
    return <>An error occured</>
  }



  return (
    <GameServersPage servers={response}></GameServersPage>
  )
}

export default UserServer
"use server"
import { createPtUserClient } from '@/lib/Pterodactyl/ptUserClient';
import React, { Suspense } from 'react'
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

  return (
    <Suspense fallback={<>loading</>}>
      <GameServersPage></GameServersPage>
    </Suspense>
  )
}

export default UserServer
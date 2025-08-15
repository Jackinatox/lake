"use server"
import { createPtUserClient } from '@/lib/Pterodactyl/ptUserClient';
import React, { Suspense } from 'react'
import { auth } from '@/auth';
import GameServersPage from './ServerTable';
import NotLoggedIn from '@/components/auth/NoAuthMessage';

const baseUrl = process.env.NEXT_PUBLIC_PTERODACTYL_URL
const apiKey = process.env.PTERODACTYL_API_KEY;

if (!baseUrl || !apiKey) {
  throw new Error('PTERODACTYL_URL and PTERODACTYL_API_KEY must be defined');
}


async function UserServer() {
  const session = await auth();

  if (!session?.user) {
    return <NotLoggedIn />;
  }

  return (

    <Suspense fallback={<>loading</>}>
        <GameServersPage></GameServersPage>
    </Suspense>
  )
}

export default UserServer
"use server"

import { auth } from '@/auth';
import NoAdmin from '@/components/admin/NoAdminMessage';
import { prisma } from '@/prisma';
import { Builder } from "@avionrx/pterodactyl-js";
import GameserversTable from './GameserversTable';
import { headers } from 'next/headers';
import { redirect } from 'next/navigation';

async function Gameservers() {
  const session = await auth.api.getSession({
    headers: await headers()
  })

  if (session?.user.role !== "admin") {
    return <NoAdmin />;
  }

  try {
    const gameservers = await prisma.gameServer.findMany({
      take: 400,
      include: {
        user: { select: { email: true } },
        location: { select: { name: true } }
      }
    });

    return (
      <>
        <GameserversTable servers={gameservers}></GameserversTable>
      </>
    );
  } catch (error: any) {
    return (
      <div>
        <h1 className='text-red-600 font-bold'>Error</h1>
        <p>{error.message}</p>
      </div>
    );
  }
}

export default Gameservers
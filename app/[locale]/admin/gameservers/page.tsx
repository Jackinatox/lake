import { auth } from '@/auth';
import NoAdmin from '@/components/admin/NoAdminMessage';
import { prisma } from '@/prisma';
import { Builder } from "@avionrx/pterodactyl-js";
import GameserversTable from './GameserversTable';

async function Gameservers() {
  const session = await auth();

  if (session?.user.role !== 'ADMIN') {
    return <NoAdmin />;
  }

  const url = process.env.NEXT_PUBLIC_PTERODACTYL_URL;
  const apiKey = process.env.PTERODACTYL_API_KEY;

  if (!url || !apiKey) {
    throw new Error('PTERODACTYL_URL and PTERODACTYL_API_KEY must be defined');
  }

  const client = new Builder().setURL(url).setAPIKey(apiKey).asAdmin();

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
        <h1>Error</h1>
        <p>{error.message}</p>
      </div>
    );
  }
}

export default Gameservers
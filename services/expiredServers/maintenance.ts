import { prisma } from '../../prisma'
import { handleExpired } from './handleExpired';
import { workerState } from './status';

export async function findExpired() {
  console.log("running maintanance")
  if (workerState.expiredServers.state === 'running') {
    console.log("Maintenance already running, skipping")
    return;
  }

  workerState.expiredServers.state = 'running';

  const now = new Date();
  let totalNotified = 0

  const count = await prisma.gameServer.count({
    where: { expires: { lte: now }, status: { notIn: ['EXPIRED', 'DELETED'] } },
  })
  workerState.expiredServers.total = count;
  workerState.expiredServers.processed = 0;
  console.log(`Found ${count} expired servers`)

  while (true) {
    const expiring = await prisma.gameServer.findMany({
      where: { expires: { lte: now }, status: { notIn: ['EXPIRED', 'DELETED'] } },
      take: 100,
      orderBy: { expires: 'asc' },
    })

    if (expiring.length === 0) break

    for (const s of expiring) {
      workerState.expiredServers.processed += 1;
      console.log(`Notifying server ${s.id} of upcoming expiration at ${s.expires}`)
      await handleExpired(s);

      // await new Promise((resolve) => setTimeout(resolve, 20)); // Throttle to not overwhelm db and email service
    }

    totalNotified += expiring.length
  }
  console.log(`Maintenance complete. Notified: ${totalNotified}`)

  workerState.expiredServers.state = 'completed';
}

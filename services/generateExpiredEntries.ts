import { prisma } from "@/prisma";
import { GameServerStatus } from "@prisma/client";

/**
 * Generates 5000 expired game servers with random expiry dates in the past
 * Each server will have random specifications within realistic bounds
 * @param count Number of servers to generate (default: 5000)
 */
export async function generateExpiredServers(count: number = 5000) {
  console.log(`Starting generation of ${count} expired servers...`);
  
  // First, get available game data, locations, and users
  const [gameData, locations, users] = await Promise.all([
    prisma.gameData.findMany({ where: { enabled: true } }),
    prisma.location.findMany({ where: { enabled: true } }),
    prisma.user.findMany({ take: 100 }) // Get up to 100 users to distribute servers among
  ]);

  if (gameData.length === 0 || locations.length === 0) {
    throw new Error('No enabled game data or locations found. Please run the seed script first.');
  }

  if (users.length === 0) {
    console.log('No users found. Creating test users...');
    const testUsers = [];
    for (let i = 1; i <= 10; i++) {
      testUsers.push({
        id: `test-user-${i}`,
        name: `Test User ${i}`,
        email: `testuser${i}@example.com`,
        emailVerified: true,
        ptUsername: `testuser${i}`
      });
    }

    await prisma.user.createMany({
      data: testUsers,
      skipDuplicates: true
    });

    // Refresh users array
    const newUsers = await prisma.user.findMany({ take: 100 });
    users.push(...newUsers);
    console.log(`Created ${testUsers.length} test users`);
  }

  console.log(`Found ${gameData.length} game types, ${locations.length} locations, and ${users.length} users`);

  const batchSize = 100; // Process in batches to avoid memory issues
  const totalServers = count;
  const batches = Math.ceil(totalServers / batchSize);

  for (let batch = 0; batch < batches; batch++) {
    const serversInThisBatch = batch === batches - 1 ? totalServers % batchSize || batchSize : batchSize;
    const servers = [];

    for (let i = 0; i < serversInThisBatch; i++) {
      const randomUser = users[Math.floor(Math.random() * users.length)];
      const randomGameData = gameData[Math.floor(Math.random() * gameData.length)];
      const randomLocation = locations[Math.floor(Math.random() * locations.length)];
      
      // Generate random expiry date between 1 year ago and 1 day ago
      const now = new Date();
      const oneYearAgo = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
      const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
      const randomExpiry = new Date(oneYearAgo.getTime() + Math.random() * (oneDayAgo.getTime() - oneYearAgo.getTime()));

      // Random server specs within realistic bounds
      const ramMB = [1024, 2048, 4096, 8192, 16384][Math.floor(Math.random() * 5)]; // 1GB to 16GB
      const cpuPercent = [25, 50, 75, 100, 150, 200][Math.floor(Math.random() * 6)]; // 25% to 200%
      const diskMB = [5000, 10000, 20000, 50000, 100000][Math.floor(Math.random() * 5)]; // 5GB to 100GB
      const backupCount = Math.floor(Math.random() * 10) + 1; // 1 to 10 backups
      const price = Math.round((ramMB * 0.001 + cpuPercent * 0.05 + diskMB * 0.0001) * 100) / 100; // Simple pricing formula

      servers.push({
        userId: randomUser.id,
        ramMB,
        cpuPercent,
        diskMB,
        backupCount,
        expires: randomExpiry,
        price,
        name: `ExpiredServer_${batch * batchSize + i + 1}`,
        status: GameServerStatus.EXPIRED,
        gameDataId: randomGameData.id,
        locationId: randomLocation.id,
        gameConfig: {
          flavor: 'auto-generated-expired',
          version: '1.20.1',
          seed: Math.floor(Math.random() * 1000000).toString()
        }
      });
    }

    // Insert batch
    await prisma.gameServer.createMany({
      data: servers
    });

    console.log(`Generated batch ${batch + 1}/${batches} (${serversInThisBatch} servers)`);
  }

  console.log(`Successfully generated ${totalServers} expired servers!`);
  
  // Return some statistics
  const stats = await prisma.gameServer.groupBy({
    by: ['status'],
    _count: {
      id: true
    },
    where: {
      status: GameServerStatus.EXPIRED
    }
  });

  return {
    totalGenerated: totalServers,
    statistics: stats
  };
}

/**
 * Main execution function - can be called directly or used as a module
 */
export async function main() {
  try {
    const result = await generateExpiredServers();
    console.log('\n=== Generation Complete ===');
    console.log(`Total servers generated: ${result.totalGenerated}`);
    console.log('Statistics:', result.statistics);
    
    await prisma.$disconnect();
    return result;
  } catch (error) {
    console.error('Error generating expired servers:', error);
    await prisma.$disconnect();
    throw error;
  }
}

/**
 * Utility function to get count of expired servers
 */
export async function getExpiredServersCount() {
  const count = await prisma.gameServer.count({
    where: {
      status: GameServerStatus.EXPIRED
    }
  });
  return count;
}

/**
 * Utility function to clean up all expired servers (use with caution!)
 */
export async function cleanupExpiredServers() {
  const result = await prisma.gameServer.deleteMany({
    where: {
      status: GameServerStatus.EXPIRED
    }
  });
  console.log(`Deleted ${result.count} expired servers`);
  return result.count;
}

// If this file is run directly, execute the main function
if (require.main === module) {
  main().catch(console.error);
}


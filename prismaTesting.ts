const { PrismaClient } = require("@prisma/client");
 
const prisma = new PrismaClient()


async function main() {
  // Example: Fetch a GameServerOrder by ID
  const orderId = 5; // replace with a real ID
  const order = await prisma.gameServerOrder.findUnique({
    where: { id: orderId },
    include: { user: true, creationGameData: true, creationLocation: true }
  });
  const gameConfig = JSON.parse(order.gameConfig);
  console.log(gameConfig.dockerImage);

  // Example: Update something
  // await prisma.gameServerOrder.update({ ... });
}

main()
  .catch(e => console.error(e))
  .finally(() => prisma.$disconnect());
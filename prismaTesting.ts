import { calculateUpgradeCost } from "./lib/GlobalFunctions/paymentLogic";

const { calculateBase } = require("./lib/globalFunctions");

const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

async function main() {


  const pf = await prisma.Location.findUnique({
    where: { id: 1 },
    include: { cpu: true, ram: true }
  });

  console.log(calculateBase(pf, 200, 2048, 30));
  // Example: Update something
  // await prisma.gameServerOrder.update({ ... });
}

main()
  .catch(e => console.error(e))
  .finally(() => prisma.$disconnect());
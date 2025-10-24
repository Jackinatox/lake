import { PrismaClient } from "@prisma/client";
import createEmailExpiredServer from "./lib/email/createEmailJob";

const prisma = new PrismaClient();
// to run: pnpx ts-node prismaTesting.ts

async function main() {
  const server = await prisma.gameServer.findUnique({
    where: { id: "cmgrztbju01njbpmdx4elzph6" },
    include: { user: true }
  });

  await createEmailExpiredServer(server.id);

  // console.log(calculateBase(pf, 200, 2048, 30));
  // Example: Update something
  // await prisma.gameServerOrder.update({ ... });
}

main()
  .catch(e => console.error(e))
  .finally(() => prisma.$disconnect());
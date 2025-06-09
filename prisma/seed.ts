import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()
async function main() {
    const mc = await prisma.gameData.create({
        data: {
            data: JSON.parse('{"flavors":[{"id":0,"egg_id":2,"name":"Forge","versions":["1.20.4","1.20.2","1.19.4","1.19.2","1.18.2","1.17.1","1.16.5","1.15.2","1.14.4","1.12.2","1.8.9","1.7.10"]},{"id":1,"egg_id":4,"name":"Paper","versions":["1.20.4","1.20.2","1.19.4","1.19.2","1.18.2","1.17.1"]},{"id":2,"egg_id":3,"name":"Bungeecord","versions":["1.20.4","1.20.2","1.19.4","1.19.2","1.18.2","1.17.1","1.16.5","1.15.2","1.14.4"]},{"id":3,"egg_id":5,"name":"Vanilla","versions":["1.20.4","1.20.2","1.19.4","1.19.2","1.18.2","1.17.1","1.16.5","1.15.2","1.14.4","1.12.2","1.8.9","1.7.10"]}]}'),
            name: 'Minecraft'
        }
    });

    await prisma.cPU.create({
        data: {
            name: 'seeded', cores: 16, threads: 32, singleScore: 100, multiScore: 1000, maxThreads: 8, minThreads: 1, pricePerCore: 0.3
        }
    });

    await prisma.rAM.create({
        data: {
            name: 'DDR4 seeded', speed: 3200, pricePerGb: 0.4, minGb: 0.5, maxGb: 12
        }
    })

    await prisma.location.create({
        data: {
            name: 'Stone', diskPrice: 0.5, portsLimit: 2, backupsLimit: 2, enabled: true, ptLocationId: 1, cpu: { connect: { id: 1 } }, ram: { connect: { id: 1 } }
        }
    })

}
main()
    .then(async () => {
        await prisma.$disconnect()
    })
    .catch(async (e) => {
        console.error(e)
        await prisma.$disconnect()
        process.exit(1)
    })
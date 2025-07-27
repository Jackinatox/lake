"use server"

import { ServerConfig } from "./page";
import { auth } from "@/auth";
import { calculateTotal } from "@/components/booking2/hardware-config";
import { prisma } from "@/prisma";

export async function createServerOrder(serverConfig: ServerConfig): Promise<string> {
    serverConfig.hardwareConfig.pfGroupId

    const session = await auth();
    const cpuCores = serverConfig.hardwareConfig.cpuCores;
    const ramGB = serverConfig.hardwareConfig.ramGb;
    const diskMb = serverConfig.hardwareConfig.diskMb;
    const days = serverConfig.hardwareConfig.durationsDays;

    if ((!session?.user) || cpuCores <= 0 || ramGB <= 0)
        return '';

    const pfGroup = await prisma.location.findUnique({
        where: { id: serverConfig.hardwareConfig.pfGroupId },
        include: {
            cpu: true,
            ram: true,
        }
    });

    const expDate = new Date();
    expDate.setDate(expDate.getDate() + days);


    const created = await prisma.serverOrder.create({
        data: {
            location: { connect: { id: pfGroup.id } },
            user: { connect: { email: session.user.email } },
            cpuPercent: cpuCores * 100,
            ramMB: ramGB * 1024,
            diskMB: diskMb,
            gameConfig: JSON.parse(JSON.stringify(serverConfig.gameConfig)),
            gameData: { connect: { id: serverConfig.gameConfig.gameId } },
            price: calculateTotal(pfGroup, cpuCores, ramGB, days).price,
            expires: expDate
        }
    });

    return created.id.toString();
}
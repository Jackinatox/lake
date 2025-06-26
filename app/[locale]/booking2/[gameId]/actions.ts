"use server"

import { ServerConfig } from "./page";
import { auth } from "@/auth";
import { headers } from "next/headers";
import { stripe } from "@/lib/stripe";
import { prisma } from "@/prisma";

export async function createServerOrder(serverConfig: ServerConfig): Promise<string> {
    serverConfig.hardwareConfig.pfGroupId

    const session = await auth();

    if ((!session?.user) || serverConfig.hardwareConfig.cpuCores <= 0 || serverConfig.hardwareConfig.ramGb <= 0)
        return '';

    const pfGroup = await prisma.location.findUnique({
        where: { id: serverConfig.hardwareConfig.pfGroupId },
        include: {
            cpu: true,
            ram: true,
        }
    });


    const created = await prisma.serverOrder.create({
        data: {
            location: { connect: { id: pfGroup.id } },
            user: { connect: { email: session.user.email } },
            cpuPercent: serverConfig.hardwareConfig.cpuCores * 100,
            ramMB: serverConfig.hardwareConfig.ramGb * 1024,
            diskMB: serverConfig.hardwareConfig.diskMb,
            gameConfig: JSON.parse(JSON.stringify(serverConfig.gameConfig)),
            gameData: { connect: { id: serverConfig.gameConfig.gameId } },
            price: (pfGroup.cpu.pricePerCore * serverConfig.hardwareConfig.cpuCores +
                pfGroup.ram.pricePerGb * serverConfig.hardwareConfig.ramGb)
        }
    });

    return created.id.toString();
}
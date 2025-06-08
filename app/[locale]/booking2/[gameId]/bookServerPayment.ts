"use server"

import { prisma } from "@/prisma";
import { ServerConfig } from "./page";

export async function bookSerevrPayment(serverConfig: ServerConfig) {
    serverConfig.hardwareConfig.pfGroupId;

    const pfGroup = await prisma.location.findUnique({
        where: { id: serverConfig.hardwareConfig.pfGroupId },
        include: {
            cpu: true,
            ram: true,
        }
    });

    

    console.log('pId: ', pfGroup)

}
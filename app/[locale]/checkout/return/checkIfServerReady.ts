"use server"

import { auth } from "@/auth"
import { prisma } from "@/prisma";

const endpointSecret = process.env.webhookSecret;
const panelUrl = process.env.NEXT_PUBLIC_PTERODACTYL_URL;

import { OrderStatus } from "@prisma/client";

export default async function checkIfServerReady(stripeSession: string): Promise<{ status: OrderStatus | null, serverId: string | null }> {
    const session = await auth();

    if (session?.user) {
        const serverOrder = await prisma.serverOrder.findFirst({ where: { stripeSessionId: stripeSession } });

        if (!serverOrder) {
            return { status: null, serverId: null };
        }

        if (serverOrder.status === OrderStatus.CREATED) {
            const isInstalling = await fetch(`${panelUrl}/api/client/account`, {
                method: 'GET',
                headers: {
                    Authorization: `Bearer ${session.user.ptKey}`,
                    Accept: "application/json",
                    "Content-Type": "application/json",
                },
            })
                .then((data) => data.json())
                .then((data) => Boolean(data.attributes.is_installing));

            if (!isInstalling)
                await prisma.serverOrder.update({ where: { stripeSessionId: stripeSession }, data: { status: "INSTALLED" } })

            // return { status: isInstalling ? OrderStatus.CREATED : OrderStatus.INSTALLED, serverId: serverOrder.serverId };
        }
        
        
        const result = await prisma.serverOrder.findFirst({ where: { stripeSessionId: stripeSession } });
        return { status: result.status, serverId: result.serverId };
    }

    return { status: null, serverId: null };
}
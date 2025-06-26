"use server"

import { auth } from "@/auth"
import { prisma } from "@/prisma";

const endpointSecret = process.env.webhookSecret;
const panelUrl = process.env.NEXT_PUBLIC_PTERODACTYL_URL;

import { OrderStatus } from "@prisma/client";

export default async function checkIfServerReady(stripeSession: string, checkInstallation: boolean): Promise<{ status: OrderStatus | null, serverId: string | null }> {
    const session = await auth();

    if (session?.user) {
        const serverOrder = await prisma.serverOrder.findFirst({ where: { stripeSessionId: stripeSession } });

        if (!serverOrder) {
            return { status: null, serverId: null };
        }

        if (checkInstallation && serverOrder.status === OrderStatus.PAID) {
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

            return { status: isInstalling ? OrderStatus.PAID : OrderStatus.CREATED, serverId: serverOrder.serverId };
        }
        return { status: serverOrder.status, serverId: serverOrder.serverId };
    }

    return { status: null, serverId: null };
}
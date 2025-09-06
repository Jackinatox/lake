"use server";
import { auth } from "@/auth";
import { provisionServer } from "@/lib/Pterodactyl/createServers/provisionServer";
import { prisma } from "@/prisma";
import { headers } from "next/headers";

export async function testProvisionServer(orderId: string) {
    const session = await auth.api.getSession({
        headers: await headers()
    })

    if (session?.user.role !== 'ADMIN') {
        throw new Error("Not authorized");
    }

    if (!orderId) return { success: false, error: { message: "Missing orderId" } };

    try {
        const order = await prisma.gameServerOrder.findUnique({ where: { id: Number(orderId) } });

        if (!order) return { success: false, error: { message: "Order not found" } };

        await provisionServer(order);
        return { success: true };
    } catch (err: any) {
        let payload: any = { message: undefined };
        if (!err) payload.message = 'Unknown error';
        else if (typeof err === 'string') payload.message = err;
        else if (err instanceof Error) payload.message = err.message;
        else if (typeof err === 'object') payload = { ...err };

        return { success: false, error: payload };
    }
}

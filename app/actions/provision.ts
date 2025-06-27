"use server";

// TODO: This is only for the provision test page and should be removed for production or get admin auth

import { provisionServer } from "@/lib/Pterodactyl/createServers/provisionServer";
import { prisma } from "@/prisma";

export async function provisionAction(orderId: string): Promise<{ success: boolean; message: string }> {
    try {
        const order = await prisma.serverOrder.findUnique({ where: { id: parseInt(orderId, 10) } });
        if (!order) {
            return { success: false, message: "Order not found" };
        }
        await provisionServer(order);
        return { success: true, message: "Server provisioned successfully" };
    } catch (error: any) {
        console.error(error);
        return { success: false, message: `Failed to provision server: ${error.message}` };
    }
}

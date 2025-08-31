"use server";
import { provisionServer } from "@/lib/Pterodactyl/createServers/provisionServer";
import { prisma } from "@/prisma";

export async function testProvisionServer(orderId: string) {
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

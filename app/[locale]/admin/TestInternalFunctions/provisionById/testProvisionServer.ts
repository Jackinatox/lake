"use server";
import { provisionServer } from "@/lib/Pterodactyl/createServers/provisionServer";
import { prisma } from "@/prisma";

export async function testProvisionServer(orderId: string) {
  if (!orderId) throw new Error("Missing orderId");

  const order = await prisma.gameServerOrder.findUnique({ where: { id: Number(orderId) } });
  
  if (!order) throw new Error("Order not found");
  await provisionServer(order);
  return { success: true };
}

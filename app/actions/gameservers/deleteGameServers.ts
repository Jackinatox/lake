"use server";
import { auth } from "@/auth";
import { prisma } from "@/prisma";
import { headers } from "next/headers";

export async function deleteGameServers(ids: number[]) {
    const session = await auth.api.getSession({
        headers: await headers()
    })
    if (session?.user.role !== "admin") {
        throw new Error("Unauthorized");
    }

    if (!Array.isArray(ids) || ids.length === 0) return { success: false, error: "No IDs provided" };

    const deletedIds: number[] = [];

    for (const id of ids) {
        try {
            const response = await fetch(process.env.NEXT_PUBLIC_PTERODACTYL_URL + `/api/application/servers/${id}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${process.env.PTERODACTYL_API_KEY}`,
                    'Content-Type': 'application/json'
                }
            });
            if (response.ok) {
                deletedIds.push(id);
            }
        } catch (error) {
            return { success: false, error: error instanceof Error ? error.message : String(error) };
        }
    }

    try {
        for (const id of deletedIds) {
            await prisma.gameServer.deleteMany({
                where: { ptAdminId: id }
            });
        }
        return { success: true };
    } catch (error) {
        return { success: false, error: error instanceof Error ? error.message : String(error) };
    }
}

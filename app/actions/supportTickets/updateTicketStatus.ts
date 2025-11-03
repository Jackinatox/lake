"use server";

import { auth } from "@/auth";
import { prisma } from "@/prisma";
import { headers } from "next/headers";
import { TicketStatus } from "@prisma/client";

export async function updateTicketStatusAction(params: { ticketId: number; status: TicketStatus }) {
    const { ticketId, status } = params;

    const session = await auth.api.getSession({
        headers: await headers(),
    });

    if (session?.user.role !== "admin") {
        throw new Error("Unauthorized");
    }

    const updatedTicket = await prisma.supportTicket.update({
        where: { id: ticketId },
        data: { status },
        include: {
            user: {
                select: {
                    id: true,
                    email: true,
                    name: true,
                },
            },
        },
    });

    return {
        ticket: {
            id: updatedTicket.id,
            title: updatedTicket.title,
            message: updatedTicket.message,
            category: updatedTicket.category,
            status: updatedTicket.status,
            createdAt: updatedTicket.createdAt.toISOString(),
            updatedAt: updatedTicket.updatedAt.toISOString(),
            user: updatedTicket.user,
        },
    };
}

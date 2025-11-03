import { auth } from "@/auth";
import NoAdmin from "@/components/admin/NoAdminMessage";
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList } from "@/components/ui/breadcrumb";
import { Card, CardContent } from "@/components/ui/card";
import TicketsDashboard, { AdminTicket } from "./TicketsDashboard";
import { prisma } from "@/prisma";
import { headers } from "next/headers";
import { InboxIcon } from "lucide-react";

export default async function TicketsPage() {
    const session = await auth.api.getSession({
        headers: await headers(),
    });

    if (session?.user.role !== "admin") {
        return <NoAdmin />;
    }

    const tickets = await prisma.supportTicket.findMany({
        include: {
            user: {
                select: {
                    id: true,
                    email: true,
                    name: true,
                },
            },
        },
        orderBy: { createdAt: "desc" },
    });

    const serialised: AdminTicket[] = tickets.map((ticket) => ({
        id: ticket.id,
        title: ticket.title,
        message: ticket.message,
        category: ticket.category,
        status: ticket.status,
        createdAt: ticket.createdAt.toISOString(),
        updatedAt: ticket.updatedAt.toISOString(),
        user: ticket.user,
    }));

    return (
        <div className="flex w-full flex-col gap-6">
            <Card className="border-dashed">
                <CardContent className="flex flex-col gap-3 px-4 py-5 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex items-center gap-3 text-muted-foreground">
                        <InboxIcon className="h-5 w-5" />
                        <span className="text-sm font-medium">Ticket operations are email-only. Update the status here and follow up via email.</span>
                    </div>
                    <Breadcrumb>
                        <BreadcrumbList>
                            <BreadcrumbItem>
                                <BreadcrumbLink href="../">Admin</BreadcrumbLink>
                            </BreadcrumbItem>
                            <BreadcrumbItem>
                                <BreadcrumbLink href="#">Tickets</BreadcrumbLink>
                            </BreadcrumbItem>
                        </BreadcrumbList>
                    </Breadcrumb>
                </CardContent>
            </Card>
            <TicketsDashboard tickets={serialised} />
        </div>
    );
}

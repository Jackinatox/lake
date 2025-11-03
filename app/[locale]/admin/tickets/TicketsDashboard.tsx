"use client";

import { useMemo, useState, useTransition } from "react";
import type { TicketCategory, TicketStatus } from "@prisma/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { updateTicketStatusAction } from "@/app/actions/supportTickets/updateTicketStatus";
import { useToast } from "@/hooks/use-toast";
import { ClipboardCopyIcon, MailIcon, Clock3Icon, FilterIcon } from "lucide-react";

export type AdminTicket = {
    id: number;
    title: string | null;
    message: string;
    category: TicketCategory;
    status: TicketStatus;
    createdAt: string;
    updatedAt: string;
    user: {
        id: string;
        name: string | null;
        email: string;
    };
};

const TICKET_STATUSES: TicketStatus[] = ["OPEN", "PENDING", "RESOLVED", "CLOSED"];
const TICKET_CATEGORIES: TicketCategory[] = ["GENERAL", "TECHNICAL", "BILLING", "ACCOUNT"];

const statusStyles: Record<TicketStatus, string> = {
    OPEN: "bg-blue-500/15 text-blue-600 dark:text-blue-400",
    PENDING: "bg-amber-500/15 text-amber-600 dark:text-amber-400",
    RESOLVED: "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400",
    CLOSED: "bg-slate-500/15 text-slate-600 dark:text-slate-300",
};

const categoryStyles: Record<TicketCategory, string> = {
    GENERAL: "bg-slate-500/15 text-slate-600 dark:text-slate-300",
    TECHNICAL: "bg-indigo-500/15 text-indigo-600 dark:text-indigo-400",
    BILLING: "bg-rose-500/15 text-rose-600 dark:text-rose-400",
    ACCOUNT: "bg-teal-500/15 text-teal-600 dark:text-teal-400",
};

const categoryLabels: Record<TicketCategory, string> = {
    GENERAL: "General",
    TECHNICAL: "Technical issue",
    BILLING: "Billing & payments",
    ACCOUNT: "Account & access",
};

function formatRelative(dateIso: string) {
    const date = new Date(dateIso);
    const seconds = Math.floor((Date.now() - date.getTime()) / 1000);

    if (seconds < 60) return `${seconds}s ago`;
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    if (days < 7) return `${days}d ago`;
    return date.toLocaleDateString();
}

function normalise(str: string) {
    return str.toLowerCase();
}

export default function TicketsDashboard({ tickets: initialTickets }: { tickets: AdminTicket[] }) {
    const [tickets, setTickets] = useState(initialTickets);
    const [statusFilter, setStatusFilter] = useState<"ALL" | TicketStatus>("ALL");
    const [categoryFilter, setCategoryFilter] = useState<"ALL" | TicketCategory>("ALL");
    const [query, setQuery] = useState("");
    const [pendingTicketId, setPendingTicketId] = useState<number | null>(null);
    const [isPending, startTransition] = useTransition();
    const { toast } = useToast();

    const stats = useMemo(() => {
        const total = tickets.length;
        const open = tickets.filter((t) => t.status === "OPEN").length;
        const pending = tickets.filter((t) => t.status === "PENDING").length;
        const resolved = tickets.filter((t) => t.status === "RESOLVED" || t.status === "CLOSED").length;
        const latestUpdate = tickets.reduce<string | null>((acc, ticket) => {
            if (!acc) return ticket.updatedAt;
            return new Date(ticket.updatedAt) > new Date(acc) ? ticket.updatedAt : acc;
        }, null);
        const byCategory = tickets.reduce<Record<TicketCategory, number>>((acc, ticket) => {
            acc[ticket.category] = (acc[ticket.category] ?? 0) + 1;
            return acc;
        }, Object.fromEntries(TICKET_CATEGORIES.map((category) => [category, 0])) as Record<TicketCategory, number>);

        return {
            total,
            open,
            pending,
            resolved,
            latestUpdate,
            byCategory,
        };
    }, [tickets]);

    const visibleTickets = useMemo(() => {
        return tickets.filter((ticket) => {
            const matchesStatus = statusFilter === "ALL" || ticket.status === statusFilter;
            if (!matchesStatus) return false;
            const matchesCategory = categoryFilter === "ALL" || ticket.category === categoryFilter;
            if (!matchesCategory) return false;
            if (!query) return true;
            const search = normalise(query);
            return (
                normalise(ticket.message).includes(search) ||
                normalise(ticket.user.email).includes(search) ||
                normalise(ticket.user.name ?? "").includes(search) ||
                normalise(ticket.title ?? "").includes(search)
            );
        });
    }, [tickets, statusFilter, categoryFilter, query]);

    const handleStatusChange = (ticketId: number, nextStatus: TicketStatus) => {
        setPendingTicketId(ticketId);
        startTransition(async () => {
            try {
                const { ticket } = await updateTicketStatusAction({ ticketId, status: nextStatus });
                setTickets((prev) =>
                    prev.map((item) =>
                        item.id === ticketId
                            ? { ...item, status: ticket.status, category: ticket.category, updatedAt: ticket.updatedAt }
                            : item
                    )
                );
                toast({
                    title: "Status updated",
                    description: `Ticket #${ticketId} set to ${nextStatus.toLowerCase()}.`,
                });
            } catch (error) {
                toast({
                    title: "Update failed",
                    description: error instanceof Error ? error.message : "Could not update ticket.",
                    variant: "destructive",
                });
            } finally {
                setPendingTicketId(null);
            }
        });
    };

    const handleCopyEmail = async (email: string) => {
        try {
            await navigator.clipboard.writeText(email);
            toast({ title: "Email copied", description: email });
        } catch (error) {
            toast({ title: "Copy failed", description: "Could not copy email.", variant: "destructive" });
        }
    };

    return (
        <div className="flex w-full flex-col gap-6">
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">Total Tickets</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <span className="text-2xl font-semibold">{stats.total}</span>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">Open</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <span className="text-2xl font-semibold text-blue-600 dark:text-blue-400">{stats.open}</span>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">Pending</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <span className="text-2xl font-semibold text-amber-600 dark:text-amber-400">{stats.pending}</span>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">Resolved / Closed</CardTitle>
                    </CardHeader>
                    <CardContent className="flex flex-col">
                        <span className="text-2xl font-semibold text-emerald-600 dark:text-emerald-400">{stats.resolved}</span>
                        {stats.latestUpdate && (
                            <span className="mt-2 flex items-center gap-2 text-sm text-muted-foreground">
                                <Clock3Icon className="h-4 w-4" /> Updated {formatRelative(stats.latestUpdate)}
                            </span>
                        )}
                    </CardContent>
                </Card>
                <Card className="sm:col-span-2 xl:col-span-4">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">By category</CardTitle>
                    </CardHeader>
                    <CardContent className="flex flex-wrap gap-2">
                        {TICKET_CATEGORIES.map((category) => (
                            <span
                                key={category}
                                className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-medium ${categoryStyles[category]}`}
                            >
                                {categoryLabels[category]}
                                <span className="rounded-full bg-background/60 px-2 py-0.5 text-foreground shadow-sm">
                                    {stats.byCategory[category] ?? 0}
                                </span>
                            </span>
                        ))}
                    </CardContent>
                </Card>
            </div>

            <Card className="w-full">
                <CardHeader className="gap-4 pb-4 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <CardTitle className="text-xl">Support Tickets</CardTitle>
                    </div>
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <FilterIcon className="h-4 w-4" />
                            Filters
                        </div>
                        <Input
                            value={query}
                            onChange={(event) => setQuery(event.target.value)}
                            placeholder="Search by email, name, or text"
                            className="h-9 w-full min-w-0 sm:w-56"
                        />
                        <Select value={statusFilter} onValueChange={(value) => setStatusFilter(value as "ALL" | TicketStatus)}>
                            <SelectTrigger className="h-9 w-full sm:w-40">
                                <SelectValue placeholder="All statuses" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="ALL">All statuses</SelectItem>
                                {TICKET_STATUSES.map((status) => (
                                    <SelectItem key={status} value={status}>
                                        {status.charAt(0) + status.slice(1).toLowerCase()}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        <Select value={categoryFilter} onValueChange={(value) => setCategoryFilter(value as "ALL" | TicketCategory)}>
                            <SelectTrigger className="h-9 w-full sm:w-44">
                                <SelectValue placeholder="All categories" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="ALL">All categories</SelectItem>
                                {TICKET_CATEGORIES.map((category) => (
                                    <SelectItem key={category} value={category}>
                                        {categoryLabels[category]}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                </CardHeader>
                <CardContent className="flex flex-col gap-4">
                    {visibleTickets.length === 0 ? (
                        <div className="flex h-40 flex-col items-center justify-center rounded-lg border border-dashed text-sm text-muted-foreground">
                            No tickets match your filters.
                        </div>
                    ) : (
                        visibleTickets.map((ticket) => (
                            <div
                                key={ticket.id}
                                className="flex flex-col gap-4 rounded-lg border bg-card/60 p-4 shadow-sm transition hover:border-primary/40 sm:flex-row sm:items-start sm:justify-between"
                            >
                                <div className="flex flex-1 flex-col gap-3">
                                    <div className="flex flex-wrap items-center gap-2">
                                        <Badge className={`px-2 py-1 text-xs font-semibold ${statusStyles[ticket.status]}`}>
                                            {ticket.status.charAt(0) + ticket.status.slice(1).toLowerCase()}
                                        </Badge>
                                        <Badge className={`px-2 py-1 text-xs font-semibold ${categoryStyles[ticket.category]}`}>
                                            {categoryLabels[ticket.category]}
                                        </Badge>
                                        <span className="text-xs uppercase tracking-wide text-muted-foreground">
                                            #{ticket.id}
                                        </span>
                                        <span className="text-xs text-muted-foreground">{formatRelative(ticket.createdAt)}</span>
                                    </div>
                                    <div>
                                        <p className="font-medium text-foreground">
                                            {ticket.title || "Untitled ticket"}
                                        </p>
                                        <p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed text-muted-foreground">
                                            {ticket.message}
                                        </p>
                                    </div>
                                    <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
                                        <span className="flex items-center gap-1">
                                            <MailIcon className="h-4 w-4" />
                                            {ticket.user.email}
                                        </span>
                                        {ticket.user.name && <span>· {ticket.user.name}</span>}
                                    </div>
                                </div>
                                <div className="flex w-full flex-col gap-3 sm:w-52">
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => handleCopyEmail(ticket.user.email)}
                                        className="justify-start"
                                    >
                                        <ClipboardCopyIcon className="mr-2 h-4 w-4" /> Copy email
                                    </Button>
                                    <Select
                                        value={ticket.status}
                                        onValueChange={(value) => handleStatusChange(ticket.id, value as TicketStatus)}
                                        disabled={(isPending && pendingTicketId === ticket.id) || pendingTicketId === ticket.id}
                                    >
                                        <SelectTrigger className="h-9">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {TICKET_STATUSES.map((status) => (
                                                <SelectItem key={status} value={status}>
                                                    {status.charAt(0) + status.slice(1).toLowerCase()}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                    <span className="text-xs text-muted-foreground">
                                        Updated {formatRelative(ticket.updatedAt)}
                                    </span>
                                </div>
                            </div>
                        ))
                    )}
                </CardContent>
            </Card>
        </div>
    );
}

'use client';

import {
    adminDeleteTicketAction,
    adminUpdateTicketAction,
} from '@/app/actions/tickets/adminTicketActions';
import type { TicketCategory, TicketPriority, TicketState } from '@/app/client/generated/enums';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import {
    TICKET_CATEGORIES,
    TICKET_PRIORITIES,
    TICKET_STATES,
    TICKET_SUBJECT_MAX_LENGTH,
    TICKET_SUBJECT_MIN_LENGTH,
} from '@/lib/tickets/constants';
import {
    adminTicketCategoryLabels,
    adminTicketPriorityLabels,
    adminTicketStateLabels,
} from '@/lib/tickets/presentation';
import type { AdminTicketUpdateInput } from '@/lib/validation/tickets';
import { Trash2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useState, useTransition } from 'react';

const NONE = '__none';

export type TicketPropertyOption = { id: string; label: string };

export default function TicketPropertiesPanel({
    ticketId,
    ticketNumber,
    subject,
    status,
    priority,
    category,
    assigneeId,
    gameServerId,
    currentAdminId,
    admins,
    servers,
}: {
    ticketId: string;
    ticketNumber: number;
    subject: string;
    status: TicketState;
    priority: TicketPriority;
    category: TicketCategory;
    assigneeId: string | null;
    gameServerId: string | null;
    currentAdminId: string;
    admins: TicketPropertyOption[];
    /** The customer's servers, the only ones a ticket can be linked to. */
    servers: TicketPropertyOption[];
}) {
    const router = useRouter();
    const { toast } = useToast();
    const [isPending, startTransition] = useTransition();
    const [subjectDraft, setSubjectDraft] = useState(subject);

    const update = (patch: Omit<AdminTicketUpdateInput, 'ticketId'>) =>
        startTransition(async () => {
            const result = await adminUpdateTicketAction({ ticketId, ...patch }).catch(() => null);
            if (!result?.success) {
                toast({
                    title: 'Update failed',
                    description: result?.message ?? 'Could not update the ticket.',
                    variant: 'destructive',
                });
                return;
            }
            router.refresh();
        });

    const deleteTicket = () =>
        startTransition(async () => {
            const result = await adminDeleteTicketAction({ ticketId }).catch(() => null);
            if (!result?.success) {
                toast({
                    title: 'Delete failed',
                    description: result?.message ?? 'Could not delete the ticket.',
                    variant: 'destructive',
                });
                return;
            }
            toast({ title: `Ticket #${ticketNumber} deleted` });
            router.push('/admin/support');
        });

    const trimmedSubject = subjectDraft.trim();
    const subjectChanged = trimmedSubject !== subject;
    const subjectValid =
        trimmedSubject.length >= TICKET_SUBJECT_MIN_LENGTH &&
        trimmedSubject.length <= TICKET_SUBJECT_MAX_LENGTH;
    // Keep a linked server selectable even if it is no longer among the customer's servers.
    const serverOptions =
        gameServerId && !servers.some((server) => server.id === gameServerId)
            ? [...servers, { id: gameServerId, label: 'Linked server (deleted)' }]
            : servers;

    return (
        <Card>
            <CardHeader className="pb-2 md:pb-3">
                <CardTitle className="text-base">Ticket</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
                <div className="space-y-1">
                    <Label className="text-xs text-muted-foreground">Status</Label>
                    <Select
                        value={status}
                        disabled={isPending}
                        onValueChange={(value) => update({ status: value as TicketState })}
                    >
                        <SelectTrigger className="h-9">
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            {TICKET_STATES.map((value) => (
                                <SelectItem key={value} value={value}>
                                    {adminTicketStateLabels[value]}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>

                <div className="grid grid-cols-2 gap-2">
                    <div className="space-y-1">
                        <Label className="text-xs text-muted-foreground">Priority</Label>
                        <Select
                            value={priority}
                            disabled={isPending}
                            onValueChange={(value) => update({ priority: value as TicketPriority })}
                        >
                            <SelectTrigger className="h-9">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                {TICKET_PRIORITIES.map((value) => (
                                    <SelectItem key={value} value={value}>
                                        {adminTicketPriorityLabels[value]}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="space-y-1">
                        <Label className="text-xs text-muted-foreground">Category</Label>
                        <Select
                            value={category}
                            disabled={isPending}
                            onValueChange={(value) => update({ category: value as TicketCategory })}
                        >
                            <SelectTrigger className="h-9">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                {TICKET_CATEGORIES.map((value) => (
                                    <SelectItem key={value} value={value}>
                                        {adminTicketCategoryLabels[value]}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                </div>

                <div className="space-y-1">
                    <div className="flex items-center justify-between">
                        <Label className="text-xs text-muted-foreground">Assignee</Label>
                        {assigneeId !== currentAdminId && (
                            <button
                                type="button"
                                disabled={isPending}
                                onClick={() => update({ assigneeId: currentAdminId })}
                                className="text-xs font-medium text-primary hover:underline"
                            >
                                Assign to me
                            </button>
                        )}
                    </div>
                    <Select
                        value={assigneeId ?? NONE}
                        disabled={isPending}
                        onValueChange={(value) =>
                            update({ assigneeId: value === NONE ? null : value })
                        }
                    >
                        <SelectTrigger className="h-9">
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value={NONE}>Unassigned</SelectItem>
                            {admins.map((admin) => (
                                <SelectItem key={admin.id} value={admin.id}>
                                    {admin.label}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>

                <div className="space-y-1">
                    <Label className="text-xs text-muted-foreground">Linked server</Label>
                    <Select
                        value={gameServerId ?? NONE}
                        disabled={isPending || serverOptions.length === 0}
                        onValueChange={(value) =>
                            update({ gameServerId: value === NONE ? null : value })
                        }
                    >
                        <SelectTrigger className="h-9">
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value={NONE}>None</SelectItem>
                            {serverOptions.map((server) => (
                                <SelectItem key={server.id} value={server.id}>
                                    {server.label}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>

                <div className="space-y-1">
                    <Label className="text-xs text-muted-foreground">Subject</Label>
                    <div className="flex gap-2">
                        <Input
                            value={subjectDraft}
                            onChange={(event) => setSubjectDraft(event.target.value)}
                            maxLength={TICKET_SUBJECT_MAX_LENGTH}
                            className="h-9"
                        />
                        {subjectChanged && (
                            <Button
                                size="sm"
                                className="h-9"
                                disabled={isPending || !subjectValid}
                                onClick={() => update({ subject: trimmedSubject })}
                            >
                                Save
                            </Button>
                        )}
                    </div>
                </div>

                <AlertDialog>
                    <AlertDialogTrigger asChild>
                        <Button
                            variant="ghost"
                            size="sm"
                            disabled={isPending}
                            className="w-full gap-1.5 text-destructive hover:bg-destructive/10 hover:text-destructive"
                        >
                            <Trash2 className="h-4 w-4" />
                            Delete ticket
                        </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                        <AlertDialogHeader>
                            <AlertDialogTitle>Delete ticket #{ticketNumber}?</AlertDialogTitle>
                            <AlertDialogDescription>
                                This permanently removes the ticket with all messages, notes and
                                history. The customer will no longer see it. Use this for spam;
                                close the ticket otherwise.
                            </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction
                                onClick={deleteTicket}
                                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                            >
                                Delete
                            </AlertDialogAction>
                        </AlertDialogFooter>
                    </AlertDialogContent>
                </AlertDialog>
            </CardContent>
        </Card>
    );
}

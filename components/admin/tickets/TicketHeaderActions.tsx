'use client';

import {
    adminDeleteTicketAction,
    adminUpdateTicketAction,
} from '@/app/actions/tickets/adminTicketActions';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { TICKET_SUBJECT_MAX_LENGTH, TICKET_SUBJECT_MIN_LENGTH } from '@/lib/tickets/constants';
import { MoreHorizontal, Pencil, Trash2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useState, useTransition, type FormEvent } from 'react';

/** "⋯" menu next to the ticket title: rename the subject, delete the ticket. */
export default function TicketHeaderActions({
    ticketId,
    ticketNumber,
    subject,
}: {
    ticketId: string;
    ticketNumber: number;
    subject: string;
}) {
    const router = useRouter();
    const { toast } = useToast();
    const [isPending, startTransition] = useTransition();
    const [dialog, setDialog] = useState<'subject' | 'delete' | null>(null);
    const [subjectDraft, setSubjectDraft] = useState(subject);

    const trimmedSubject = subjectDraft.trim();
    const subjectValid =
        trimmedSubject.length >= TICKET_SUBJECT_MIN_LENGTH &&
        trimmedSubject.length <= TICKET_SUBJECT_MAX_LENGTH;

    const saveSubject = (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        if (!subjectValid) return;
        startTransition(async () => {
            const result = await adminUpdateTicketAction({
                ticketId,
                subject: trimmedSubject,
            }).catch(() => null);
            if (!result?.success) {
                toast({
                    title: 'Update failed',
                    description: result?.message ?? 'Could not update the subject.',
                    variant: 'destructive',
                });
                return;
            }
            setDialog(null);
            router.refresh();
        });
    };

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

    return (
        <>
            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0">
                        <MoreHorizontal className="h-4 w-4" />
                        <span className="sr-only">Ticket actions</span>
                    </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                    <DropdownMenuItem
                        onSelect={() => {
                            setSubjectDraft(subject);
                            setDialog('subject');
                        }}
                    >
                        <Pencil className="mr-2 h-4 w-4" />
                        Edit subject
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                        onSelect={() => setDialog('delete')}
                        className="text-destructive focus:text-destructive"
                    >
                        <Trash2 className="mr-2 h-4 w-4" />
                        Delete ticket
                    </DropdownMenuItem>
                </DropdownMenuContent>
            </DropdownMenu>

            <Dialog
                open={dialog === 'subject'}
                onOpenChange={(open) => setDialog(open ? 'subject' : null)}
            >
                <DialogContent>
                    <form onSubmit={saveSubject} className="space-y-4">
                        <DialogHeader>
                            <DialogTitle>Edit subject</DialogTitle>
                        </DialogHeader>
                        <Input
                            value={subjectDraft}
                            onChange={(event) => setSubjectDraft(event.target.value)}
                            maxLength={TICKET_SUBJECT_MAX_LENGTH}
                            autoFocus
                        />
                        <DialogFooter>
                            <Button type="button" variant="ghost" onClick={() => setDialog(null)}>
                                Cancel
                            </Button>
                            <Button
                                type="submit"
                                disabled={isPending || !subjectValid || trimmedSubject === subject}
                            >
                                Save
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            <AlertDialog
                open={dialog === 'delete'}
                onOpenChange={(open) => setDialog(open ? 'delete' : null)}
            >
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Delete ticket #{ticketNumber}?</AlertDialogTitle>
                        <AlertDialogDescription>
                            This permanently removes the ticket with all messages, notes and
                            history. The customer will no longer see it. Use this for spam; close
                            the ticket otherwise.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={deleteTicket}
                            disabled={isPending}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        >
                            Delete
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </>
    );
}

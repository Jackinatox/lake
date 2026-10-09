'use client';

import {
    deleteTicketNoteAction,
    setTicketNotePinnedAction,
    updateTicketNoteAction,
} from '@/app/actions/tickets/adminTicketActions';
import LinkifiedText from '@/components/support/LinkifiedText';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { TICKET_NOTE_MAX_LENGTH } from '@/lib/tickets/constants';
import type { TicketActionResult } from '@/lib/tickets/types';
import { cn } from '@/lib/utils';
import { Lock, Pencil, Pin, PinOff, Trash2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useState, useTransition } from 'react';

export type TicketNoteView = {
    id: number;
    body: string;
    pinned: boolean;
    authorName: string;
    /** Only the author may edit or delete a note. */
    isOwn: boolean;
    timeLabel: string;
    edited: boolean;
};

export default function TicketNoteItem({ note }: { note: TicketNoteView }) {
    const router = useRouter();
    const { toast } = useToast();
    const [isPending, startTransition] = useTransition();
    const [editing, setEditing] = useState(false);
    const [draft, setDraft] = useState(note.body);

    const run = (action: () => Promise<TicketActionResult>, onSuccess?: () => void) =>
        startTransition(async () => {
            const result = await action().catch(() => null);
            if (!result?.success) {
                toast({
                    title: 'Failed',
                    description: result?.message ?? 'Could not update the note.',
                    variant: 'destructive',
                });
                return;
            }
            onSuccess?.();
            router.refresh();
        });

    return (
        <div
            className={cn(
                'rounded-lg border border-amber-500/40 bg-amber-50/70 p-3 text-sm dark:bg-amber-950/20',
                note.pinned && 'ring-1 ring-amber-500/60',
            )}
        >
            <div className="mb-1.5 flex items-center gap-2 text-xs text-amber-800 dark:text-amber-300">
                <Lock className="h-3 w-3" />
                <span className="font-semibold">Internal note</span>
                <span>· {note.authorName}</span>
                <span>· {note.timeLabel}</span>
                {note.edited && <span className="italic">(edited)</span>}
                {note.pinned && <Pin className="h-3 w-3" />}
                <div className="ml-auto flex items-center gap-0.5">
                    <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6"
                        disabled={isPending}
                        title={note.pinned ? 'Unpin' : 'Pin to sidebar'}
                        onClick={() =>
                            run(() =>
                                setTicketNotePinnedAction({
                                    noteId: note.id,
                                    pinned: !note.pinned,
                                }),
                            )
                        }
                    >
                        {note.pinned ? <PinOff className="h-3 w-3" /> : <Pin className="h-3 w-3" />}
                    </Button>
                    {note.isOwn && (
                        <>
                            <Button
                                variant="ghost"
                                size="icon"
                                className="h-6 w-6"
                                disabled={isPending}
                                title="Edit"
                                onClick={() => {
                                    setDraft(note.body);
                                    setEditing((value) => !value);
                                }}
                            >
                                <Pencil className="h-3 w-3" />
                            </Button>
                            <Button
                                variant="ghost"
                                size="icon"
                                className="h-6 w-6 hover:text-destructive"
                                disabled={isPending}
                                title="Delete"
                                onClick={() => {
                                    if (!window.confirm('Delete this note?')) return;
                                    run(() => deleteTicketNoteAction({ noteId: note.id }));
                                }}
                            >
                                <Trash2 className="h-3 w-3" />
                            </Button>
                        </>
                    )}
                </div>
            </div>
            {editing ? (
                <div className="space-y-2">
                    <Textarea
                        value={draft}
                        onChange={(event) => setDraft(event.target.value)}
                        maxLength={TICKET_NOTE_MAX_LENGTH}
                        rows={4}
                        className="bg-background"
                    />
                    <div className="flex justify-end gap-2">
                        <Button size="sm" variant="ghost" onClick={() => setEditing(false)}>
                            Cancel
                        </Button>
                        <Button
                            size="sm"
                            disabled={isPending || !draft.trim()}
                            onClick={() =>
                                run(
                                    () =>
                                        updateTicketNoteAction({
                                            noteId: note.id,
                                            body: draft.trim(),
                                        }),
                                    () => setEditing(false),
                                )
                            }
                        >
                            Save
                        </Button>
                    </div>
                </div>
            ) : (
                <div className="whitespace-pre-wrap break-words text-foreground">
                    <LinkifiedText text={note.body} />
                </div>
            )}
        </div>
    );
}

'use client';

import {
    addTicketNoteAction,
    adminReplyToTicketAction,
} from '@/app/actions/tickets/adminTicketActions';
import type { TicketState } from '@/app/client/generated/enums';
import { Button } from '@/components/ui/button';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { TICKET_MESSAGE_MAX_LENGTH, TICKET_NOTE_MAX_LENGTH } from '@/lib/tickets/constants';
import { adminTicketStateLabels } from '@/lib/tickets/presentation';
import { cn } from '@/lib/utils';
import { Loader2, Lock, SendHorizontal } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useEffect, useState, type KeyboardEvent } from 'react';

type Mode = 'reply' | 'note';
type StatusAfter = TicketState | 'KEEP';

const STATUS_AFTER_OPTIONS: TicketState[] = ['WAITING_FOR_CUSTOMER', 'RESOLVED', 'ON_HOLD'];

function draftKey(ticketId: string, mode: Mode) {
    return `ticket-draft:${ticketId}:${mode}`;
}

/**
 * Reply box of the admin ticket page, with a second mode for internal notes. Drafts are kept in
 * localStorage per ticket, so navigating away (or a refresh) does not lose a half-written reply.
 */
export default function AdminTicketComposer({
    ticketId,
    currentStatus,
    latestMessageId,
    hasCustomer,
}: {
    ticketId: string;
    currentStatus: TicketState;
    latestMessageId: number;
    hasCustomer: boolean;
}) {
    const router = useRouter();
    const { toast } = useToast();
    const [mode, setMode] = useState<Mode>('reply');
    const [drafts, setDrafts] = useState<Record<Mode, string>>({ reply: '', note: '' });
    const [statusAfter, setStatusAfter] = useState<StatusAfter>('WAITING_FOR_CUSTOMER');
    const [isSending, setIsSending] = useState(false);

    useEffect(() => {
        setDrafts({
            reply: localStorage.getItem(draftKey(ticketId, 'reply')) ?? '',
            note: localStorage.getItem(draftKey(ticketId, 'note')) ?? '',
        });
    }, [ticketId]);

    const setDraft = (value: string) => {
        setDrafts((prev) => ({ ...prev, [mode]: value }));
        if (value) localStorage.setItem(draftKey(ticketId, mode), value);
        else localStorage.removeItem(draftKey(ticketId, mode));
    };

    const text = drafts[mode];
    const trimmed = text.trim();
    const maxLength = mode === 'reply' ? TICKET_MESSAGE_MAX_LENGTH : TICKET_NOTE_MAX_LENGTH;
    const canSend =
        !isSending &&
        trimmed.length > 0 &&
        trimmed.length <= maxLength &&
        (mode === 'note' || hasCustomer);

    const send = async () => {
        if (!canSend) return;
        setIsSending(true);
        try {
            const result =
                mode === 'reply'
                    ? await adminReplyToTicketAction({
                          ticketId,
                          message: trimmed,
                          statusAfter,
                          lastSeenMessageId: latestMessageId,
                      })
                    : await addTicketNoteAction({ ticketId, body: trimmed });

            if (!result.success) {
                toast({
                    title: result.error === 'conflict' ? 'New message' : 'Failed',
                    description:
                        result.error === 'conflict'
                            ? 'A new message arrived while you were writing. Read it, then send again — your draft is kept.'
                            : (result.message ?? result.error),
                    variant: 'destructive',
                });
                if (result.error === 'conflict') router.refresh();
                return;
            }

            setDraft('');
            router.refresh();
        } catch {
            toast({ title: 'Failed', description: 'Unexpected error.', variant: 'destructive' });
        } finally {
            setIsSending(false);
        }
    };

    const handleKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
        if (event.key === 'Enter' && (event.ctrlKey || event.metaKey)) {
            event.preventDefault();
            void send();
        }
    };

    return (
        <div
            className={cn(
                'sticky bottom-0 z-10 rounded-lg border bg-background/95 p-3 shadow-sm backdrop-blur supports-[backdrop-filter]:bg-background/85',
                mode === 'note' && 'border-amber-500/50',
            )}
        >
            <div className="mb-2 flex items-center gap-1">
                {(['reply', 'note'] as const).map((value) => (
                    <button
                        key={value}
                        type="button"
                        onClick={() => setMode(value)}
                        className={cn(
                            'inline-flex items-center gap-1.5 rounded-md px-2.5 py-1 text-xs font-medium transition-colors',
                            mode === value
                                ? value === 'note'
                                    ? 'bg-amber-500/15 text-amber-700 dark:text-amber-400'
                                    : 'bg-primary/10 text-primary'
                                : 'text-muted-foreground hover:text-foreground',
                        )}
                    >
                        {value === 'note' && <Lock className="h-3 w-3" />}
                        {value === 'reply' ? 'Reply to customer' : 'Internal note'}
                        {drafts[value] && mode !== value && (
                            <span className="h-1.5 w-1.5 rounded-full bg-current" />
                        )}
                    </button>
                ))}
            </div>

            <Textarea
                value={text}
                onChange={(event) => setDraft(event.target.value)}
                onKeyDown={handleKeyDown}
                maxLength={maxLength}
                rows={4}
                placeholder={
                    mode === 'reply'
                        ? hasCustomer
                            ? 'Write a reply — the customer gets it by email too…'
                            : 'The customer account was deleted; replies cannot be delivered.'
                        : 'Only visible to admins…'
                }
                className={cn(
                    'max-h-80 resize-y',
                    mode === 'note' && 'bg-amber-50/60 dark:bg-amber-950/20',
                )}
            />

            <div className="mt-2 flex flex-wrap items-center justify-between gap-2">
                <span className="text-[11px] text-muted-foreground">
                    Ctrl + Enter to send
                    {trimmed.length > maxLength * 0.8 && ` · ${trimmed.length}/${maxLength}`}
                </span>
                <div className="flex items-center gap-2">
                    {mode === 'reply' && (
                        <>
                            <span className="text-xs text-muted-foreground">then</span>
                            <Select
                                value={statusAfter}
                                onValueChange={(value) => setStatusAfter(value as StatusAfter)}
                            >
                                <SelectTrigger className="h-8 w-48 text-xs">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    {STATUS_AFTER_OPTIONS.map((value) => (
                                        <SelectItem key={value} value={value}>
                                            Set {adminTicketStateLabels[value].toLowerCase()}
                                        </SelectItem>
                                    ))}
                                    <SelectItem value="KEEP">
                                        Keep {adminTicketStateLabels[currentStatus].toLowerCase()}
                                    </SelectItem>
                                </SelectContent>
                            </Select>
                        </>
                    )}
                    <Button
                        size="sm"
                        onClick={() => void send()}
                        disabled={!canSend}
                        className={cn(
                            'gap-1.5',
                            mode === 'note' && 'bg-amber-600 text-white hover:bg-amber-600/90',
                        )}
                    >
                        {isSending ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                        ) : mode === 'reply' ? (
                            <SendHorizontal className="h-4 w-4" />
                        ) : (
                            <Lock className="h-4 w-4" />
                        )}
                        {mode === 'reply' ? 'Send reply' : 'Add note'}
                    </Button>
                </div>
            </div>
        </div>
    );
}

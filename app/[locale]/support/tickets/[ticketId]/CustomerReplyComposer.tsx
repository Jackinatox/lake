'use client';

import { replyToTicketAction } from '@/app/actions/tickets/customerTicketActions';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { TICKET_MESSAGE_MAX_LENGTH } from '@/lib/tickets/constants';
import { Loader2, SendHorizontal } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useRouter } from 'next/navigation';
import { useState, type FormEvent, type KeyboardEvent } from 'react';

export default function CustomerReplyComposer({
    ticketId,
    resolved,
}: {
    ticketId: string;
    resolved: boolean;
}) {
    const t = useTranslations('supportTickets');
    const router = useRouter();
    const { toast } = useToast();
    const [message, setMessage] = useState('');
    const [isSending, setIsSending] = useState(false);

    const trimmed = message.trim();
    const canSend = !isSending && trimmed.length > 0 && trimmed.length <= TICKET_MESSAGE_MAX_LENGTH;

    const send = async () => {
        if (!canSend) return;
        setIsSending(true);
        try {
            const result = await replyToTicketAction({ ticketId, message: trimmed });
            if (!result.success) {
                toast({ title: t(`errors.${result.error}`), variant: 'destructive' });
                return;
            }
            setMessage('');
            router.refresh();
        } catch {
            toast({ title: t('errors.unknown'), variant: 'destructive' });
        } finally {
            setIsSending(false);
        }
    };

    const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        void send();
    };

    const handleKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
        if (event.key === 'Enter' && (event.ctrlKey || event.metaKey)) {
            event.preventDefault();
            void send();
        }
    };

    return (
        <form
            onSubmit={handleSubmit}
            className="sticky bottom-0 -mx-2 border-t bg-background px-2 pb-3 pt-3 md:mx-0 md:px-0"
        >
            {resolved && (
                <p className="mb-2 text-xs text-emerald-600 dark:text-emerald-400">
                    {t('detail.resolvedHint')}
                </p>
            )}
            <div className="flex items-end gap-2">
                <Textarea
                    value={message}
                    onChange={(event) => setMessage(event.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder={t('detail.replyPlaceholder')}
                    maxLength={TICKET_MESSAGE_MAX_LENGTH}
                    rows={3}
                    className="max-h-64 min-h-[72px] resize-y"
                />
                <Button
                    type="submit"
                    size="icon"
                    disabled={!canSend}
                    className="h-11 w-11 shrink-0 rounded-full"
                    aria-label={t('detail.send')}
                >
                    {isSending ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                        <SendHorizontal className="h-4 w-4" />
                    )}
                </Button>
            </div>
            <div className="mt-1 flex justify-between px-1 text-[11px] text-muted-foreground">
                <span className="hidden sm:inline">{t('detail.sendHint')}</span>
                {trimmed.length > TICKET_MESSAGE_MAX_LENGTH * 0.8 && (
                    <span className="ml-auto">
                        {t('form.length', {
                            current: trimmed.length,
                            max: TICKET_MESSAGE_MAX_LENGTH,
                        })}
                    </span>
                )}
            </div>
        </form>
    );
}

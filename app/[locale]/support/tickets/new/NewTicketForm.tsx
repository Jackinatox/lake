'use client';

import { createTicketAction } from '@/app/actions/tickets/customerTicketActions';
import type { TicketCategory } from '@/app/client/generated/enums';
import { ticketCategoryIcons } from '@/components/support/TicketCategoryIcon';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { Link, useRouter } from '@/i18n/navigation';
import {
    TICKET_CATEGORIES,
    TICKET_MESSAGE_MAX_LENGTH,
    TICKET_SUBJECT_MAX_LENGTH,
    TICKET_SUBJECT_MIN_LENGTH,
} from '@/lib/tickets/constants';
import { cn } from '@/lib/utils';
import { ArrowLeft, Loader2, MessageSquareText } from 'lucide-react';
import { useLocale, useTranslations } from 'next-intl';
import { ThemeImage } from '@/components/ui/theme-image';
import { formatVCoresFromPercent } from '@/lib/GlobalFunctions/formatVCores';
import { useState, type FormEvent } from 'react';

export type TicketServerOption = {
    id: string;
    name: string;
    gameName: string;
    /** Only games with drawn art (docs/game-images.md) */
    gameIconSlug: string | null;
    cpuPercent: number;
    ramMB: number;
    expires: Date;
    expired: boolean;
    suspended: boolean;
};

type OpenTicket = { id: string; number: number; subject: string; category: TicketCategory };

const NO_SERVER = '__none';

export default function NewTicketForm({
    defaultCategory,
    defaultSubject,
    defaultServerId,
    servers,
    openTickets,
}: {
    defaultCategory: TicketCategory;
    defaultSubject: string;
    defaultServerId?: string;
    servers: TicketServerOption[];
    openTickets: OpenTicket[];
}) {
    const t = useTranslations('supportTickets');
    const router = useRouter();
    const { toast } = useToast();
    const [category, setCategory] = useState<TicketCategory>(defaultCategory);
    const [serverId, setServerId] = useState(defaultServerId ?? NO_SERVER);
    const selectedServer = servers.find((server) => server.id === serverId);
    const [subject, setSubject] = useState(defaultSubject);
    const [message, setMessage] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    const trimmedSubject = subject.trim();
    const trimmedMessage = message.trim();
    const canSubmit =
        !isSubmitting &&
        trimmedSubject.length >= TICKET_SUBJECT_MIN_LENGTH &&
        trimmedMessage.length > 0 &&
        trimmedMessage.length <= TICKET_MESSAGE_MAX_LENGTH;
    const sameCategoryTickets = openTickets.filter((ticket) => ticket.category === category);

    const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        if (!canSubmit) return;

        setIsSubmitting(true);
        try {
            const result = await createTicketAction({
                category,
                subject: trimmedSubject,
                message: trimmedMessage,
                gameServerId: serverId === NO_SERVER ? undefined : serverId,
            });
            if (!result.success) {
                toast({ title: t(`errors.${result.error}`), variant: 'destructive' });
                setIsSubmitting(false);
                return;
            }
            router.push(`/support/tickets/${result.ticketId}`);
        } catch {
            toast({ title: t('errors.unknown'), variant: 'destructive' });
            setIsSubmitting(false);
        }
    };

    return (
        <div className="mx-auto -mt-2 min-h-[calc(100dvh-4rem)] w-full max-w-3xl pb-24 md:-mt-4 md:px-6 md:pb-32">
            <header className="sticky top-0 z-30 -mx-2 flex items-center gap-2 border-b bg-background px-2 py-2 md:-mx-6 md:px-6">
                <Button asChild variant="ghost" size="icon" className="shrink-0">
                    <Link href="/support/tickets" aria-label={t('form.back')}>
                        <ArrowLeft className="h-4 w-4" />
                    </Link>
                </Button>
                <h1 className="min-w-0 flex-1 truncate text-lg font-semibold tracking-tight sm:text-xl">
                    {t('form.title')}
                </h1>
            </header>
            <p className="py-3 text-sm text-muted-foreground">{t('form.description')}</p>
            <Card>
                <CardContent className="pt-3 md:pt-6">
                    <form className="space-y-6" onSubmit={handleSubmit}>
                        <fieldset className="space-y-2">
                            <legend className="text-sm font-medium leading-none">
                                {t('form.categoryLabel')}
                            </legend>
                            <div className="grid grid-cols-2 gap-2 pt-1 sm:grid-cols-3">
                                {TICKET_CATEGORIES.map((value) => {
                                    const Icon = ticketCategoryIcons[value];
                                    const selected = value === category;
                                    return (
                                        <button
                                            key={value}
                                            type="button"
                                            aria-pressed={selected}
                                            onClick={() => setCategory(value)}
                                            className={cn(
                                                'flex items-center gap-2 rounded-lg border px-3 py-2.5 text-left text-sm transition-colors',
                                                selected
                                                    ? 'border-primary bg-primary/10 font-medium text-foreground'
                                                    : 'text-muted-foreground hover:bg-accent/50',
                                            )}
                                        >
                                            <Icon
                                                className={cn(
                                                    'h-4 w-4 shrink-0',
                                                    selected && 'text-primary',
                                                )}
                                            />
                                            {t(`categories.${value}.title`)}
                                        </button>
                                    );
                                })}
                            </div>
                            <p className="text-xs text-muted-foreground">
                                <span className="font-medium text-foreground">
                                    {t(`categories.${category}.description`)}
                                </span>{' '}
                                {t(`categories.${category}.examples`)}
                            </p>
                        </fieldset>

                        {sameCategoryTickets.length > 0 && (
                            <div className="rounded-lg border border-primary/30 bg-primary/5 p-3 text-sm">
                                <p className="text-muted-foreground">{t('form.existingTickets')}</p>
                                <ul className="mt-2 space-y-1">
                                    {sameCategoryTickets.slice(0, 3).map((ticket) => (
                                        <li key={ticket.id}>
                                            <Link
                                                href={`/support/tickets/${ticket.id}`}
                                                className="inline-flex items-center gap-2 font-medium text-primary underline-offset-4 hover:underline"
                                            >
                                                <MessageSquareText className="h-4 w-4" />
                                                {`#${ticket.number} · ${ticket.subject}`}
                                            </Link>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        )}

                        {servers.length > 0 && (
                            <div className="space-y-2">
                                <Label htmlFor="ticket-server">{t('form.serverLabel')}</Label>
                                <Select value={serverId} onValueChange={setServerId}>
                                    {/* Only a pointer-opened select loses the ring: Radix gives
                                        focus back to the trigger on close, which flashed it. */}
                                    <SelectTrigger
                                        id="ticket-server"
                                        className="h-10 focus:ring-0 focus:ring-offset-0 focus-visible:ring-2 focus-visible:ring-offset-2 [&>span]:line-clamp-none [&>span]:min-w-0 [&>span]:flex-1 [&>span]:text-left"
                                    >
                                        {/* The trigger shows one compact line, the list the details */}
                                        <SelectValue>
                                            {selectedServer ? (
                                                <ServerOptionLabel server={selectedServer} compact />
                                            ) : (
                                                t('form.serverNone')
                                            )}
                                        </SelectValue>
                                    </SelectTrigger>
                                    <SelectContent className="max-w-[min(32rem,calc(100vw-2rem))]">
                                        <SelectItem value={NO_SERVER}>
                                            {t('form.serverNone')}
                                        </SelectItem>
                                        {servers.map((server) => (
                                            <SelectItem key={server.id} value={server.id}>
                                                <ServerOptionLabel server={server} />
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                <p className="text-xs text-muted-foreground">
                                    {t('form.serverHelper')}
                                </p>
                            </div>
                        )}

                        <div className="space-y-2">
                            <Label htmlFor="ticket-subject">{t('form.subjectLabel')}</Label>
                            <Input
                                id="ticket-subject"
                                value={subject}
                                onChange={(event) => setSubject(event.target.value)}
                                maxLength={TICKET_SUBJECT_MAX_LENGTH}
                                placeholder={t('form.subjectPlaceholder')}
                                required
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="ticket-message">{t('form.messageLabel')}</Label>
                            <Textarea
                                id="ticket-message"
                                rows={8}
                                value={message}
                                onChange={(event) => setMessage(event.target.value)}
                                maxLength={TICKET_MESSAGE_MAX_LENGTH}
                                placeholder={t('form.messagePlaceholder')}
                                required
                            />
                            <div className="text-right text-xs text-muted-foreground">
                                {t('form.length', {
                                    current: trimmedMessage.length,
                                    max: TICKET_MESSAGE_MAX_LENGTH,
                                })}
                            </div>
                        </div>

                        <div className="flex justify-end">
                            <Button type="submit" disabled={!canSubmit}>
                                {isSubmitting ? (
                                    <span className="flex items-center gap-2">
                                        <Loader2 className="h-4 w-4 animate-spin" />
                                        {t('form.submitting')}
                                    </span>
                                ) : (
                                    t('form.submit')
                                )}
                            </Button>
                        </div>
                    </form>
                </CardContent>
            </Card>
        </div>
    );
}

/**
 * A server in the picker: the name alone is often just the game's default name, so it shows the
 * game icon, hardware and expiry below it (same details as
 * the server header in the payment history). The details wrap on narrow screens.
 */
function ServerOptionLabel({
    server,
    compact = false,
}: {
    server: TicketServerOption;
    /** One line (the closed select): icon + name */
    compact?: boolean;
}) {
    const t = useTranslations('supportTickets');
    const locale = useLocale();
    const date = new Intl.DateTimeFormat(locale, { dateStyle: 'medium' }).format(server.expires);
    const ram = new Intl.NumberFormat(locale, { maximumFractionDigits: 1 }).format(
        server.ramMB / 1024,
    );
    const details = [
        server.gameName,
        formatVCoresFromPercent(server.cpuPercent),
        t('form.serverRam', { gb: ram }),
        t(server.expired ? 'form.serverExpiredOn' : 'form.serverRunsUntil', { date }),
    ].filter(Boolean);

    if (compact) {
        return (
            <span className="flex min-w-0 items-center gap-2">
                {server.gameIconSlug && (
                    <ThemeImage
                        src={`games/icons/${server.gameIconSlug}.webp`}
                        alt=""
                        width={20}
                        height={20}
                        className="h-5 w-5 shrink-0 rounded"
                    />
                )}
                <span className="truncate">{server.name}</span>
            </span>
        );
    }

    return (
        <span className="flex min-w-0 items-center gap-2.5">
            {server.gameIconSlug && (
                <ThemeImage
                    src={`games/icons/${server.gameIconSlug}.webp`}
                    alt=""
                    width={24}
                    height={24}
                    className="h-6 w-6 shrink-0 rounded"
                />
            )}
            <span className="min-w-0">
                <span className="block break-words font-medium">
                    {server.name}
                    {server.suspended && (
                        <span className="ml-2 text-xs font-normal text-destructive">
                            {t('form.suspended')}
                        </span>
                    )}
                </span>
                <span className="block text-xs text-muted-foreground">
                    {details.join(' · ')}
                </span>
            </span>
        </span>
    );
}

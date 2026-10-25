import type { TicketState } from '@/app/client/generated/enums';
import { ticketStateDotStyles } from '@/lib/tickets/presentation';
import { cn } from '@/lib/utils';

/** Ticket status as a coloured dot plus plain text; truncates instead of overflowing. */
export default function TicketStatusLabel({
    status,
    label,
    className,
}: {
    status: TicketState;
    label: string;
    className?: string;
}) {
    return (
        <span className={cn('inline-flex min-w-0 items-center gap-1.5', className)}>
            <span className={cn('h-2 w-2 shrink-0 rounded-full', ticketStateDotStyles[status])} />
            <span className="truncate">{label}</span>
        </span>
    );
}

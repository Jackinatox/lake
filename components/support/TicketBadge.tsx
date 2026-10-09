import { cn } from '@/lib/utils';

/** Small pill used for ticket status, category and priority in both customer and admin views. */
export default function TicketBadge({
    className,
    children,
}: {
    className?: string;
    children: React.ReactNode;
}) {
    return (
        <span
            className={cn(
                'inline-flex shrink-0 items-center whitespace-nowrap rounded-full px-2 py-0.5 text-xs font-medium',
                className,
            )}
        >
            {children}
        </span>
    );
}

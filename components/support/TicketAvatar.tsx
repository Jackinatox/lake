import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { getUserInitials } from '@/lib/auth/getUserDisplayName';
import { cn } from '@/lib/utils';
import { Bot } from 'lucide-react';

/** Profile picture next to a ticket message, falling back to initials (or a bot for SYSTEM). */
export default function TicketAvatar({
    name,
    image,
    system = false,
    className,
}: {
    name: string;
    image?: string | null;
    system?: boolean;
    className?: string;
}) {
    return (
        <Avatar className={cn('h-8 w-8', className)}>
            {image && !system && (
                // Google profile images refuse requests that carry a foreign referrer.
                <AvatarImage src={image} alt={name} referrerPolicy="no-referrer" />
            )}
            <AvatarFallback className="bg-primary/15 text-xs font-semibold text-primary">
                {system ? <Bot className="h-4 w-4" /> : getUserInitials({ username: name })}
            </AvatarFallback>
        </Avatar>
    );
}

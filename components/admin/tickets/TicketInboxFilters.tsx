'use client';

import type { TicketCategory, TicketPriority } from '@/app/client/generated/enums';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { useDebounce } from '@/hooks/use-debounce';
import { TICKET_CATEGORIES, TICKET_PRIORITIES } from '@/lib/tickets/constants';
import { adminTicketCategoryLabels, adminTicketPriorityLabels } from '@/lib/tickets/presentation';
import { cn } from '@/lib/utils';
import type { AdminTicketSort, AdminTicketView } from '@/lib/validation/tickets';
import { SearchIcon, XIcon } from 'lucide-react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';

const VIEW_LABELS: Record<AdminTicketView, string> = {
    needsReply: 'Needs reply',
    mine: 'Mine',
    unassigned: 'Unassigned',
    waiting: 'Waiting on customer',
    onHold: 'On hold',
    resolved: 'Resolved',
    closed: 'Closed',
    all: 'All',
};

const SORT_LABELS: Record<AdminTicketSort, string> = {
    activity: 'Last activity',
    waiting: 'Longest waiting',
    priority: 'Priority',
    created: 'Newest',
};

const ALL = 'ALL';

export default function TicketInboxFilters({
    view,
    counts,
    category,
    priority,
    sort,
    q,
    userLabel,
    serverLabel,
}: {
    view: AdminTicketView;
    counts: Record<AdminTicketView, number>;
    category?: TicketCategory;
    priority?: TicketPriority;
    sort: AdminTicketSort;
    q?: string;
    /** Display labels for the `userId` / `serverId` filters, when set. */
    userLabel?: string;
    serverLabel?: string;
}) {
    const router = useRouter();
    const pathname = usePathname();
    const searchParams = useSearchParams();
    const [search, setSearch] = useState(q ?? '');

    const update = (patch: Record<string, string | undefined>) => {
        const params = new URLSearchParams(searchParams.toString());
        for (const [key, value] of Object.entries(patch)) {
            if (value) params.set(key, value);
            else params.delete(key);
        }
        params.delete('page');
        const query = params.toString();
        router.replace(query ? `${pathname}?${query}` : pathname, { scroll: false });
    };

    // Only push the search to the URL once typing pauses.
    const debouncedSearch = useDebounce(search.trim(), 400);
    useEffect(() => {
        if (debouncedSearch === (q ?? '')) return;
        update({ q: debouncedSearch || undefined });
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [debouncedSearch]);

    return (
        <div className="flex flex-col gap-3">
            <div className="flex flex-wrap gap-1 rounded-lg bg-muted p-1">
                {(Object.keys(VIEW_LABELS) as AdminTicketView[]).map((value) => (
                    <button
                        key={value}
                        type="button"
                        onClick={() =>
                            update({
                                view: value === 'needsReply' ? undefined : value,
                                sort: undefined,
                            })
                        }
                        className={cn(
                            'rounded-md px-2.5 py-1 text-xs font-medium transition-colors sm:text-sm',
                            value === view
                                ? 'bg-background text-foreground shadow-sm'
                                : 'text-muted-foreground hover:text-foreground',
                        )}
                    >
                        {VIEW_LABELS[value]}
                        <span className="ml-1.5 text-[11px] text-muted-foreground">
                            {counts[value]}
                        </span>
                    </button>
                ))}
            </div>

            <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center">
                <div className="relative sm:w-72">
                    <SearchIcon className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                        value={search}
                        onChange={(event) => setSearch(event.target.value)}
                        placeholder="#number, subject, email, username, text"
                        className="h-9 pl-8"
                    />
                </div>
                <Select
                    value={category ?? ALL}
                    onValueChange={(value) =>
                        update({ category: value === ALL ? undefined : value })
                    }
                >
                    <SelectTrigger className="h-9 sm:w-40">
                        <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value={ALL}>All categories</SelectItem>
                        {TICKET_CATEGORIES.map((value) => (
                            <SelectItem key={value} value={value}>
                                {adminTicketCategoryLabels[value]}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
                <Select
                    value={priority ?? ALL}
                    onValueChange={(value) =>
                        update({ priority: value === ALL ? undefined : value })
                    }
                >
                    <SelectTrigger className="h-9 sm:w-36">
                        <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value={ALL}>All priorities</SelectItem>
                        {TICKET_PRIORITIES.map((value) => (
                            <SelectItem key={value} value={value}>
                                {adminTicketPriorityLabels[value]}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
                <Select value={sort} onValueChange={(value) => update({ sort: value })}>
                    <SelectTrigger className="h-9 sm:w-40">
                        <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                        {(Object.keys(SORT_LABELS) as AdminTicketSort[]).map((value) => (
                            <SelectItem key={value} value={value}>
                                {SORT_LABELS[value]}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
                {userLabel && (
                    <Button
                        variant="secondary"
                        size="sm"
                        className="h-9 gap-1"
                        onClick={() => update({ userId: undefined })}
                    >
                        User: {userLabel}
                        <XIcon className="h-3.5 w-3.5" />
                    </Button>
                )}
                {serverLabel && (
                    <Button
                        variant="secondary"
                        size="sm"
                        className="h-9 gap-1"
                        onClick={() => update({ serverId: undefined })}
                    >
                        Server: {serverLabel}
                        <XIcon className="h-3.5 w-3.5" />
                    </Button>
                )}
            </div>
        </div>
    );
}

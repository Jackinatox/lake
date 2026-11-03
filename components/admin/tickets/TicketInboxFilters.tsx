'use client';

import type { TicketCategory, TicketPriority } from '@/app/client/generated/enums';
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
import { useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Link, usePathname, useRouter } from '@/i18n/navigation';

const VIEW_LABELS: Record<AdminTicketView, string> = {
    needsReply: 'Needs reply',
    mine: 'Mine',
    unassigned: 'Unassigned',
    waiting: 'Waiting on customer',
    onHold: 'On hold',
    resolved: 'Resolved',
    closed: 'Closed',
    all: 'All tickets',
};

const VIEW_GROUPS: { title: string; views: AdminTicketView[] }[] = [
    { title: 'Inbox', views: ['needsReply', 'mine', 'unassigned'] },
    { title: 'Status', views: ['waiting', 'onHold', 'resolved', 'closed', 'all'] },
];

const SORT_LABELS: Record<AdminTicketSort, string> = {
    activity: 'Last activity',
    waiting: 'Longest waiting',
    priority: 'Priority',
    created: 'Newest',
};

const ALL = 'ALL';

/** Builds the inbox URL for a patch of query params; any change resets the page. */
function useInboxHref() {
    const pathname = usePathname();
    const searchParams = useSearchParams();
    return (patch: Record<string, string | undefined>) => {
        const params = new URLSearchParams(searchParams.toString());
        for (const [key, value] of Object.entries(patch)) {
            if (value) params.set(key, value);
            else params.delete(key);
        }
        params.delete('page');
        const query = params.toString();
        return query ? `${pathname}?${query}` : pathname;
    };
}

// The default view and its sort are left out of the URL; switching views resets the sort.
const viewPatch = (view: AdminTicketView) => ({
    view: view === 'needsReply' ? undefined : view,
    sort: undefined,
});

/** Inbox views as a vertical nav (desktop) or a select (mobile). */
export function TicketInboxViews({
    view,
    counts,
}: {
    view: AdminTicketView;
    counts: Record<AdminTicketView, number>;
}) {
    const router = useRouter();
    const href = useInboxHref();

    return (
        <>
            <Select
                value={view}
                onValueChange={(value) =>
                    router.replace(href(viewPatch(value as AdminTicketView)), { scroll: false })
                }
            >
                <SelectTrigger className="h-9 lg:hidden">
                    <SelectValue />
                </SelectTrigger>
                <SelectContent>
                    {(Object.keys(VIEW_LABELS) as AdminTicketView[]).map((value) => (
                        <SelectItem key={value} value={value}>
                            {VIEW_LABELS[value]} ({counts[value]})
                        </SelectItem>
                    ))}
                </SelectContent>
            </Select>

            <nav className="hidden flex-col gap-4 lg:flex">
                {VIEW_GROUPS.map((group) => (
                    <div key={group.title} className="flex flex-col gap-0.5">
                        <h2 className="px-2.5 pb-1 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                            {group.title}
                        </h2>
                        {group.views.map((value) => {
                            const active = value === view;
                            return (
                                <Link
                                    key={value}
                                    href={href(viewPatch(value))}
                                    scroll={false}
                                    aria-current={active ? 'page' : undefined}
                                    className={cn(
                                        'flex items-center justify-between gap-2 rounded-md px-2.5 py-1.5 text-sm transition-colors',
                                        active
                                            ? 'bg-accent font-medium text-accent-foreground'
                                            : 'text-muted-foreground hover:bg-accent/50 hover:text-foreground',
                                    )}
                                >
                                    <span className="truncate">{VIEW_LABELS[value]}</span>
                                    <span
                                        className={cn(
                                            'text-xs tabular-nums',
                                            active ? 'text-foreground' : 'text-muted-foreground',
                                        )}
                                    >
                                        {counts[value]}
                                    </span>
                                </Link>
                            );
                        })}
                    </div>
                ))}
            </nav>
        </>
    );
}

/** Search, category/priority/sort selects and the removable user/server filters. */
export function TicketInboxToolbar({
    category,
    priority,
    sort,
    q,
    userLabel,
    serverLabel,
}: {
    category?: TicketCategory;
    priority?: TicketPriority;
    sort: AdminTicketSort;
    q?: string;
    /** Display labels for the `userId` / `serverId` filters, when set. */
    userLabel?: string;
    serverLabel?: string;
}) {
    const router = useRouter();
    const href = useInboxHref();
    const [search, setSearch] = useState(q ?? '');

    const update = (patch: Record<string, string | undefined>) =>
        router.replace(href(patch), { scroll: false });

    // Only push the search to the URL once typing pauses.
    const debouncedSearch = useDebounce(search.trim(), 400);
    useEffect(() => {
        if (debouncedSearch === (q ?? '')) return;
        update({ q: debouncedSearch || undefined });
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [debouncedSearch]);

    return (
        <div className="flex flex-col gap-2 border-b px-4 py-3">
            <div className="flex flex-col gap-2 md:flex-row md:items-center">
                <div className="relative md:flex-1">
                    <SearchIcon className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                        value={search}
                        onChange={(event) => setSearch(event.target.value)}
                        placeholder="Search #number, subject, email, username, text"
                        className="h-9 pl-8"
                    />
                </div>
                <div className="grid grid-cols-3 gap-2 md:flex">
                    <Select
                        value={category ?? ALL}
                        onValueChange={(value) =>
                            update({ category: value === ALL ? undefined : value })
                        }
                    >
                        <SelectTrigger className="h-9 md:w-36">
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
                        <SelectTrigger className="h-9 md:w-32">
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
                        <SelectTrigger className="h-9 md:w-36">
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
                </div>
            </div>
            {(userLabel || serverLabel) && (
                <div className="flex flex-wrap gap-1.5">
                    {userLabel && (
                        <FilterChip
                            label="User"
                            value={userLabel}
                            onRemove={() => update({ userId: undefined })}
                        />
                    )}
                    {serverLabel && (
                        <FilterChip
                            label="Server"
                            value={serverLabel}
                            onRemove={() => update({ serverId: undefined })}
                        />
                    )}
                </div>
            )}
        </div>
    );
}

function FilterChip({
    label,
    value,
    onRemove,
}: {
    label: string;
    value: string;
    onRemove: () => void;
}) {
    return (
        <span className="inline-flex max-w-full items-center gap-1 rounded-md border bg-muted/50 py-0.5 pl-2 pr-0.5 text-xs">
            <span className="text-muted-foreground">{label}:</span>
            <span className="truncate font-medium">{value}</span>
            <button
                type="button"
                onClick={onRemove}
                aria-label={`Remove ${label.toLowerCase()} filter`}
                className="rounded p-0.5 text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
            >
                <XIcon className="h-3.5 w-3.5" />
            </button>
        </span>
    );
}

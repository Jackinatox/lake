'use client';

import { useEffect, useRef, useState } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import AdminUserPicker from '@/components/admin/AdminUserPicker';
import type { LogUserOption } from '@/app/actions/logs/getApplicationLogs';
import { useDebounce } from '@/hooks/use-debounce';
import { GameServerStatus, GameServerType } from '@/app/client/generated/enums';
import {
    CREATED_RANGE_KEYS,
    CREATED_RANGE_META,
    DEFAULT_CREATED_RANGE,
} from '@/lib/gameserver/adminServers';
import { Search, X } from 'lucide-react';
import { ThemeImage } from '@/components/ui/theme-image';
import { cn } from '@/lib/utils';
import { STATUS_META, TYPE_META } from './presentation';
import type { ServerFilterState } from './types';
import { useServerParams } from './useServerParams';

type ServerFiltersProps = {
    filters: ServerFilterState;
    locations: { id: number; name: string }[];
    games: { id: number; name: string; slug: string; hasIcon: boolean }[];
    /** The user behind `filters.userId`, resolved server-side. */
    selectedUser: LogUserOption | null;
    /** Number of active filters; drives the clear-all button. */
    filterCount: number;
};

function Field({
    label,
    className,
    children,
}: {
    label: string;
    className?: string;
    children: React.ReactNode;
}) {
    return (
        <div className={cn('space-y-1', className)}>
            <span className="block text-[11px] font-medium text-muted-foreground">{label}</span>
            {children}
        </div>
    );
}

export default function ServerFilters({
    filters,
    locations,
    games,
    selectedUser,
    filterCount,
}: ServerFiltersProps) {
    const { setParams, clearAll, pending } = useServerParams();
    const inputRef = useRef<HTMLInputElement>(null);

    const [search, setSearch] = useState(filters.search ?? '');
    const debouncedSearch = useDebounce(search, 400);
    // What we last wrote to (or read from) the URL — keeps typing from fighting the router and
    // still lets an outside change, like "clear all", reset the box.
    const syncedSearch = useRef(filters.search ?? '');

    useEffect(() => {
        if (debouncedSearch === syncedSearch.current) return;
        syncedSearch.current = debouncedSearch;
        setParams({ search: debouncedSearch || undefined });
        // setParams is recreated each render; depending on it would push on every render
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [debouncedSearch]);

    useEffect(() => {
        const incoming = filters.search ?? '';
        if (incoming === syncedSearch.current) return;
        syncedSearch.current = incoming;
        setSearch(incoming);
    }, [filters.search]);

    // "/" jumps to the search box, the way it works in most log/console UIs
    useEffect(() => {
        const onKeyDown = (event: KeyboardEvent) => {
            if (event.key !== '/' || event.metaKey || event.ctrlKey) return;
            const target = event.target as HTMLElement | null;
            if (target && /^(INPUT|TEXTAREA|SELECT)$/.test(target.tagName)) return;
            if (target?.isContentEditable) return;
            event.preventDefault();
            inputRef.current?.focus();
        };
        document.addEventListener('keydown', onKeyDown);
        return () => document.removeEventListener('keydown', onKeyDown);
    }, []);

    return (
        // The clear button rides in the same row as the fields and is only ever disabled,
        // never removed — a button that appears on the first filter would push the whole
        // page down a line.
        <div className={cn('flex items-end gap-2 transition-opacity', pending && 'opacity-60')}>
            {/* Widths follow the content, not an equal-column grid: only Search and Owner
                need room, so the whole bar stays on one line well below 1280px. */}
            <div className="flex min-w-0 flex-1 flex-wrap items-end gap-2">
                <Field label="Search" className="min-w-[150px] flex-1">
                    <div className="relative">
                        <Search className="absolute left-2 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
                        <Input
                            ref={inputRef}
                            placeholder="Name, id, PT id, owner…  ( / )"
                            value={search}
                            onChange={(event) => setSearch(event.target.value)}
                            maxLength={200}
                            className="h-8 pl-7 text-xs"
                        />
                    </div>
                </Field>

                <Field label="Owner" className="w-44 shrink-0">
                    <AdminUserPicker
                        value={filters.userId}
                        selectedUser={selectedUser}
                        onChange={(userId) =>
                            // A server filter without its owner is meaningless
                            setParams({ userId, serverId: undefined })
                        }
                    />
                </Field>

                <Field label="Game" className="w-32 shrink-0">
                    <Select
                        value={filters.gameId ?? 'all'}
                        onValueChange={(value) => setParams({ gameId: value })}
                    >
                        <SelectTrigger className="h-8 text-xs">
                            <SelectValue placeholder="All games" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all" className="text-xs">
                                All games
                            </SelectItem>
                            {games.map((game) => (
                                <SelectItem
                                    key={game.id}
                                    value={String(game.id)}
                                    className="text-xs"
                                >
                                    <span className="flex items-center gap-2">
                                        {game.hasIcon && (
                                            // Theme-less path: ThemeImage picks the light or
                                            // dark file — see docs/game-images.md
                                            <ThemeImage
                                                src={`games/icons/${game.slug}.webp`}
                                                alt=""
                                                width={16}
                                                height={16}
                                                className="h-4 w-4 shrink-0 rounded-[3px] object-contain"
                                            />
                                        )}
                                        {game.name}
                                    </span>
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </Field>

                <Field label="Location" className="w-32 shrink-0">
                    <Select
                        value={filters.locationId ?? 'all'}
                        onValueChange={(value) => setParams({ locationId: value })}
                    >
                        <SelectTrigger className="h-8 text-xs">
                            <SelectValue placeholder="All locations" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all" className="text-xs">
                                All locations
                            </SelectItem>
                            {locations.map((location) => (
                                <SelectItem
                                    key={location.id}
                                    value={String(location.id)}
                                    className="text-xs"
                                >
                                    {location.name}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </Field>

                <Field label="Created" className="w-32 shrink-0">
                    <Select
                        value={filters.created ?? DEFAULT_CREATED_RANGE}
                        onValueChange={(value) =>
                            setParams({
                                created: value === DEFAULT_CREATED_RANGE ? undefined : value,
                            })
                        }
                    >
                        <SelectTrigger className="h-8 text-xs">
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            {CREATED_RANGE_KEYS.map((key) => (
                                <SelectItem key={key} value={key} className="text-xs">
                                    {CREATED_RANGE_META[key]}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </Field>

                <Field label="Plan" className="w-28 shrink-0">
                    <Select
                        value={filters.type ?? 'all'}
                        onValueChange={(value) => setParams({ type: value })}
                    >
                        <SelectTrigger className="h-8 text-xs">
                            <SelectValue placeholder="All" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all" className="text-xs">
                                All plans
                            </SelectItem>
                            {Object.values(GameServerType).map((type) => (
                                <SelectItem key={type} value={type} className="text-xs">
                                    {TYPE_META[type].label}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </Field>

                <Field label="Status" className="w-40 shrink-0">
                    <Select
                        value={filters.status ?? 'all'}
                        onValueChange={(value) => setParams({ status: value })}
                    >
                        <SelectTrigger className="h-8 text-xs">
                            <SelectValue placeholder="All, excl. deleted" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all" className="text-xs">
                                All, excl. deleted
                            </SelectItem>
                            {Object.values(GameServerStatus).map((status) => (
                                <SelectItem key={status} value={status} className="text-xs">
                                    {STATUS_META[status].label}
                                </SelectItem>
                            ))}
                            <SelectItem value="ANY" className="text-xs">
                                All, incl. deleted
                            </SelectItem>
                        </SelectContent>
                    </Select>
                </Field>
            </div>

            <Button
                variant="outline"
                size="sm"
                className="h-8 shrink-0 text-xs"
                disabled={filterCount === 0}
                onClick={clearAll}
                title="Remove every filter"
            >
                <X className="h-3.5 w-3.5" />
                Clear
            </Button>
        </div>
    );
}

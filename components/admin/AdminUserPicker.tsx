'use client';

import { useEffect, useState } from 'react';
import { Check, ChevronsUpDown, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
    Command,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList,
} from '@/components/ui/command';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { searchLogUsers, LogUserOption } from '@/app/actions/logs/getApplicationLogs';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { getUserDisplayName, getUserInitials } from '@/lib/auth/getUserDisplayName';
import { useDebounce } from '@/hooks/use-debounce';
import { cn } from '@/lib/utils';

export type AdminUserPickerLabels = {
    all: string;
    searchPlaceholder: string;
    empty: string;
    clear: string;
    /** Shown while an id from the URL is still being resolved to a name. */
    resolving: string;
};

type AdminUserPickerProps = {
    value?: string;
    onChange: (userId?: string) => void;
    /**
     * The user behind `value`, when the caller already has it (a server component usually
     * does). Passing it skips the resolve round trip *and* the flash of the raw id.
     */
    selectedUser?: LogUserOption | null;
    labels?: Partial<AdminUserPickerLabels>;
};

const DEFAULT_LABELS: AdminUserPickerLabels = {
    all: 'All users',
    searchPlaceholder: 'Search email, name or id…',
    empty: 'No users found',
    clear: 'Clear user filter',
    resolving: '…',
};

/** Avatar with initials as the fallback — users without a picture still get a marker. */
function UserAvatar({ user, className }: { user: LogUserOption; className?: string }) {
    return (
        <Avatar className={cn('shrink-0', className)}>
            <AvatarImage src={user.image ?? ''} alt="" />
            <AvatarFallback className="text-[9px]">{getUserInitials(user)}</AvatarFallback>
        </Avatar>
    );
}

/**
 * Admin-only user combobox that searches server-side (`searchLogUsers`), so it works with any
 * number of accounts — unlike a `<Select>` that has to ship every user to the browser.
 *
 * Shared by the log viewer and the gameserver panel; `labels` exists so a translated caller can
 * pass its own strings while plain admin screens keep the English defaults.
 */
export default function AdminUserPicker({
    value,
    onChange,
    selectedUser,
    labels,
}: AdminUserPickerProps) {
    const text = { ...DEFAULT_LABELS, ...labels };
    const [open, setOpen] = useState(false);
    const [query, setQuery] = useState('');
    const [users, setUsers] = useState<LogUserOption[]>([]);
    const [resolved, setResolved] = useState<LogUserOption | null>(selectedUser ?? null);
    const debouncedQuery = useDebounce(query, 300);

    // The user we can actually name right now: the one the caller handed us, or one we looked up.
    const known =
        value && selectedUser?.id === value
            ? selectedUser
            : value && resolved?.id === value
              ? resolved
              : null;

    // The list is only needed once the popover is open — fetching it on mount cost a server
    // action round trip on every page load, for a dropdown most visits never open.
    useEffect(() => {
        if (!open) return;
        let cancelled = false;
        searchLogUsers(debouncedQuery)
            .then((result) => {
                if (!cancelled) setUsers(result);
            })
            .catch((error) => console.error('Failed to search users:', error));
        return () => {
            cancelled = true;
        };
    }, [open, debouncedQuery]);

    // Resolve a value that came from outside (URL, a row's filter button) and that the caller
    // did not name for us. An id that resolves to nothing is kept as its own label, so a
    // deleted user still shows *something* instead of spinning forever.
    useEffect(() => {
        if (!value || known) return;

        let cancelled = false;
        searchLogUsers(value)
            .then((result) => {
                if (cancelled) return;
                setResolved(
                    result.find((user) => user.id === value) ?? {
                        id: value,
                        name: value,
                        username: null,
                        email: '',
                        image: null,
                    },
                );
            })
            .catch((error) => console.error('Failed to resolve user:', error));
        return () => {
            cancelled = true;
        };
    }, [value, known]);

    const label = !value ? text.all : known ? getUserDisplayName(known) : text.resolving;

    return (
        // The clear button is a *sibling* of the trigger, never inside it: `Button` sets
        // `[&_svg]:pointer-events-none`, so an icon within the trigger cannot be clicked at all
        // (and a button nested in a button is invalid markup). Laying them out side by side
        // also keeps the X inside its own box at every field width.
        <div className="flex w-full items-center gap-1">
            <Popover open={open} onOpenChange={setOpen}>
                <PopoverTrigger asChild>
                    <Button
                        variant="outline"
                        role="combobox"
                        aria-expanded={open}
                        className="h-8 min-w-0 flex-1 justify-between px-2 text-xs font-normal"
                    >
                        <span className="flex min-w-0 items-center gap-1.5">
                            {known && <UserAvatar user={known} className="h-4.5 w-4.5" />}
                            <span className={cn('truncate', !value && 'text-muted-foreground')}>
                                {label}
                            </span>
                        </span>
                        <ChevronsUpDown className="h-3.5 w-3.5 shrink-0 opacity-50" />
                    </Button>
                </PopoverTrigger>
                <PopoverContent
                    className="w-[var(--radix-popover-trigger-width)] min-w-72 p-0"
                    align="start"
                >
                    <Command shouldFilter={false}>
                        <CommandInput
                            placeholder={text.searchPlaceholder}
                            value={query}
                            onValueChange={setQuery}
                        />
                        <CommandList>
                            <CommandEmpty>{text.empty}</CommandEmpty>
                            <CommandGroup>
                                {users.map((user) => (
                                    <CommandItem
                                        key={user.id}
                                        value={user.id}
                                        onSelect={() => {
                                            setResolved(user);
                                            onChange(user.id);
                                            setOpen(false);
                                        }}
                                        className="text-xs"
                                    >
                                        <UserAvatar user={user} className="mr-2 h-6 w-6" />
                                        <span className="min-w-0 flex-1">
                                            <span className="block truncate">
                                                {getUserDisplayName(user)}
                                            </span>
                                            <span className="block truncate text-muted-foreground">
                                                {user.email}
                                            </span>
                                        </span>
                                        <Check
                                            className={cn(
                                                'ml-2 h-3.5 w-3.5 shrink-0',
                                                value === user.id ? 'opacity-100' : 'opacity-0',
                                            )}
                                        />
                                    </CommandItem>
                                ))}
                            </CommandGroup>
                        </CommandList>
                    </Command>
                </PopoverContent>
            </Popover>

            {value && (
                <Button
                    type="button"
                    variant="outline"
                    size="icon-sm"
                    title={text.clear}
                    aria-label={text.clear}
                    onClick={() => {
                        setResolved(null);
                        onChange(undefined);
                    }}
                    className="shrink-0 text-muted-foreground hover:text-foreground"
                >
                    <X className="h-3.5 w-3.5" />
                </Button>
            )}
        </div>
    );
}

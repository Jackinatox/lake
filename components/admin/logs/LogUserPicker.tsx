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
import { getUserDisplayName } from '@/lib/auth/getUserDisplayName';
import { useDebounce } from '@/hooks/use-debounce';
import { cn } from '@/lib/utils';
import { useTranslations } from 'next-intl';

type LogUserPickerProps = {
    value?: string;
    onChange: (userId?: string) => void;
};

export default function LogUserPicker({ value, onChange }: LogUserPickerProps) {
    const t = useTranslations('adminLogs.filters');
    const [open, setOpen] = useState(false);
    const [query, setQuery] = useState('');
    const [users, setUsers] = useState<LogUserOption[]>([]);
    const [selected, setSelected] = useState<LogUserOption | null>(null);
    const debouncedQuery = useDebounce(query, 300);

    useEffect(() => {
        let cancelled = false;
        searchLogUsers(debouncedQuery)
            .then((result) => {
                if (!cancelled) setUsers(result);
            })
            .catch((error) => console.error('Failed to search users:', error));
        return () => {
            cancelled = true;
        };
    }, [debouncedQuery]);

    // Resolve the label when the filter was set from outside (URL, log row click)
    useEffect(() => {
        if (!value) {
            setSelected(null);
            return;
        }
        if (selected?.id === value) return;

        let cancelled = false;
        searchLogUsers(value)
            .then((result) => {
                const match = result.find((user) => user.id === value);
                if (!cancelled && match) setSelected(match);
            })
            .catch((error) => console.error('Failed to resolve user:', error));
        return () => {
            cancelled = true;
        };
    }, [value, selected?.id]);

    const label = value ? (selected ? getUserDisplayName(selected) : value) : t('allUsers');

    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
                <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={open}
                    className="h-8 w-full justify-between px-2 text-xs font-normal"
                >
                    <span className={cn('truncate', !value && 'text-muted-foreground')}>
                        {label}
                    </span>
                    {value ? (
                        <X
                            className="h-3.5 w-3.5 shrink-0 opacity-60 hover:opacity-100"
                            onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                setSelected(null);
                                onChange(undefined);
                            }}
                        />
                    ) : (
                        <ChevronsUpDown className="h-3.5 w-3.5 shrink-0 opacity-50" />
                    )}
                </Button>
            </PopoverTrigger>
            <PopoverContent
                className="w-[var(--radix-popover-trigger-width)] min-w-72 p-0"
                align="start"
            >
                <Command shouldFilter={false}>
                    <CommandInput
                        placeholder={t('userSearchPlaceholder')}
                        value={query}
                        onValueChange={setQuery}
                    />
                    <CommandList>
                        <CommandEmpty>{t('noUsers')}</CommandEmpty>
                        <CommandGroup>
                            {users.map((user) => (
                                <CommandItem
                                    key={user.id}
                                    value={user.id}
                                    onSelect={() => {
                                        setSelected(user);
                                        onChange(user.id);
                                        setOpen(false);
                                    }}
                                    className="text-xs"
                                >
                                    <Check
                                        className={cn(
                                            'mr-2 h-3.5 w-3.5',
                                            value === user.id ? 'opacity-100' : 'opacity-0',
                                        )}
                                    />
                                    <span className="min-w-0">
                                        <span className="block truncate">
                                            {getUserDisplayName(user)}
                                        </span>
                                        <span className="block truncate text-muted-foreground">
                                            {user.email}
                                        </span>
                                    </span>
                                </CommandItem>
                            ))}
                        </CommandGroup>
                    </CommandList>
                </Command>
            </PopoverContent>
        </Popover>
    );
}

'use client';

import React, { useCallback, useEffect, useState, useTransition } from 'react';
import { Search, UsersIcon } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { searchUsers } from '@/app/actions/users/adminUsers';
import { User } from '@/app/client/generated/browser';
import UsersTable from './usersTable';

type UserWithCount = User & { _count: { GameServer: number } };

export default function UsersPageClient() {
    const [query, setQuery] = useState('');
    const [users, setUsers] = useState<UserWithCount[]>([]);
    const [total, setTotal] = useState(0);
    const [isPending, startTransition] = useTransition();

    const doSearch = useCallback(
        (q: string) => {
            startTransition(async () => {
                const result = await searchUsers(q);
                setUsers(result.users as UserWithCount[]);
                setTotal(result.total);
            });
        },
        [startTransition],
    );

    useEffect(() => {
        doSearch('');
    }, [doSearch]);

    useEffect(() => {
        const timeout = setTimeout(() => doSearch(query), 300);
        return () => clearTimeout(timeout);
    }, [query, doSearch]);

    return (
        <Card className="w-full">
            <CardHeader>
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <CardTitle className="flex items-center gap-2">
                        <UsersIcon className="h-5 w-5" />
                        Users
                        <span className="text-sm font-normal text-muted-foreground">
                            &middot; {total} total
                        </span>
                    </CardTitle>
                    <div className="relative w-full sm:max-w-xs">
                        <Search className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                        <Input
                            placeholder="Search by email, username, name, ID..."
                            value={query}
                            onChange={(e) => setQuery(e.target.value)}
                            className="pl-9"
                        />
                    </div>
                </div>
            </CardHeader>
            <CardContent>
                {isPending && users.length === 0 ? (
                    <p className="py-8 text-center text-sm text-muted-foreground">Loading...</p>
                ) : users.length === 0 ? (
                    <p className="py-8 text-center text-sm text-muted-foreground">
                        No users found.
                    </p>
                ) : (
                    <UsersTable users={users} onRefresh={() => doSearch(query)} />
                )}
            </CardContent>
        </Card>
    );
}

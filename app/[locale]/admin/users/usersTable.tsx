'use client';

import React, { useState, useTransition } from 'react';
import Link from 'next/link';
import {
    Ban,
    CheckCircle,
    Copy,
    Loader2,
    MoreHorizontal,
    Server,
    ShieldOff,
    Star,
    X,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
    Table,
    TableHeader,
    TableRow,
    TableHead,
    TableBody,
    TableCell,
} from '@/components/ui/table';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { User } from '@/app/client/generated/browser';
import {
    verifyUserEmail,
    toggleBanUser,
    getPterodactylUserInfo,
} from '@/app/actions/users/adminUsers';

type UserWithCount = User & { _count: { GameServer: number } };

interface UsersTableProps {
    users: UserWithCount[];
    onRefresh: () => void;
}

type PtUserData = {
    id: number;
    externalId: string | null;
    uuid: string;
    username: string;
    email: string;
    firstName: string;
    lastName: string;
    language: string;
    rootAdmin: boolean;
    twoFactor: boolean;
    createdAt: string;
    updatedAt: string;
};

const UsersTable: React.FC<UsersTableProps> = ({ users, onRefresh }) => {
    const [isPending, startTransition] = useTransition();
    const [ptDialog, setPtDialog] = useState<{
        open: boolean;
        loading: boolean;
        data: PtUserData | null;
        error: string | null;
        userName: string;
    }>({ open: false, loading: false, data: null, error: null, userName: '' });

    const handleVerifyEmail = (userId: string) => {
        startTransition(async () => {
            await verifyUserEmail(userId);
            onRefresh();
        });
    };

    const handleToggleBan = (userId: string, currentlyBanned: boolean) => {
        startTransition(async () => {
            await toggleBanUser(userId, !currentlyBanned);
            onRefresh();
        });
    };

    const handleViewPtInfo = async (ptUserId: number, userName: string) => {
        setPtDialog({ open: true, loading: true, data: null, error: null, userName });
        const result = await getPterodactylUserInfo(ptUserId);
        if (result.success && result.data) {
            setPtDialog((prev) => ({
                ...prev,
                loading: false,
                data: result.data as PtUserData,
            }));
        } else {
            setPtDialog((prev) => ({
                ...prev,
                loading: false,
                error: result.error || 'Unknown error',
            }));
        }
    };

    const copyToClipboard = (text: string) => {
        navigator.clipboard.writeText(text);
    };

    return (
        <>
            <div className="overflow-x-auto">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead className="w-10"></TableHead>
                            <TableHead>Name</TableHead>
                            <TableHead className="hidden sm:table-cell">Email</TableHead>
                            <TableHead className="hidden md:table-cell">Login</TableHead>
                            <TableHead className="text-center">Verified</TableHead>
                            <TableHead className="text-center">Banned</TableHead>
                            <TableHead className="text-center">Servers</TableHead>
                            <TableHead className="w-10"></TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {users.map((user) => (
                            <TableRow key={user.id}>
                                <TableCell>
                                    <Avatar className="h-8 w-8">
                                        <AvatarImage
                                            src={user.image || ''}
                                            alt={user.name || 'User'}
                                        />
                                        <AvatarFallback className="text-xs">
                                            {user.name
                                                ? user.name
                                                      .split(' ')
                                                      .map((n) => n[0])
                                                      .join('')
                                                      .toUpperCase()
                                                : user.email?.[0]?.toUpperCase() || 'U'}
                                        </AvatarFallback>
                                    </Avatar>
                                </TableCell>
                                <TableCell>
                                    <div className="flex items-center gap-1.5">
                                        <span className="text-sm font-medium">{user.name || '—'}</span>
                                        {user.role === 'admin' && (
                                            <Star className="h-3.5 w-3.5 fill-yellow-500 text-yellow-500" />
                                        )}
                                    </div>
                                    <div className="text-xs text-muted-foreground sm:hidden">
                                        {user.email}
                                    </div>
                                </TableCell>
                                <TableCell className="hidden sm:table-cell">
                                    <span className="text-sm">{user.email}</span>
                                </TableCell>
                                <TableCell className="hidden md:table-cell">
                                    <span className="text-xs text-muted-foreground">
                                        {user.lastLoginMethod || '—'}
                                    </span>
                                </TableCell>
                                <TableCell className="text-center">
                                    {user.emailVerified ? (
                                        <CheckCircle className="mx-auto h-4 w-4 text-green-500" />
                                    ) : (
                                        <X className="mx-auto h-4 w-4 text-muted-foreground/40" />
                                    )}
                                </TableCell>
                                <TableCell className="text-center">
                                    {user.banned ? (
                                        <Ban className="mx-auto h-4 w-4 text-destructive" />
                                    ) : (
                                        <span className="mx-auto block h-4 w-4" />
                                    )}
                                </TableCell>
                                <TableCell className="text-center">
                                    <Link
                                        href={`/admin/gameservers?userId=${user.id}`}
                                        className="text-sm text-primary underline underline-offset-4 hover:text-primary/80"
                                    >
                                        {user._count.GameServer}
                                    </Link>
                                </TableCell>
                                <TableCell>
                                    <DropdownMenu>
                                        <DropdownMenuTrigger asChild>
                                            <Button variant="ghost" size="icon" className="h-8 w-8">
                                                <MoreHorizontal className="h-4 w-4" />
                                            </Button>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent align="end">
                                            <DropdownMenuLabel className="text-xs">
                                                {user.email}
                                            </DropdownMenuLabel>
                                            <DropdownMenuSeparator />
                                            <DropdownMenuItem
                                                onClick={() => copyToClipboard(user.id)}
                                            >
                                                <Copy className="mr-2 h-4 w-4" />
                                                Copy User ID
                                            </DropdownMenuItem>
                                            {!user.emailVerified && (
                                                <DropdownMenuItem
                                                    onClick={() => handleVerifyEmail(user.id)}
                                                    disabled={isPending}
                                                >
                                                    <CheckCircle className="mr-2 h-4 w-4" />
                                                    Verify Email
                                                </DropdownMenuItem>
                                            )}
                                            {user.ptUserId && (
                                                <DropdownMenuItem
                                                    onClick={() =>
                                                        handleViewPtInfo(
                                                            user.ptUserId!,
                                                            user.name || user.email || 'User',
                                                        )
                                                    }
                                                >
                                                    <Server className="mr-2 h-4 w-4" />
                                                    Pterodactyl Info
                                                </DropdownMenuItem>
                                            )}
                                            <DropdownMenuSeparator />
                                            <DropdownMenuItem
                                                onClick={() =>
                                                    handleToggleBan(user.id, !!user.banned)
                                                }
                                                disabled={isPending}
                                                className={
                                                    user.banned
                                                        ? 'text-green-600'
                                                        : 'text-destructive'
                                                }
                                            >
                                                {user.banned ? (
                                                    <>
                                                        <ShieldOff className="mr-2 h-4 w-4" />
                                                        Unban User
                                                    </>
                                                ) : (
                                                    <>
                                                        <Ban className="mr-2 h-4 w-4" />
                                                        Ban User
                                                    </>
                                                )}
                                            </DropdownMenuItem>
                                        </DropdownMenuContent>
                                    </DropdownMenu>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </div>

            {/* Pterodactyl Info Dialog */}
            <Dialog open={ptDialog.open} onOpenChange={(open) => !open && setPtDialog((p) => ({ ...p, open: false }))}>
                <DialogContent className="max-w-lg">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <Server className="h-5 w-5" />
                            Pterodactyl — {ptDialog.userName}
                        </DialogTitle>
                        <DialogDescription>
                            User details from the Pterodactyl API
                        </DialogDescription>
                    </DialogHeader>
                    {ptDialog.loading ? (
                        <div className="flex items-center justify-center py-8">
                            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                        </div>
                    ) : ptDialog.error ? (
                        <p className="py-4 text-center text-sm text-destructive">
                            {ptDialog.error}
                        </p>
                    ) : ptDialog.data ? (
                        <div className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-2 text-sm">
                            {(
                                [
                                    ['ID', ptDialog.data.id],
                                    ['UUID', ptDialog.data.uuid],
                                    ['External ID', ptDialog.data.externalId || '—'],
                                    ['Username', ptDialog.data.username],
                                    ['Email', ptDialog.data.email],
                                    ['First Name', ptDialog.data.firstName],
                                    ['Last Name', ptDialog.data.lastName],
                                    ['Language', ptDialog.data.language],
                                    ['Root Admin', ptDialog.data.rootAdmin ? 'Yes' : 'No'],
                                    ['2FA', ptDialog.data.twoFactor ? 'Enabled' : 'Disabled'],
                                    ['Created', new Date(ptDialog.data.createdAt).toLocaleString()],
                                    ['Updated', new Date(ptDialog.data.updatedAt).toLocaleString()],
                                ] as const
                            ).map(([label, value]) => (
                                <React.Fragment key={label}>
                                    <span className="text-muted-foreground">{label}</span>
                                    <span className="break-all font-mono text-xs">{value}</span>
                                </React.Fragment>
                            ))}
                        </div>
                    ) : null}
                </DialogContent>
            </Dialog>
        </>
    );
};

export default UsersTable;

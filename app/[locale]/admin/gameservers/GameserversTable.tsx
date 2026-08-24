'use client';

import { deleteGameServers } from '@/app/actions/gameservers/deleteGameServers';
import { Button } from '@/components/ui/button';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { formatDate } from '@/lib/formatDate';
import { GameServerStatus, GameServerType } from '@/app/client/generated/browser';
import React, { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { EditServerDialog } from './EditServerDialog';
import { AdminServerActionsMenu } from './AdminServerActionsMenu';
import { formatMBToGiB } from '@/lib/GlobalFunctions/ptResourceLogic';
import { GameServerAdmin } from '@/models/prisma';
import { getActiveSuspension, isSuspensionProcessing } from '@/lib/gameserver/suspension';
import { Ban, Trash2, Undo2 } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

const statusBadgeStyles: Record<GameServerStatus, string> = {
    CREATED: 'bg-gray-50 text-gray-700',
    ACTIVE: 'bg-green-50 text-green-700',
    EXPIRED: 'bg-orange-50 text-orange-700',
    DELETED: 'bg-red-50 text-red-700',
    CREATION_FAILED: 'bg-red-50 text-red-700',
};

interface GameserversTableProps {
    servers: GameServerAdmin[];
    currentPage: number;
    totalPages: number;
    totalCount: number;
    users: { id: string; email: string }[];
    locations: { id: number; name: string }[];
    serverOptions: { id: string; name: string; type: GameServerType }[];
    /** Prefilled reason for the suspend dialog, read from KeyValue by the page. */
    suspensionDefaultReason: string;
    filters: {
        userId?: string;
        serverId?: string;
        type?: GameServerType;
        locationId?: string;
        status?: GameServerStatus;
        suspended?: boolean;
    };
}

const ServersTable: React.FC<GameserversTableProps> = ({
    servers: gameservers,
    currentPage,
    totalPages,
    totalCount,
    users,
    locations,
    serverOptions,
    suspensionDefaultReason,
    filters,
}) => {
    const { toast } = useToast();
    const router = useRouter();
    const searchParams = useSearchParams();
    const [selectedIds, setSelectedIds] = useState<string[]>([]);
    const [editingServer, setEditingServer] = useState<GameServerAdmin | null>(null);

    const handleCheckboxChange = (id: string, checked: boolean) => {
        setSelectedIds((prev) =>
            checked ? [...prev, id] : prev.filter((selectedId) => selectedId !== id),
        );
    };

    const handleDelete = async () => {
        if (selectedIds.length === 0) return;
        const result = await deleteGameServers(selectedIds);
        setSelectedIds([]);

        toast({
            title: result.success ? 'Success' : 'Error',
            description: result.success ? 'Gameservers deleted successfully.' : result.error,
            variant: result.success ? 'default' : 'destructive',
        });

        if (result.success) {
            router.refresh();
        }
    };

    const updateFilter = (key: string, value: string) => {
        const params = new URLSearchParams(searchParams.toString());
        if (value && value !== 'all') {
            params.set(key, value);
        } else {
            params.delete(key);
        }
        // The server filter only makes sense together with its owner
        if (key === 'userId') params.delete('serverId');
        params.set('page', '1'); // Reset to first page on filter change
        router.push(`?${params.toString()}`);
    };

    const goToPage = (page: number) => {
        const params = new URLSearchParams(searchParams.toString());
        params.set('page', page.toString());
        router.push(`?${params.toString()}`);
    };

    return (
        <div className="space-y-4">
            {/* Filters */}
            <div className="grid grid-cols-1 md:grid-cols-3 xl:grid-cols-6 gap-4">
                <div>
                    <label className="text-sm font-medium mb-2 block">User</label>
                    <Select
                        value={filters.userId || 'all'}
                        onValueChange={(value) => updateFilter('userId', value)}
                    >
                        <SelectTrigger>
                            <SelectValue placeholder="All Users" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All Users</SelectItem>
                            {users.map((user) => (
                                <SelectItem key={user.id} value={user.id}>
                                    {user.email}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>

                <div>
                    <label className="text-sm font-medium mb-2 block">Server</label>
                    <Select
                        value={filters.serverId || 'all'}
                        onValueChange={(value) => updateFilter('serverId', value)}
                        disabled={serverOptions.length === 0}
                    >
                        <SelectTrigger>
                            <SelectValue placeholder="All Servers" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All Servers</SelectItem>
                            {serverOptions.map((server) => (
                                <SelectItem key={server.id} value={server.id}>
                                    <span
                                        className={
                                            server.type === 'FREE'
                                                ? 'font-medium text-emerald-600 dark:text-emerald-400'
                                                : undefined
                                        }
                                    >
                                        {server.name}
                                    </span>
                                    {server.type === 'FREE' && (
                                        <span className="ml-2 text-[10px] uppercase tracking-wide text-emerald-600 dark:text-emerald-400">
                                            Free
                                        </span>
                                    )}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>

                <div>
                    <label className="text-sm font-medium mb-2 block">Type</label>
                    <Select
                        value={filters.type || 'all'}
                        onValueChange={(value) => updateFilter('type', value)}
                    >
                        <SelectTrigger>
                            <SelectValue placeholder="All Types" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All Types</SelectItem>
                            <SelectItem value="FREE">Free</SelectItem>
                            <SelectItem value="CUSTOM">Paid/Custom</SelectItem>
                            <SelectItem value="PACKAGE">Package</SelectItem>
                        </SelectContent>
                    </Select>
                </div>

                <div>
                    <label className="text-sm font-medium mb-2 block">Location</label>
                    <Select
                        value={filters.locationId || 'all'}
                        onValueChange={(value) => updateFilter('locationId', value)}
                    >
                        <SelectTrigger>
                            <SelectValue placeholder="All Locations" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All Locations</SelectItem>
                            {locations.map((location) => (
                                <SelectItem key={location.id} value={location.id.toString()}>
                                    {location.name}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>

                <div>
                    <label className="text-sm font-medium mb-2 block">Status</label>
                    <Select
                        value={filters.status || 'all'}
                        onValueChange={(value) => updateFilter('status', value)}
                    >
                        <SelectTrigger>
                            <SelectValue placeholder="All Statuses" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All Statuses</SelectItem>
                            <SelectItem value="CREATED">Created</SelectItem>
                            <SelectItem value="ACTIVE">Active</SelectItem>
                            <SelectItem value="EXPIRED">Expired</SelectItem>
                            <SelectItem value="DELETED">Deleted</SelectItem>
                            <SelectItem value="CREATION_FAILED">Creation Failed</SelectItem>
                        </SelectContent>
                    </Select>
                </div>

                <div>
                    <label className="text-sm font-medium mb-2 block">Suspension</label>
                    <Select
                        value={filters.suspended ? 'true' : 'all'}
                        onValueChange={(value) => updateFilter('suspended', value)}
                    >
                        <SelectTrigger>
                            <SelectValue placeholder="All servers" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All servers</SelectItem>
                            <SelectItem value="true">Suspended only</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
            </div>

            {/* Actions and pagination info */}
            <div className="flex justify-between items-center">
                <Button
                    onClick={handleDelete}
                    disabled={selectedIds.length === 0}
                    variant="destructive"
                >
                    Delete Selected ({selectedIds.length})
                </Button>
                <div className="text-sm text-muted-foreground">
                    Showing {gameservers.length} of {totalCount} servers
                </div>
            </div>

            {/* Table */}
            <div className="rounded-md border overflow-x-auto">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead className="w-12">
                                <input
                                    type="checkbox"
                                    checked={
                                        selectedIds.length === gameservers.length &&
                                        gameservers.length > 0
                                    }
                                    onChange={(e) => {
                                        if (e.target.checked) {
                                            setSelectedIds(gameservers.map((gs) => gs.id));
                                        } else {
                                            setSelectedIds([]);
                                        }
                                    }}
                                />
                            </TableHead>
                            <TableHead>User</TableHead>
                            <TableHead>Name</TableHead>
                            <TableHead>Type</TableHead>
                            <TableHead>Price</TableHead>
                            <TableHead>CPU</TableHead>
                            <TableHead>RAM</TableHead>
                            <TableHead>Disk</TableHead>
                            <TableHead>Backups</TableHead>
                            <TableHead>Location</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead>Expires</TableHead>
                            <TableHead>PT ID</TableHead>
                            <TableHead className="w-20">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {gameservers.map((gameserver) => {
                            const suspension = getActiveSuspension(gameserver);
                            const showStatusBadge = !(gameserver.status === 'ACTIVE' && suspension);

                            return (
                                <TableRow key={gameserver.id}>
                                    <TableCell>
                                        <input
                                            type="checkbox"
                                            checked={selectedIds.includes(gameserver.id)}
                                            onChange={(e) =>
                                                handleCheckboxChange(
                                                    gameserver.id,
                                                    e.target.checked,
                                                )
                                            }
                                        />
                                    </TableCell>
                                    <TableCell className="max-w-50 truncate">
                                        {gameserver.user.email}
                                    </TableCell>
                                    <TableCell className="max-w-37.5 truncate">
                                        {gameserver.name}
                                    </TableCell>
                                    <TableCell>
                                        <span
                                            className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-medium ${
                                                gameserver.type === 'FREE'
                                                    ? 'bg-green-50 text-green-700'
                                                    : gameserver.type === 'PACKAGE'
                                                      ? 'bg-blue-50 text-blue-700'
                                                      : 'bg-purple-50 text-purple-700'
                                            }`}
                                        >
                                            {gameserver.type === 'FREE'
                                                ? 'Free'
                                                : gameserver.type === 'PACKAGE'
                                                  ? 'Package'
                                                  : 'Custom'}
                                        </span>
                                    </TableCell>
                                    <TableCell>
                                        {gameserver.type === 'FREE'
                                            ? 'Free'
                                            : gameserver.price != null
                                              ? `€${(gameserver.price / 100).toFixed(2)}`
                                              : 'N/A'}
                                    </TableCell>
                                    <TableCell>{gameserver.cpuPercent}%</TableCell>
                                    <TableCell>{formatMBToGiB(gameserver.ramMB, 2)}</TableCell>
                                    <TableCell>{formatMBToGiB(gameserver.diskMB, 2)}</TableCell>
                                    <TableCell>{gameserver.backupCount}</TableCell>
                                    <TableCell>{gameserver.location.name}</TableCell>
                                    <TableCell>
                                        {showStatusBadge && (
                                            <span
                                                className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-medium ${statusBadgeStyles[gameserver.status]}`}
                                            >
                                                {gameserver.status}
                                            </span>
                                        )}
                                        {suspension && (
                                            <TooltipProvider>
                                                <div className="mt-1 flex items-center gap-1 text-xs font-medium text-red-600 dark:text-red-400">
                                                    <Tooltip>
                                                        <TooltipTrigger asChild>
                                                            <Ban className="h-3.5 w-3.5 shrink-0" />
                                                        </TooltipTrigger>
                                                        <TooltipContent>
                                                            {suspension.reason}
                                                        </TooltipContent>
                                                    </Tooltip>
                                                    <span>
                                                        {formatDate(suspension.expiresAt, true)}
                                                    </span>
                                                    {isSuspensionProcessing(suspension) && (
                                                        <Tooltip>
                                                            <TooltipTrigger asChild>
                                                                <span className="text-amber-600 dark:text-amber-400">
                                                                    · pending
                                                                </span>
                                                            </TooltipTrigger>
                                                            <TooltipContent>
                                                                Expired — still counted as suspended
                                                                until the worker processes it (grace
                                                                window)
                                                            </TooltipContent>
                                                        </Tooltip>
                                                    )}
                                                    <Tooltip>
                                                        <TooltipTrigger asChild>
                                                            {suspension.deleteAfterExpiry ? (
                                                                <Trash2 className="h-3.5 w-3.5 shrink-0" />
                                                            ) : (
                                                                <Undo2 className="h-3.5 w-3.5 shrink-0" />
                                                            )}
                                                        </TooltipTrigger>
                                                        <TooltipContent>
                                                            {suspension.deleteAfterExpiry
                                                                ? 'Server will be deleted after expiry'
                                                                : 'Suspension will be lifted after expiry'}
                                                        </TooltipContent>
                                                    </Tooltip>
                                                </div>
                                            </TooltipProvider>
                                        )}
                                    </TableCell>
                                    <TableCell className="whitespace-nowrap">
                                        {formatDate(gameserver.expires)}
                                    </TableCell>
                                    <TableCell>{gameserver.ptServerId || 'N/A'}</TableCell>
                                    <TableCell>
                                        <AdminServerActionsMenu
                                            server={gameserver}
                                            suspensionDefaultReason={suspensionDefaultReason}
                                            onEdit={() => setEditingServer(gameserver)}
                                            onSuccess={() => router.refresh()}
                                        />
                                    </TableCell>
                                </TableRow>
                            );
                        })}
                    </TableBody>
                </Table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
                <div className="flex items-center justify-center gap-2">
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => goToPage(currentPage - 1)}
                        disabled={currentPage <= 1}
                    >
                        Previous
                    </Button>
                    <div className="flex items-center gap-1">
                        {Array.from({ length: Math.min(7, totalPages) }, (_, i) => {
                            let pageNum;
                            if (totalPages <= 7) {
                                pageNum = i + 1;
                            } else if (currentPage <= 4) {
                                pageNum = i + 1;
                            } else if (currentPage >= totalPages - 3) {
                                pageNum = totalPages - 6 + i;
                            } else {
                                pageNum = currentPage - 3 + i;
                            }

                            return (
                                <Button
                                    key={pageNum}
                                    variant={currentPage === pageNum ? 'default' : 'outline'}
                                    size="sm"
                                    onClick={() => goToPage(pageNum)}
                                >
                                    {pageNum}
                                </Button>
                            );
                        })}
                    </div>
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => goToPage(currentPage + 1)}
                        disabled={currentPage >= totalPages}
                    >
                        Next
                    </Button>
                </div>
            )}

            {/* Edit Dialog */}
            {editingServer && (
                <EditServerDialog
                    server={editingServer}
                    open={!!editingServer}
                    onOpenChange={(open) => !open && setEditingServer(null)}
                    onSuccess={() => router.refresh()}
                />
            )}
        </div>
    );
};

export default ServersTable;

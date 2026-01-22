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
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { formatDate } from '@/lib/formatDate';
import { GameServerStatus, GameServerType } from '@/app/client/generated/browser';
import React, { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { EditServerDialog } from './EditServerDialog';
import { Pencil } from 'lucide-react';

interface GameServerWithRelations {
    id: string;
    userId: string;
    ramMB: number;
    cpuPercent: number;
    diskMB: number;
    backupCount: number;
    expires: Date;
    price: number;
    type: GameServerType;
    ptServerId: string | null;
    ptAdminId: number | null;
    name: string;
    status: GameServerStatus;
    createdAt: Date;
    user: { id: string; email: string };
    location: { id: number; name: string };
}

interface GameserversTableProps {
    servers: GameServerWithRelations[];
    currentPage: number;
    totalPages: number;
    totalCount: number;
    users: { id: string; email: string }[];
    locations: { id: number; name: string }[];
    filters: {
        userId?: string;
        type?: GameServerType;
        locationId?: string;
        status?: GameServerStatus;
    };
}

const ServersTable: React.FC<GameserversTableProps> = ({
    servers: gameservers,
    currentPage,
    totalPages,
    totalCount,
    users,
    locations,
    filters,
}) => {
    const { toast } = useToast();
    const router = useRouter();
    const searchParams = useSearchParams();
    const [selectedIds, setSelectedIds] = useState<string[]>([]);
    const [editingServer, setEditingServer] = useState<GameServerWithRelations | null>(null);

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
            description: result.success ? 'Game servers deleted successfully.' : result.error,
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
        params.set('page', '1'); // Reset to first page on filter change
        router.push(`?${params.toString()}`);
    };

    const goToPage = (page: number) => {
        const params = new URLSearchParams(searchParams.toString());
        params.set('page', page.toString());
        router.push(`?${params.toString()}`);
    };

    const formatBytes = (mb: number, toUnit: 'GB' | 'MB' = 'GB') => {
        if (toUnit === 'GB') {
            return `${(mb / 1024).toFixed(2)} GB`;
        }
        return `${mb} MB`;
    };

    return (
        <div className="space-y-4">
            {/* Filters */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
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
                        {gameservers.map((gameserver) => (
                            <TableRow key={gameserver.id}>
                                <TableCell>
                                    <input
                                        type="checkbox"
                                        checked={selectedIds.includes(gameserver.id)}
                                        onChange={(e) =>
                                            handleCheckboxChange(gameserver.id, e.target.checked)
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
                                <TableCell>{formatBytes(gameserver.ramMB)}</TableCell>
                                <TableCell>{formatBytes(gameserver.diskMB)}</TableCell>
                                <TableCell>{gameserver.backupCount}</TableCell>
                                <TableCell>{gameserver.location.name}</TableCell>
                                <TableCell>
                                    <span
                                        className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-medium ${
                                            gameserver.status === 'ACTIVE'
                                                ? 'bg-green-50 text-green-700'
                                                : gameserver.status === 'EXPIRED'
                                                  ? 'bg-orange-50 text-orange-700'
                                                  : gameserver.status === 'DELETED'
                                                    ? 'bg-red-50 text-red-700'
                                                    : gameserver.status === 'CREATION_FAILED'
                                                      ? 'bg-red-50 text-red-700'
                                                      : 'bg-gray-50 text-gray-700'
                                        }`}
                                    >
                                        {gameserver.status}
                                    </span>
                                </TableCell>
                                <TableCell className="whitespace-nowrap">
                                    {formatDate(gameserver.expires)}
                                </TableCell>
                                <TableCell>{gameserver.ptServerId || 'N/A'}</TableCell>
                                <TableCell>
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => setEditingServer(gameserver)}
                                    >
                                        <Pencil className="h-4 w-4" />
                                    </Button>
                                </TableCell>
                            </TableRow>
                        ))}
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

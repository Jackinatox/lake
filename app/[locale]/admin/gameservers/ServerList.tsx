'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowDown, ArrowUp, ChevronLeft, ChevronRight, Loader2, Trash2, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { deleteGameServers } from '@/app/actions/gameservers/deleteGameServers';
import { cn } from '@/lib/utils';
import { GameServerAdminRow } from '@/models/prisma';
import { EditServerDialog } from './EditServerDialog';
import ServerRow from './ServerRow';
import type { SortKey, SortState } from './types';
import { useServerParams } from './useServerParams';

type ServerListProps = {
    servers: GameServerAdminRow[];
    /** Error/fatal log entries per server id in the last 24 h — drives the red row badge. */
    errorCounts: Record<string, number>;
    totalCount: number;
    page: number;
    limit: number;
    pageSizes: number[];
    sortState: SortState;
    suspensionDefaultReason: string;
};

const COLUMNS: { key: SortKey | null; label: string; className: string }[] = [
    { key: 'name', label: 'Server', className: 'min-w-0 flex-1' },
    { key: null, label: 'Owner', className: 'hidden w-36 shrink-0 md:block' },
    { key: null, label: 'Game', className: 'hidden w-20 shrink-0 xl:block' },
    { key: null, label: 'Loc', className: 'hidden w-16 shrink-0 xl:block' },
    { key: 'ram', label: 'CPU · RAM · Disk', className: 'hidden w-32 shrink-0 truncate lg:block' },
    { key: null, label: 'Backups · Ports', className: 'hidden w-28 shrink-0 truncate lg:block' },
    { key: 'price', label: 'Price', className: 'w-14 shrink-0 text-right' },
    { key: 'created', label: 'Booked', className: 'w-20 shrink-0 text-right' },
    { key: 'expires', label: 'Expires', className: 'w-16 shrink-0 text-right' },
    { key: null, label: 'PT ID', className: 'hidden w-20 shrink-0 md:block' },
    { key: null, label: '', className: 'w-12 shrink-0' },
    { key: null, label: '', className: 'w-6 shrink-0' },
];

export default function ServerList({
    servers,
    errorCounts,
    totalCount,
    page,
    limit,
    pageSizes,
    sortState,
    suspensionDefaultReason,
}: ServerListProps) {
    const { toast } = useToast();
    const router = useRouter();
    const { setParams, pending } = useServerParams();

    const [selectedIds, setSelectedIds] = useState<string[]>([]);
    const [editingServer, setEditingServer] = useState<GameServerAdminRow | null>(null);
    const [confirmDelete, setConfirmDelete] = useState(false);
    const [deleting, setDeleting] = useState(false);

    const totalPages = Math.max(1, Math.ceil(totalCount / limit));
    const selectedOnPage = useMemo(
        () => servers.filter((server) => selectedIds.includes(server.id)),
        [servers, selectedIds],
    );
    const allSelected = servers.length > 0 && selectedOnPage.length === servers.length;

    const toggleSort = (key: SortKey) => {
        const dir = sortState.sort === key && sortState.dir === 'desc' ? 'asc' : 'desc';
        setParams({ sort: key, dir }, { keepPage: true });
    };

    const handleDelete = async () => {
        setDeleting(true);
        const result = await deleteGameServers(selectedIds);
        setDeleting(false);
        setConfirmDelete(false);

        toast({
            title: result.success ? 'Servers deleted' : 'Error',
            description: result.success
                ? `${selectedIds.length} server(s) removed from Pterodactyl and marked as deleted.`
                : result.error,
            variant: result.success ? 'default' : 'destructive',
        });

        if (result.success) {
            setSelectedIds([]);
            router.refresh();
        }
    };

    return (
        <div className="space-y-2">
            {/* Toolbar: selection actions on the left, result count and page size on the right */}
            <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                    {selectedIds.length > 0 ? (
                        <>
                            <span className="text-xs font-medium">
                                {selectedIds.length} selected
                            </span>
                            <Button
                                variant="destructive"
                                size="sm"
                                className="h-7 text-xs"
                                onClick={() => setConfirmDelete(true)}
                            >
                                <Trash2 className="h-3.5 w-3.5" />
                                Delete
                            </Button>
                            <Button
                                variant="ghost"
                                size="sm"
                                className="h-7 text-xs"
                                onClick={() => setSelectedIds([])}
                            >
                                <X className="h-3.5 w-3.5" />
                                Clear
                            </Button>
                        </>
                    ) : (
                        <span className="text-xs text-muted-foreground">
                            Select rows for bulk actions · click a row for details
                        </span>
                    )}
                </div>

                <div className="flex items-center gap-2">
                    {pending && (
                        <Loader2 className="h-3.5 w-3.5 animate-spin text-muted-foreground" />
                    )}
                    <span className="text-xs text-muted-foreground">
                        {servers.length} of {totalCount} servers
                    </span>
                    <Select
                        value={String(limit)}
                        onValueChange={(value) => setParams({ limit: value })}
                    >
                        <SelectTrigger className="h-7 w-20 text-xs">
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            {pageSizes.map((size) => (
                                <SelectItem key={size} value={String(size)} className="text-xs">
                                    {size} / page
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
            </div>

            <div
                className={cn(
                    'overflow-hidden rounded-md border transition-opacity',
                    pending && 'opacity-60',
                )}
            >
                {/* Column header — mirrors the columns of ServerRow */}
                <div className="sticky top-0 z-10 flex h-7 items-center gap-2 border-b border-l-2 border-l-transparent bg-muted/80 px-1.5 text-[11px] font-medium uppercase tracking-wide text-muted-foreground backdrop-blur md:gap-3">
                    <input
                        type="checkbox"
                        checked={allSelected}
                        onChange={(event) =>
                            setSelectedIds(
                                event.target.checked ? servers.map((server) => server.id) : [],
                            )
                        }
                        className="h-3 w-3 shrink-0"
                        aria-label="Select all rows on this page"
                    />
                    <span className="w-3 shrink-0" />
                    <span className="w-2 shrink-0" />
                    {COLUMNS.map((column) => (
                        <span key={column.label || column.className} className={column.className}>
                            {column.key ? (
                                <button
                                    type="button"
                                    onClick={() => toggleSort(column.key!)}
                                    className={cn(
                                        'inline-flex items-center gap-1 uppercase hover:text-foreground',
                                        sortState.sort === column.key && 'text-foreground',
                                    )}
                                >
                                    {column.label}
                                    {sortState.sort === column.key &&
                                        (sortState.dir === 'asc' ? (
                                            <ArrowUp className="h-3 w-3" />
                                        ) : (
                                            <ArrowDown className="h-3 w-3" />
                                        ))}
                                </button>
                            ) : (
                                column.label
                            )}
                        </span>
                    ))}
                </div>

                {servers.length === 0 ? (
                    <p className="p-8 text-center text-sm text-muted-foreground">
                        No servers match these filters.
                    </p>
                ) : (
                    servers.map((server) => (
                        <ServerRow
                            key={server.id}
                            server={server}
                            errorCount={errorCounts[server.id] ?? 0}
                            selected={selectedIds.includes(server.id)}
                            onSelect={(checked) =>
                                setSelectedIds((previous) =>
                                    checked
                                        ? [...previous, server.id]
                                        : previous.filter((id) => id !== server.id),
                                )
                            }
                            onFilterUser={(userId) => setParams({ userId, serverId: undefined })}
                            onEdit={() => setEditingServer(server)}
                            onChanged={() => router.refresh()}
                            suspensionDefaultReason={suspensionDefaultReason}
                        />
                    ))
                )}
            </div>

            {totalPages > 1 && (
                <div className="flex items-center justify-center gap-2">
                    <Button
                        variant="outline"
                        size="sm"
                        className="h-7 text-xs"
                        onClick={() => setParams({ page: page - 1 }, { keepPage: true })}
                        disabled={page <= 1}
                    >
                        <ChevronLeft className="h-3.5 w-3.5" />
                        Prev
                    </Button>
                    <span className="text-xs text-muted-foreground">
                        Page {page} of {totalPages}
                    </span>
                    <Button
                        variant="outline"
                        size="sm"
                        className="h-7 text-xs"
                        onClick={() => setParams({ page: page + 1 }, { keepPage: true })}
                        disabled={page >= totalPages}
                    >
                        Next
                        <ChevronRight className="h-3.5 w-3.5" />
                    </Button>
                </div>
            )}

            <AlertDialog open={confirmDelete} onOpenChange={setConfirmDelete}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>
                            Delete {selectedIds.length} server
                            {selectedIds.length === 1 ? '' : 's'}?
                        </AlertDialogTitle>
                        <AlertDialogDescription>
                            They are removed from Pterodactyl and marked as deleted in the database.
                            This cannot be undone.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <div className="max-h-40 overflow-auto rounded border bg-muted/40 p-2 text-xs">
                        {selectedOnPage.map((server) => (
                            <div key={server.id} className="truncate">
                                {server.name}{' '}
                                <span className="text-muted-foreground">({server.user.email})</span>
                            </div>
                        ))}
                        {selectedIds.length > selectedOnPage.length && (
                            <div className="text-muted-foreground">
                                + {selectedIds.length - selectedOnPage.length} on other pages
                            </div>
                        )}
                    </div>
                    <AlertDialogFooter>
                        <AlertDialogCancel disabled={deleting}>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={handleDelete}
                            disabled={deleting}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        >
                            {deleting ? 'Deleting…' : 'Delete'}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

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
}

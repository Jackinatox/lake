'use client';

import { deleteGameServers } from '@/app/actions/gameservers/deleteGameServers';
import {
    expireGameServer,
    hardDeleteGameServer,
} from '@/app/actions/gameservers/adminServerActions';
import { Button } from '@/components/ui/button';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
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
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Checkbox } from '@/components/ui/checkbox';
import { useToast } from '@/hooks/use-toast';
import { MoreHorizontal, Pencil, Clock, Trash2, DatabaseBackup } from 'lucide-react';
import { useState } from 'react';
import { Label } from '@/components/ui/label';

interface Server {
    id: string;
    name: string;
}

interface AdminServerActionsMenuProps {
    server: Server;
    onEdit: () => void;
    onSuccess: () => void;
}

type DialogState = 'none' | 'expire' | 'delete' | 'hardDelete';

export function AdminServerActionsMenu({ server, onEdit, onSuccess }: AdminServerActionsMenuProps) {
    const { toast } = useToast();
    const [dialog, setDialog] = useState<DialogState>('none');
    const [deleteOrders, setDeleteOrders] = useState(false);
    const [loading, setLoading] = useState(false);

    const handleExpire = async () => {
        setLoading(true);
        const result = await expireGameServer(server.id);
        setLoading(false);
        setDialog('none');
        toast({
            title: result.success ? 'Server expired' : 'Error',
            description: result.success
                ? `"${server.name}" has been suspended and marked as expired.`
                : result.error,
            variant: result.success ? 'default' : 'destructive',
        });
        if (result.success) onSuccess();
    };

    const handleDelete = async () => {
        setLoading(true);
        const result = await deleteGameServers([server.id]);
        setLoading(false);
        setDialog('none');
        toast({
            title: result.success ? 'Server deleted' : 'Error',
            description: result.success
                ? `"${server.name}" has been removed from Pterodactyl and marked as deleted.`
                : result.error,
            variant: result.success ? 'default' : 'destructive',
        });
        if (result.success) onSuccess();
    };

    const handleHardDelete = async () => {
        setLoading(true);
        const result = await hardDeleteGameServer(server.id, deleteOrders);
        setLoading(false);
        setDialog('none');
        setDeleteOrders(false);
        toast({
            title: result.success ? 'Server permanently deleted' : 'Error',
            description: result.success
                ? `"${server.name}" has been permanently removed${deleteOrders ? ' along with all associated orders' : ''}.`
                : result.error,
            variant: result.success ? 'default' : 'destructive',
        });
        if (result.success) onSuccess();
    };

    return (
        <>
            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm">
                        <MoreHorizontal className="h-4 w-4" />
                    </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={onEdit}>
                        <Pencil className="mr-2 h-4 w-4" />
                        Edit
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={() => setDialog('expire')}>
                        <Clock className="mr-2 h-4 w-4" />
                        Expire Server
                    </DropdownMenuItem>
                    <DropdownMenuItem
                        className="text-destructive focus:text-destructive"
                        onClick={() => setDialog('delete')}
                    >
                        <Trash2 className="mr-2 h-4 w-4" />
                        Delete Server
                    </DropdownMenuItem>
                    <DropdownMenuItem
                        className="text-destructive focus:text-destructive"
                        onClick={() => setDialog('hardDelete')}
                    >
                        <DatabaseBackup className="mr-2 h-4 w-4" />
                        Delete from Database
                    </DropdownMenuItem>
                </DropdownMenuContent>
            </DropdownMenu>

            {/* Expire confirmation */}
            <AlertDialog open={dialog === 'expire'} onOpenChange={(o) => !o && setDialog('none')}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Expire Server</AlertDialogTitle>
                        <AlertDialogDescription>
                            This will suspend <strong>{server.name}</strong> in Pterodactyl and set
                            its status to <em>Expired</em>. The record will remain in the database.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel disabled={loading}>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={handleExpire} disabled={loading}>
                            Expire
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            {/* Delete (soft) confirmation */}
            <AlertDialog open={dialog === 'delete'} onOpenChange={(o) => !o && setDialog('none')}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Delete Server</AlertDialogTitle>
                        <AlertDialogDescription>
                            This will delete <strong>{server.name}</strong> from Pterodactyl and
                            mark it as <em>Deleted</em> in the database. This action cannot be
                            undone.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel disabled={loading}>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={handleDelete}
                            disabled={loading}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        >
                            Delete
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            {/* Hard delete dialog */}
            <Dialog
                open={dialog === 'hardDelete'}
                onOpenChange={(o) => {
                    if (!o) {
                        setDialog('none');
                        setDeleteOrders(false);
                    }
                }}
            >
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Permanently Delete from Database</DialogTitle>
                        <DialogDescription>
                            This will delete <strong>{server.name}</strong> from Pterodactyl and
                            permanently remove it from the database. This action cannot be undone.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="flex items-center gap-2 py-2">
                        <Checkbox
                            id="delete-orders"
                            checked={deleteOrders}
                            onCheckedChange={(v) => setDeleteOrders(!!v)}
                        />
                        <Label htmlFor="delete-orders">Also delete all associated orders</Label>
                    </div>
                    <DialogFooter>
                        <Button
                            variant="outline"
                            onClick={() => {
                                setDialog('none');
                                setDeleteOrders(false);
                            }}
                            disabled={loading}
                        >
                            Cancel
                        </Button>
                        <Button variant="destructive" onClick={handleHardDelete} disabled={loading}>
                            Permanently Delete
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    );
}

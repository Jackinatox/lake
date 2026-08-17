'use client';

import {
    extendGameServerSuspension,
    getSuspensionHistory,
    liftGameServerSuspension,
    suspendGameServer,
    type SuspensionHistoryEntry,
} from '@/app/actions/gameservers/suspensionActions';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { SUSPENSION_REASON_MIN_LENGTH } from '@/lib/validation/suspension';
import { AlertTriangle } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';

interface SuspensionTarget {
    id: string;
    name: string;
    suspension: {
        id: string;
        reason: string;
        expiresAt: Date;
        deleteAfterExpiry: boolean;
    } | null;
}

/** `<input type="datetime-local">` wants a local-time `YYYY-MM-DDTHH:mm`, not an ISO string. */
function toDatetimeLocal(date: Date) {
    const offset = date.getTimezoneOffset() * 60_000;
    return new Date(date.getTime() - offset).toISOString().slice(0, 16);
}

function daysFromNow(days: number) {
    return toDatetimeLocal(new Date(Date.now() + days * 24 * 60 * 60 * 1000));
}

function DatePresets({ onPick }: { onPick: (value: string) => void }) {
    return (
        <div className="flex gap-2">
            {[7, 14, 30].map((days) => (
                <Button
                    key={days}
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => onPick(daysFromNow(days))}
                >
                    +{days}d
                </Button>
            ))}
        </div>
    );
}

function HistoryList({ gameServerId }: { gameServerId: string }) {
    const [entries, setEntries] = useState<SuspensionHistoryEntry[] | null>(null);

    useEffect(() => {
        let active = true;
        getSuspensionHistory(gameServerId)
            .then((result) => active && setEntries(result))
            .catch(() => active && setEntries([]));
        return () => {
            active = false;
        };
    }, [gameServerId]);

    if (entries === null) return <p className="text-xs text-muted-foreground">Loading history…</p>;
    if (entries.length === 0)
        return <p className="text-xs text-muted-foreground">No history recorded.</p>;

    return (
        <div className="max-h-40 space-y-2 overflow-y-auto rounded-md border p-2">
            {entries.map((entry) => {
                const note = typeof entry.details.note === 'string' ? entry.details.note : null;
                const to = entry.details.to ? new Date(entry.details.to as string) : null;
                return (
                    <div key={entry.id} className="text-xs">
                        <span className="font-medium">
                            {entry.event.replace('SUSPENSION_', '').toLowerCase()}
                        </span>{' '}
                        <span className="text-muted-foreground">
                            {new Date(entry.createdAt).toLocaleString()}
                            {entry.adminName ? ` · ${entry.adminName}` : ''}
                            {to ? ` · until ${to.toLocaleString()}` : ''}
                        </span>
                        {note && <div className="text-muted-foreground italic">“{note}”</div>}
                    </div>
                );
            })}
        </div>
    );
}

export function SuspendDialog({
    server,
    open,
    onOpenChange,
    onSuccess,
}: {
    server: SuspensionTarget;
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onSuccess: () => void;
}) {
    const { toast } = useToast();
    const [reason, setReason] = useState('');
    const [expiresAt, setExpiresAt] = useState(() => daysFromNow(7));
    const [deleteAfterExpiry, setDeleteAfterExpiry] = useState(true);
    const [loading, setLoading] = useState(false);

    const reset = useCallback(() => {
        setReason('');
        setExpiresAt(daysFromNow(7));
        setDeleteAfterExpiry(true);
    }, []);

    const handleSubmit = async () => {
        setLoading(true);
        const result = await suspendGameServer({
            gameServerId: server.id,
            type: 'QUARANTINE',
            reason,
            expiresAt,
            deleteAfterExpiry,
        });
        setLoading(false);

        toast({
            title: result.success ? 'Server suspended' : 'Error',
            description: result.success
                ? `"${server.name}" is suspended in Pterodactyl and the user has been emailed.`
                : result.error,
            variant: result.success ? 'default' : 'destructive',
        });

        if (result.success) {
            reset();
            onOpenChange(false);
            onSuccess();
        }
    };

    return (
        <Dialog
            open={open}
            onOpenChange={(next) => {
                if (!next) reset();
                onOpenChange(next);
            }}
        >
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Suspend Server</DialogTitle>
                    <DialogDescription>
                        Suspends <strong>{server.name}</strong> in Pterodactyl so it can no longer
                        be accessed, and blocks its dashboard. Files stay on disk.
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-4 py-2">
                    <div className="space-y-2">
                        <Label htmlFor="suspension-type">Type</Label>
                        <Select value="QUARANTINE" disabled>
                            <SelectTrigger id="suspension-type">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="QUARANTINE">Quarantine</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="suspension-reason">
                            Reason — this is sent to the user verbatim
                        </Label>
                        <Textarea
                            id="suspension-reason"
                            value={reason}
                            onChange={(e) => setReason(e.target.value)}
                            placeholder="Explain what the user did and what we expect from them."
                            rows={4}
                        />
                        <p className="text-xs text-muted-foreground">
                            At least {SUSPENSION_REASON_MIN_LENGTH} characters.
                        </p>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="suspension-expires">Suspended until</Label>
                        <Input
                            id="suspension-expires"
                            type="datetime-local"
                            value={expiresAt}
                            onChange={(e) => setExpiresAt(e.target.value)}
                        />
                        <DatePresets onPick={setExpiresAt} />
                    </div>

                    <div className="flex items-start gap-2">
                        <Checkbox
                            id="suspension-delete"
                            checked={deleteAfterExpiry}
                            onCheckedChange={(v) => setDeleteAfterExpiry(!!v)}
                        />
                        <Label htmlFor="suspension-delete" className="font-normal leading-snug">
                            Delete the server and all of its data when the suspension runs out.
                            Unchecked, it is released again instead.
                        </Label>
                    </div>

                    <div className="flex items-start gap-2 rounded-md border border-amber-500/40 bg-amber-500/10 p-2 text-xs">
                        <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" />
                        <span>
                            The user <strong>will</strong> be emailed the reason, the end date and —
                            if enabled — the deletion warning.
                        </span>
                    </div>
                </div>

                <DialogFooter>
                    <Button
                        variant="outline"
                        onClick={() => onOpenChange(false)}
                        disabled={loading}
                    >
                        Cancel
                    </Button>
                    <Button variant="destructive" onClick={handleSubmit} disabled={loading}>
                        Suspend
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}

export function ExtendSuspensionDialog({
    server,
    open,
    onOpenChange,
    onSuccess,
}: {
    server: SuspensionTarget;
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onSuccess: () => void;
}) {
    const { toast } = useToast();
    const suspension = server.suspension;
    const [expiresAt, setExpiresAt] = useState('');
    const [note, setNote] = useState('');
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (open && suspension) {
            setExpiresAt(toDatetimeLocal(new Date(suspension.expiresAt)));
            setNote('');
        }
    }, [open, suspension]);

    if (!suspension) return null;

    const handleSubmit = async () => {
        setLoading(true);
        const result = await extendGameServerSuspension({
            suspensionId: suspension.id,
            expiresAt,
            note: note || undefined,
        });
        setLoading(false);

        toast({
            title: result.success ? 'Suspension extended' : 'Error',
            description: result.success
                ? `The suspension of "${server.name}" now runs longer. No email was sent.`
                : result.error,
            variant: result.success ? 'default' : 'destructive',
        });

        if (result.success) {
            onOpenChange(false);
            onSuccess();
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Extend Suspension</DialogTitle>
                    <DialogDescription>
                        <strong>{server.name}</strong> is currently suspended until{' '}
                        {new Date(suspension.expiresAt).toLocaleString()}.
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-4 py-2">
                    <div className="space-y-2">
                        <Label htmlFor="extend-expires">New end date</Label>
                        <Input
                            id="extend-expires"
                            type="datetime-local"
                            value={expiresAt}
                            onChange={(e) => setExpiresAt(e.target.value)}
                        />
                        <DatePresets onPick={setExpiresAt} />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="extend-note">Internal note (optional)</Label>
                        <Input
                            id="extend-note"
                            value={note}
                            onChange={(e) => setNote(e.target.value)}
                            placeholder="Why is this being extended?"
                        />
                    </div>

                    <div className="flex items-start gap-2 rounded-md border border-amber-500/40 bg-amber-500/10 p-2 text-xs">
                        <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" />
                        <span>
                            The user will <strong>NOT</strong> be notified about this extension. It
                            is recorded below so other admins can see it later.
                        </span>
                    </div>

                    <div className="space-y-2">
                        <Label>History</Label>
                        <HistoryList gameServerId={server.id} />
                    </div>
                </div>

                <DialogFooter>
                    <Button
                        variant="outline"
                        onClick={() => onOpenChange(false)}
                        disabled={loading}
                    >
                        Cancel
                    </Button>
                    <Button onClick={handleSubmit} disabled={loading}>
                        Extend
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}

export function LiftSuspensionDialog({
    server,
    open,
    onOpenChange,
    onSuccess,
}: {
    server: SuspensionTarget;
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onSuccess: () => void;
}) {
    const { toast } = useToast();
    const suspension = server.suspension;
    const [loading, setLoading] = useState(false);

    if (!suspension) return null;

    const handleSubmit = async () => {
        setLoading(true);
        const result = await liftGameServerSuspension({ suspensionId: suspension.id });
        setLoading(false);

        toast({
            title: result.success ? 'Server unsuspended' : 'Error',
            description: result.success
                ? `"${server.name}" has been released and the user has been emailed.`
                : result.error,
            variant: result.success ? 'default' : 'destructive',
        });

        if (result.success) {
            onOpenChange(false);
            onSuccess();
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Unsuspend Server</DialogTitle>
                    <DialogDescription>
                        Releases <strong>{server.name}</strong> and makes its dashboard reachable
                        again.
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-4 py-2">
                    <div className="flex items-start gap-2 rounded-md border border-amber-500/40 bg-amber-500/10 p-2 text-xs">
                        <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" />
                        <span>
                            The user <strong>will</strong> be emailed that their server is available
                            again. If the server is also expired it stays suspended in Pterodactyl
                            for that reason, and the email says so.
                        </span>
                    </div>

                    <div className="space-y-2">
                        <Label>History</Label>
                        <HistoryList gameServerId={server.id} />
                    </div>
                </div>

                <DialogFooter>
                    <Button
                        variant="outline"
                        onClick={() => onOpenChange(false)}
                        disabled={loading}
                    >
                        Cancel
                    </Button>
                    <Button onClick={handleSubmit} disabled={loading}>
                        Unsuspend
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}

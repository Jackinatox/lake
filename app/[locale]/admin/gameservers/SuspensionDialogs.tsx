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
import { useEffect, useState } from 'react';

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

const HOUR_MS = 60 * 60 * 1000;
const DAY_MS = 24 * HOUR_MS;

const DEFAULT_SUSPENSION_DAYS = 14;

function daysFromNow(days: number) {
    return toDatetimeLocal(new Date(Date.now() + days * DAY_MS));
}

/** Adds days on top of what is currently in the input; falls back to now when it is empty/invalid. */
function addDays(value: string, days: number) {
    const base = new Date(value);
    if (!value || Number.isNaN(base.getTime())) return daysFromNow(days);
    return toDatetimeLocal(new Date(base.getTime() + days * DAY_MS));
}

/** "7 days", "3 days 5 hours", … between now and the entered end date. */
function durationFromNow(value: string) {
    const end = new Date(value);
    if (!value || Number.isNaN(end.getTime())) return null;

    const hoursTotal = Math.round((end.getTime() - Date.now()) / HOUR_MS);
    if (hoursTotal <= 0) return 'in the past';

    const days = Math.floor(hoursTotal / 24);
    const hours = hoursTotal % 24;
    const parts: string[] = [];
    if (days > 0) parts.push(`${days} ${days === 1 ? 'day' : 'days'}`);
    if (hours > 0) parts.push(`${hours} ${hours === 1 ? 'hour' : 'hours'}`);
    return parts.join(' ');
}

function DatePresets({ onAdd }: { onAdd: (days: number) => void }) {
    return (
        <div className="flex gap-2">
            {[7, 14, 30].map((days) => (
                <Button
                    key={days}
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => onAdd(days)}
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
    defaultReason,
    open,
    onOpenChange,
    onSuccess,
}: {
    server: SuspensionTarget;
    defaultReason: string;
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onSuccess: () => void;
}) {
    const { toast } = useToast();
    const [reason, setReason] = useState(defaultReason);
    const [expiresAt, setExpiresAt] = useState(() => daysFromNow(DEFAULT_SUSPENSION_DAYS));
    const [deleteAfterExpiry, setDeleteAfterExpiry] = useState(true);
    const [loading, setLoading] = useState(false);
    const suspendedFor = durationFromNow(expiresAt);

    // The dialog stays mounted while closed, so the defaults have to be restored every time it
    // is opened — that also keeps the end date 14 days from *now* rather than from page load.
    useEffect(() => {
        if (!open) return;
        setReason(defaultReason);
        setExpiresAt(daysFromNow(DEFAULT_SUSPENSION_DAYS));
        setDeleteAfterExpiry(true);
    }, [open, defaultReason]);

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
            onOpenChange(false);
            onSuccess();
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
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
                        <Label htmlFor="suspension-type">Type (Not yet needed)</Label>
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
                            At least {SUSPENSION_REASON_MIN_LENGTH} characters. The prefilled text
                            is the <code>suspension_default_reason</code> entry on the KeyValue
                            page.
                        </p>
                    </div>

                    <div className="space-y-2">
                        <div className="flex items-center justify-between gap-2">
                            <Label htmlFor="suspension-expires">Suspended until</Label>
                            <span className="text-xs text-muted-foreground">
                                {suspendedFor === null
                                    ? 'Pick a valid end date.'
                                    : suspendedFor === 'in the past'
                                      ? 'That end date is in the past.'
                                      : `for ${suspendedFor}`}
                            </span>
                        </div>
                        <Input
                            id="suspension-expires"
                            type="datetime-local"
                            value={expiresAt}
                            onChange={(e) => setExpiresAt(e.target.value)}
                        />
                        <DatePresets
                            onAdd={(days) => setExpiresAt((current) => addDays(current, days))}
                        />
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

    // `suspension` is rebuilt by the parent on every render, so this deliberately depends on the
    // end date's value only — depending on the object wiped what was typed on every re-render.
    const suspendedUntil = suspension ? new Date(suspension.expiresAt).getTime() : null;

    useEffect(() => {
        if (!open || suspendedUntil === null) return;
        setExpiresAt(toDatetimeLocal(new Date(suspendedUntil)));
        setNote('');
    }, [open, suspendedUntil]);

    if (!suspension) return null;

    const remaining = durationFromNow(expiresAt);

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
                        <div className="flex items-center justify-between gap-2">
                            <Label htmlFor="extend-expires">New end date</Label>
                            <span className="text-xs text-muted-foreground">
                                {remaining === null
                                    ? 'Pick a valid end date.'
                                    : remaining === 'in the past'
                                      ? 'That end date is in the past.'
                                      : `for another ${remaining}`}
                            </span>
                        </div>
                        <Input
                            id="extend-expires"
                            type="datetime-local"
                            value={expiresAt}
                            onChange={(e) => setExpiresAt(e.target.value)}
                        />
                        <DatePresets
                            onAdd={(days) => setExpiresAt((current) => addDays(current, days))}
                        />
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

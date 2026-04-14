'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Plus, Trash2, Loader2, Copy, Check, KeyRound } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
    DialogDescription,
} from '@/components/ui/dialog';
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
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { useToast } from '@/hooks/use-toast';
import { createApiKeyAction, deleteApiKeyAction } from '@/app/actions/apiKeys/apiKeyActions';
import {
    ALL_PERMISSIONS,
    type ApiKeyPermission,
    parseApiKeyPermissions,
} from '@/lib/apiKeyPermissions';
import type { ApikeyModel } from '@/app/client/generated/models/Apikey';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertTriangle } from 'lucide-react';

// ─── Helpers ─────────────────────────────────────────────────────────────────

function formatUtc(input: Date | string) {
    const d = new Date(input);
    const pad = (n: number) => n.toString().padStart(2, '0');
    return `${d.getUTCFullYear()}-${pad(d.getUTCMonth() + 1)}-${pad(d.getUTCDate())} ${pad(d.getUTCHours())}:${pad(d.getUTCMinutes())} UTC`;
}

const RATE_LIMIT_WINDOWS = [
    { label: '1s', ms: 1_000 },
    { label: '2s', ms: 2_000 },
    { label: '5s', ms: 5_000 },
    { label: '10s', ms: 10_000 },
    { label: '30s', ms: 30_000 },
    { label: '1min', ms: 60_000 },
    { label: '5min', ms: 300_000 },
    { label: '15min', ms: 900_000 },
    { label: '1h', ms: 3_600_000 },
] as const;

function formatRateLimit(max: number, windowMs: number): string {
    const w = RATE_LIMIT_WINDOWS.find((w) => w.ms === windowMs);
    return `${max} / ${w?.label ?? `${windowMs}ms`}`;
}

function getLastChars(metadata: string | null | undefined): string | null {
    if (!metadata) return null;
    try {
        return (JSON.parse(metadata) as { lastChars?: string }).lastChars ?? null;
    } catch {
        return null;
    }
}

// ─── Copy button ──────────────────────────────────────────────────────────────

function CopyButton({ value }: { value: string }) {
    const [copied, setCopied] = useState(false);

    async function handleCopy() {
        await navigator.clipboard.writeText(value);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    }

    return (
        <Button size="sm" variant="outline" onClick={handleCopy} className="shrink-0">
            {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
            <span className="ml-1.5">{copied ? 'Copied' : 'Copy'}</span>
        </Button>
    );
}

// ─── Create dialog ────────────────────────────────────────────────────────────

function CreateDialog({ onCreated }: { onCreated: () => void }) {
    const { toast } = useToast();
    const [open, setOpen] = useState(false);
    const [isPending, startTransition] = useTransition();
    const [name, setName] = useState('');
    const [selected, setSelected] = useState<Set<ApiKeyPermission>>(new Set());
    const [rateLimitMax, setRateLimitMax] = useState('10');
    const [rateLimitWindow, setRateLimitWindow] = useState('86400000');
    const [newKey, setNewKey] = useState<string | null>(null);

    function togglePermission(p: ApiKeyPermission) {
        setSelected((prev) => {
            const next = new Set(prev);
            next.has(p) ? next.delete(p) : next.add(p);
            return next;
        });
    }

    function handleOpen() {
        setName('');
        setSelected(new Set());
        setRateLimitMax('10');
        setRateLimitWindow('86400000');
        setNewKey(null);
        setOpen(true);
    }

    function handleClose() {
        if (isPending) return;
        setOpen(false);
        if (newKey) onCreated();
        setNewKey(null);
    }

    function handleCreate() {
        if (!name.trim() || selected.size === 0) return;
        startTransition(async () => {
            try {
                const result = await createApiKeyAction({
                    name: name.trim(),
                    permissions: Array.from(selected) as ApiKeyPermission[],
                    rateLimitMax: Math.max(1, parseInt(rateLimitMax, 10) || 10),
                    rateLimitTimeWindow: parseInt(rateLimitWindow, 10),
                });
                setNewKey(result.key);
                toast({ title: 'API key created', description: `"${name.trim()}" is ready.` });
            } catch (err) {
                toast({
                    title: 'Error',
                    description: err instanceof Error ? err.message : 'Unknown error',
                    variant: 'destructive',
                });
            }
        });
    }

    return (
        <>
            <Button onClick={handleOpen}>
                <Plus className="mr-2 h-4 w-4" />
                New API Key
            </Button>

            <Dialog
                open={open}
                onOpenChange={(v) => {
                    if (!v) handleClose();
                    else setOpen(true);
                }}
            >
                <DialogContent className="max-w-lg">
                    {newKey ? (
                        <>
                            <DialogHeader>
                                <DialogTitle>API Key Created</DialogTitle>
                                <DialogDescription>
                                    Copy the key now — it will not be shown again.
                                </DialogDescription>
                            </DialogHeader>

                            <div className="space-y-3 py-2">
                                <div className="flex items-center gap-2 rounded-md border bg-muted/50 px-3 py-2">
                                    <code className="flex-1 break-all font-mono text-sm">
                                        {newKey}
                                    </code>
                                    <CopyButton value={newKey} />
                                </div>
                            </div>

                            <DialogFooter>
                                <Button onClick={handleClose}>Done</Button>
                            </DialogFooter>
                        </>
                    ) : (
                        <>
                            <DialogHeader>
                                <DialogTitle>New API Key</DialogTitle>
                                <DialogDescription>
                                    Give the key a name and select its permissions.
                                </DialogDescription>
                            </DialogHeader>

                            <div className="space-y-5 py-2">
                                <div className="space-y-1.5">
                                    <Label htmlFor="key-name">Name</Label>
                                    <Input
                                        id="key-name"
                                        value={name}
                                        onChange={(e) => setName(e.target.value)}
                                        placeholder="e.g. Grafana Exporter"
                                        disabled={isPending}
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label>Permissions</Label>
                                    <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                                        {ALL_PERMISSIONS.map((p) => (
                                            <div key={p} className="flex items-center gap-2">
                                                <Checkbox
                                                    id={`perm-${p}`}
                                                    checked={selected.has(p)}
                                                    onCheckedChange={() => togglePermission(p)}
                                                    disabled={isPending}
                                                />
                                                <label
                                                    htmlFor={`perm-${p}`}
                                                    className="cursor-pointer font-mono text-xs"
                                                >
                                                    {p}
                                                </label>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                <div className="space-y-1.5">
                                    <Label>Rate limit</Label>
                                    <div className="flex items-center gap-2">
                                        <Input
                                            type="number"
                                            min={1}
                                            value={rateLimitMax}
                                            onChange={(e) => setRateLimitMax(e.target.value)}
                                            disabled={isPending}
                                            className="w-24"
                                        />
                                        <span className="text-sm text-muted-foreground">per</span>
                                        <Select
                                            value={rateLimitWindow}
                                            onValueChange={setRateLimitWindow}
                                            disabled={isPending}
                                        >
                                            <SelectTrigger className="w-28">
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {RATE_LIMIT_WINDOWS.map((w) => (
                                                    <SelectItem key={w.ms} value={String(w.ms)}>
                                                        {w.label}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                </div>
                            </div>

                            <DialogFooter>
                                <Button
                                    variant="outline"
                                    onClick={handleClose}
                                    disabled={isPending}
                                >
                                    Cancel
                                </Button>
                                <Button
                                    onClick={handleCreate}
                                    disabled={isPending || !name.trim() || selected.size === 0}
                                >
                                    {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                    Create
                                </Button>
                            </DialogFooter>
                        </>
                    )}
                </DialogContent>
            </Dialog>
        </>
    );
}

// ─── Delete button ────────────────────────────────────────────────────────────

function DeleteButton({ keyId, keyName }: { keyId: string; keyName: string }) {
    const router = useRouter();
    const { toast } = useToast();
    const [open, setOpen] = useState(false);
    const [isPending, startTransition] = useTransition();

    function handleDelete() {
        startTransition(async () => {
            try {
                await deleteApiKeyAction(keyId);
                setOpen(false);
                router.refresh();
                toast({ title: 'Deleted', description: `API key "${keyName}" removed.` });
            } catch (err) {
                toast({
                    title: 'Error',
                    description: err instanceof Error ? err.message : 'Unknown error',
                    variant: 'destructive',
                });
            }
        });
    }

    return (
        <>
            <Button size="sm" variant="destructive" onClick={() => setOpen(true)}>
                <Trash2 className="h-3.5 w-3.5" />
                <span className="ml-1.5 hidden sm:inline">Delete</span>
            </Button>

            <AlertDialog open={open} onOpenChange={(v) => !isPending && setOpen(v)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Delete API key?</AlertDialogTitle>
                        <AlertDialogDescription>
                            This will permanently revoke{' '}
                            <span className="font-semibold">{keyName}</span>. Any service using it
                            will lose access immediately.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel disabled={isPending}>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={handleDelete}
                            disabled={isPending}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        >
                            {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Delete
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </>
    );
}

// ─── Permissions cell ─────────────────────────────────────────────────────────

function PermissionsCell({ perms }: { perms: ApiKeyPermission[] }) {
    if (perms.length === 0) return <span className="text-xs text-muted-foreground">—</span>;

    const reads = perms
        .filter((p) => p.startsWith('read:'))
        .map((p) => p.slice('read:'.length))
        .join(', ');

    const writes = perms
        .filter((p) => p.startsWith('write:'))
        .map((p) => p.slice('write:'.length))
        .join(', ');

    return (
        <div className="space-y-0.5 text-xs">
            {reads && (
                <div>
                    <span className="text-muted-foreground">read{'  '}</span>
                    <span className="font-mono">{reads}</span>
                </div>
            )}
            {writes && (
                <div>
                    <span className="text-muted-foreground">write </span>
                    <span className="font-mono">{writes}</span>
                </div>
            )}
        </div>
    );
}

// ─── Main client ──────────────────────────────────────────────────────────────

interface Props {
    initialKeys: ApikeyModel[];
}

export default function ApiKeysClient({ initialKeys }: Props) {
    const router = useRouter();

    function handleCreated() {
        router.refresh();
    }

    return (
        <div className="space-y-4">
            <Alert
                className="border-yellow-500/50 bg-yellow-50 text-yellow-900 dark:bg-yellow-950 dark:text-yellow-100"
                variant={'destructive'}
            >
                <AlertTriangle className="h-4 w-4 text-yellow-600! dark:text-yellow-400!" />
                <AlertTitle>Warning</AlertTitle>
                <AlertDescription>
                    Ratelimits verhalten sich komisch, 5reqs/min heißt man muss 1min inaktiv sein
                    bevor man wieder requesten darf, oft ist ein limit wie 1req/sekunde besser
                </AlertDescription>
            </Alert>
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <KeyRound className="h-5 w-5 text-muted-foreground" />
                    <h1 className="text-lg font-semibold">API Keys</h1>
                    <span className="text-sm text-muted-foreground">({initialKeys.length})</span>
                </div>
                <CreateDialog onCreated={handleCreated} />
            </div>

            {initialKeys.length === 0 ? (
                <div className="flex flex-col items-center justify-center rounded-xl border border-dashed py-16 text-center text-muted-foreground">
                    <KeyRound className="mb-3 h-8 w-8 opacity-40" />
                    <p className="text-sm">No API keys yet. Create one to get started.</p>
                </div>
            ) : (
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Name</TableHead>
                            <TableHead>Key</TableHead>
                            <TableHead>Permissions</TableHead>
                            <TableHead>Rate limit</TableHead>
                            <TableHead>Usage</TableHead>
                            <TableHead>Created</TableHead>
                            <TableHead>Last used</TableHead>
                            <TableHead />
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {initialKeys.map((k) => {
                            const perms = parseApiKeyPermissions(k.permissions);
                            const last = getLastChars(k.metadata);
                            return (
                                <TableRow key={k.id}>
                                    <TableCell className="font-medium">
                                        {k.name ?? (
                                            <span className="text-muted-foreground italic">
                                                unnamed
                                            </span>
                                        )}
                                    </TableCell>
                                    <TableCell className="font-mono text-xs text-muted-foreground">
                                        {last ? `…${last}` : '—'}
                                    </TableCell>
                                    <TableCell>
                                        <PermissionsCell perms={perms} />
                                    </TableCell>
                                    <TableCell className="font-mono text-xs text-muted-foreground whitespace-nowrap">
                                        {formatRateLimit(k.rateLimitMax, k.rateLimitTimeWindow)}
                                    </TableCell>
                                    <TableCell className="font-mono text-xs text-muted-foreground whitespace-nowrap">
                                        {k.requestCount}
                                        <span className="text-muted-foreground/60">
                                            {' '}
                                            ({Math.round((k.requestCount / k.rateLimitMax) * 100)}%)
                                        </span>
                                        {k.remaining != null && (
                                            <span className="text-muted-foreground/60">
                                                {' '}
                                                / {k.remaining} left
                                            </span>
                                        )}
                                    </TableCell>
                                    <TableCell className="text-xs text-muted-foreground whitespace-nowrap">
                                        {formatUtc(k.createdAt)}
                                    </TableCell>
                                    <TableCell className="text-xs text-muted-foreground whitespace-nowrap">
                                        {k.lastRequest ? formatUtc(k.lastRequest) : '—'}
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <DeleteButton
                                            keyId={k.id}
                                            keyName={k.name ?? k.id.slice(0, 8)}
                                        />
                                    </TableCell>
                                </TableRow>
                            );
                        })}
                    </TableBody>
                </Table>
            )}
        </div>
    );
}
